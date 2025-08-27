package main

import (
	"errors"
	"fmt"
	"net/http"
	"slices"
	"strings"

	"siddharthroy.com/internal/models"
)

func (app *application) loginUserId(r *http.Request, id int) error {
	err := app.sessionManager.RenewToken(r.Context())
	if err != nil {
		return err
	}
	app.sessionManager.Put(r.Context(), string(authenticatedUserIDContextKey), id)
	return nil
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
			user, err := app.users.Create(responseData.Email, "")

			if err != nil {
				app.serverErrorResponse(w, r, err, "create user")
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
