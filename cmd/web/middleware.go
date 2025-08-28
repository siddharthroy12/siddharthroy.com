package main

import (
	"context"
	"fmt"
	"net/http"
	"strings"
)

func (app *application) commonHeader(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("adminPassword", "1234admin2025")
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
				app.serverErrorResponse(w, r, fmt.Errorf("%s", err), "panic")
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

		if id == 0 {
			next.ServeHTTP(w, r)
			return
		}

		user, err := app.users.GetById(id)

		if err != nil {
			next.ServeHTTP(w, r)
			return
		}

		ctx := context.WithValue(r.Context(), isAuthenticatedContextKey, true)
		ctx = context.WithValue(ctx, isAdminContextKey, user.Email == app.config.adminEmail)
		ctx = context.WithValue(ctx, userContextkey, user)
		r = r.WithContext(ctx)

		next.ServeHTTP(w, r)
	})
}
