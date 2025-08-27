package main

import (
	"fmt"
	"net/http"

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
