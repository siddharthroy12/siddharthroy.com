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
	app.sessionManager.Put(r.Context(), (authenticatedUserIDContextKey), id)
	return nil
}

func (app *application) isAuthenticated(r *http.Request) bool {
	isAuthenticated, ok := r.Context().Value(isAuthenticatedContextKey).(bool)

	if !ok {
		return false
	}
	return isAuthenticated
}

func (app *application) isAdmin(r *http.Request) bool {
	isAuthenticated, ok := r.Context().Value(isAdminContextKey).(bool)

	if !ok {
		return false
	}
	return isAuthenticated
}

func (app *application) getUserFromRequest(r *http.Request) (models.User, error) {
	user, ok := r.Context().Value(userContextkey).(models.User)

	if !ok {
		return models.User{}, fmt.Errorf("user not logged in")
	}
	return user, nil
}

func (app *application) requireAuthenticated(next http.HandlerFunc) http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		ok := app.isAuthenticated(r)

		if !ok {
			http.Redirect(w, r, "/not-authorized", http.StatusSeeOther)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (app *application) requireAdmin(next http.HandlerFunc) http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		ok := app.isAdmin(r)

		if !ok {
			http.Redirect(w, r, "/not-authorized", http.StatusSeeOther)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (app *application) logoutHandler(w http.ResponseWriter, r *http.Request) {
	err := app.sessionManager.RenewToken(r.Context())

	if err != nil {
		app.serverError(w, r, err)
	}

	app.sessionManager.Remove(r.Context(), authenticatedUserIDContextKey)
	app.setFlash(r, "You've been logged out successfully!")
	referer := r.Header.Get("referer")

	if referer != "" {
		http.Redirect(w, r, referer, http.StatusSeeOther)
	} else {
		http.Redirect(w, r, "/", http.StatusSeeOther)

	}
}

func (app *application) loginWihGoogleHandler(w http.ResponseWriter, r *http.Request) {

	var input struct {
		Token string `json:"token"`
	}

	err := app.readJSONFromRequest(w, r, &input)
	if err != nil {
		app.badRequestResponseJSON(w, r, fmt.Errorf("nice try"))
		return
	}

	if strings.TrimSpace(input.Token) == "" {
		app.badRequestResponseJSON(w, r, fmt.Errorf("are you trying to login without jwt token? are you fr?"))
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
		app.serverErrorResponseJSON(w, r, err, "google login api call")
		return
	}

	if res.StatusCode != 200 {
		app.badRequestResponseJSON(w, r, fmt.Errorf("nice try dude"))
		return
	}
	err = app.readJSON(res.Body, &responseData)

	if err != nil || res.StatusCode != 200 {
		app.serverErrorResponseJSON(w, r, err, "read json")
		return
	}

	if responseData.Aud != app.config.googleClientId {
		app.badRequestResponseJSON(w, r, fmt.Errorf("do you think you are smarter than me?"))
		return
	}

	if !slices.Contains([]string{"accounts.google.com", "https://accounts.google.com"}, responseData.Iss) {
		app.badRequestResponseJSON(w, r, fmt.Errorf("is google drunk or are you doing something fishy?"))
		return
	}

	user, err := app.users.GetByEmail(responseData.Email)
	if err != nil {
		if errors.Is(err, models.ErrNoRecord) {
			user, err := app.users.Create(responseData.Email, responseData.Name)

			if err != nil {
				app.serverErrorResponseJSON(w, r, err, "create user")
				return
			}

			err = app.loginUserId(r, user.ID)

			if err != nil {
				app.serverErrorResponseJSON(w, r, err, "setting user id in session")
				return
			}

			app.writeJSON(w, 200, envelope{"account": user}, nil)
			return
		} else {
			app.serverErrorResponseJSON(w, r, err, "get user by email")
			return
		}
	}

	err = app.loginUserId(r, user.ID)

	if err != nil {
		app.serverErrorResponseJSON(w, r, err, "setting user id in session")
		return
	}

	app.writeJSON(w, 200, envelope{"account": user}, nil)
}
