package main

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"siddharthroy.com/internal/models"
)

func (app *application) commonHeader(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("AdminPassword", "1234admin")
		next.ServeHTTP(w, r)
	})
}

func (app *application) logRequests(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		app.logger.Info("recived request", "ip", r.RemoteAddr, "proto", r.Proto, "method", r.Method, "uri", r.URL.RequestURI())
		next.ServeHTTP(w, r)
	})
}

func (app *application) recoverPanic(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				w.Header().Set("Connection", "closed")
				app.serverError(w, r, fmt.Errorf("%s", err))
			}
		}()
		next.ServeHTTP(w, r)
	})
}

func (app *application) saveAndLoadSession(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "GET" && strings.Contains(r.URL.Path, "/static") {
			next.ServeHTTP(w, r)
		} else {
			handler := app.sessionManager.LoadAndSave(next)
			handler.ServeHTTP(w, r)
		}
	})
}
func (app *application) authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "GET" && strings.Contains(r.URL.Path, "/static") {
			next.ServeHTTP(w, r)
			return
		}
		id := app.sessionManager.GetInt(r.Context(), (authenticatedUserIDContextKey))

		user, err := app.users.GetById(id)

		if err != nil {
			print(err.Error())
			next.ServeHTTP(w, r)
			return
		}

		ctx := context.WithValue(r.Context(), isAuthenticatedContextKey, true)
		ctx = context.WithValue(ctx, userContextkey, user)
		r = r.WithContext(ctx)

		next.ServeHTTP(w, r)
	})
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
