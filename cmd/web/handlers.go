package main

import (
	"net/http"

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
	data := app.newTemplateData(r)

	pageData := HomePageData{
		Projects: []Project{
			{Name: "GlobeChat", Description: "Chats on world map", Link: "https://globechat.live"},
			{Name: "Links Explorer", Description: "View Interactive graph of links", Link: "https://github.com/siddharthroy12/links_explorer"},
			{Name: "Timebrew", Description: "A personal time tracker", Link: "https://github.com/siddharthroy12/timebrew"},
			{Name: "Gravity sandbox", Description: "2D Newtonian gravity simulator", Link: "https://github.com/siddharthroy12/Gravity-Sandbox"},
			{Name: "Rockets", Description: "Dodge rockets in retro style", Link: "https://www.lexaloffle.com/bbs/?pid=111184"},
		},
	}

	data.Page = pageData

	app.render(w, r, 200, "index.html", data)
}

func (app *application) postsPageHandler(w http.ResponseWriter, r *http.Request) {
	data := app.newTemplateData(r)

	app.render(w, r, 200, "posts.html", data)
}

func (app *application) petPicturesPageHandler(w http.ResponseWriter, r *http.Request) {
	data := app.newTemplateData(r)

	app.render(w, r, 200, "katrina.html", data)
}

func (app *application) drawingsPageHandler(w http.ResponseWriter, r *http.Request) {
	data := app.newTemplateData(r)

	app.render(w, r, 200, "sketches.html", data)
}

func (app *application) signupPageHandler(w http.ResponseWriter, r *http.Request) {
	data := app.newTemplateData(r)
	data.Form = SignupForm{}
	app.render(w, r, http.StatusOK, "signup.html", data)
}

func (app *application) adminPageHandler(w http.ResponseWriter, r *http.Request) {
	data := app.newTemplateData(r)
	data.Form = SignupForm{}
	app.render(w, r, http.StatusOK, "admin.html", data)
}

func (app *application) notAuthorizedHanlder(w http.ResponseWriter, r *http.Request) {
	data := app.newTemplateData(r)
	data.Form = SignupForm{}
	app.render(w, r, http.StatusOK, "not-authorized.html", data)
}

func (app *application) logoutHandler(w http.ResponseWriter, r *http.Request) {
	err := app.sessionManager.RenewToken(r.Context())

	if err != nil {
		app.serverError(w, r, err)
	}

	app.sessionManager.Remove(r.Context(), "authenticatedUserId")

	app.sessionManager.Put(r.Context(), "flash", "You've been logged out successfully!")
	http.Redirect(w, r, "/", http.StatusSeeOther)
}
