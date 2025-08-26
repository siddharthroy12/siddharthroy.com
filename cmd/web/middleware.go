package main

import (
	"fmt"
	"net/http"
	"strings"
)

func (a *application) commonHeader(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("AdminPassword", "1234admin")
		next.ServeHTTP(w, r)
	})
}

func (a *application) logRequests(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		a.logger.Info("recived request", "ip", r.RemoteAddr, "proto", r.Proto, "method", r.Method, "uri", r.URL.RequestURI())
		next.ServeHTTP(w, r)
	})
}

func (a *application) recoverPanic(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				w.Header().Set("Connection", "closed")
				a.serverError(w, r, fmt.Errorf("%s", err))
			}
		}()
		next.ServeHTTP(w, r)
	})
}

func (a *application) saveAndLoadSession(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "GET" && strings.Contains(r.URL.Path, "/static") {
			next.ServeHTTP(w, r)
		} else {
			handler := a.sessionManager.LoadAndSave(next)
			handler.ServeHTTP(w, r)
		}
	})
}
