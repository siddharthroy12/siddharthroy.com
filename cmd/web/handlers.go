package main

import (
	"errors"
	"fmt"
	"net/http"
	"slices"
	"strings"

	"siddharthroy.com/internal/models"
	"siddharthroy.com/internal/validator"
)

type Project struct {
	Name        string
	Description string
	Link        string
}

type HomePageData struct {
	Projects []Project
}

type SignupForm struct {
	Name                string `form:"title"`
	Email               string `form:"content"`
	Password            string `from:"expires"`
	validator.Validator `form:"_"`
}

func (app *application) homePageHandler(w http.ResponseWriter, r *http.Request) {
	pageData := HomePageData{
		Projects: []Project{
			{Name: "GlobeChat", Description: "Chats on world map", Link: "https://globechat.live"},
			{Name: "Links Explorer", Description: "View Interactive graph of links", Link: "https://github.com/siddharthroy12/links_explorer"},
			{Name: "Timebrew", Description: "A personal time tracker", Link: "https://github.com/siddharthroy12/timebrew"},
			{Name: "Gravity sandbox", Description: "2D Newtonian gravity simulator", Link: "https://github.com/siddharthroy12/Gravity-Sandbox"},
			{Name: "Rockets", Description: "Dodge rockets in retro style", Link: "https://www.lexaloffle.com/bbs/?pid=111184"},
		},
	}

	app.render(w, r, 200, "index.html", pageData)
}

func (app *application) postsPageHandler(w http.ResponseWriter, r *http.Request) {
	app.render(w, r, 200, "posts.html", nil)
}

func (app *application) petPicturesPageHandler(w http.ResponseWriter, r *http.Request) {

	app.render(w, r, 200, "katrina.html", nil)
}

func (app *application) drawingsPageHandler(w http.ResponseWriter, r *http.Request) {

	app.render(w, r, 200, "sketches.html", nil)
}

func (app *application) adminPageHandler(w http.ResponseWriter, r *http.Request) {
	app.render(w, r, http.StatusOK, "admin.html", nil)
}

func (app *application) notAuthorizedHanlder(w http.ResponseWriter, r *http.Request) {
	app.render(w, r, http.StatusOK, "not-authorized.html", nil)
}

func (app *application) logoutHandler(w http.ResponseWriter, r *http.Request) {
	err := app.sessionManager.RenewToken(r.Context())

	if err != nil {
		app.serverError(w, r, err)
	}

	app.sessionManager.Remove(r.Context(), authenticatedUserIDContextKey)
	app.setFlash(r, "You've been logged out successfully!")
	http.Redirect(w, r, "/", http.StatusSeeOther)
}

func (app *application) loginWihGoogleHandler(w http.ResponseWriter, r *http.Request) {

	var input struct {
		Token string `json:"token"`
	}

	err := app.readJSONFromRequest(w, r, &input)
	if err != nil {
		app.badRequestResponse(w, r, fmt.Errorf("nice try"))
		return
	}

	if strings.TrimSpace(input.Token) == "" {
		app.badRequestResponse(w, r, fmt.Errorf("are you trying to login without jwt token? are you fr?"))
		return
	}

	var responseData struct {
		Aud   string `json:"aud"`
		Iss   string `json:"iss"`
		Email string `json:"email"`
		Name  string `json:"name"`
	}

	res, err := http.Get(fmt.Sprintf("https://oauth2.googleapis.com/tokeninfo?id_token=%s", input.Token))

	if err != nil {
		app.serverErrorResponse(w, r, err, "google login api call")
		return
	}

	if res.StatusCode != 200 {
		app.badRequestResponse(w, r, fmt.Errorf("nice try dude"))
		return
	}
	err = app.readJSON(res.Body, &responseData)

	if err != nil || res.StatusCode != 200 {
		app.serverErrorResponse(w, r, err, "read json")
		return
	}

	if responseData.Aud != app.config.googleClientId {
		app.badRequestResponse(w, r, fmt.Errorf("do you think you are smarter than me?"))
		return
	}

	if !slices.Contains([]string{"accounts.google.com", "https://accounts.google.com"}, responseData.Iss) {
		app.badRequestResponse(w, r, fmt.Errorf("is google drunk or are you doing something fishy?"))
		return
	}

	user, err := app.users.GetByEmail(responseData.Email)
	if err != nil {
		if errors.Is(err, models.ErrNoRecord) {
			user, err := app.users.Create(responseData.Email, responseData.Name)

			if err != nil {
				app.serverErrorResponse(w, r, err, "create user")
				return
			}

			err = app.loginUserId(r, user.ID)

			if err != nil {
				app.serverErrorResponse(w, r, err, "setting user id in session")
				return
			}

			app.writeJSON(w, 200, envelope{"account": user}, nil)
			return
		} else {
			app.serverErrorResponse(w, r, err, "get user by email")
			return
		}
	}

	err = app.loginUserId(r, user.ID)

	if err != nil {
		app.serverErrorResponse(w, r, err, "setting user id in session")
		return
	}

	app.writeJSON(w, 200, envelope{"account": user}, nil)
}
