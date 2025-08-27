package main

import (
	"fmt"
	"net/http"
)

var ErrInvalidToken = fmt.Errorf("invalid token")
var ErrFileSizeTooBig = fmt.Errorf("file size is too big")
var ErrInvalidInput = fmt.Errorf("invalid input")

func (app *application) logError(r *http.Request, err error, action string) {
	var (
		method = r.Method
		uri    = r.URL.RequestURI()
	)

	app.logger.Error(err.Error(), "method", method, "uri", uri, "action", action)
}

func (app *application) errorResponse(w http.ResponseWriter, r *http.Request, status int, message any) {
	env := envelope{"error": message}

	err := app.writeJSON(w, status, env, nil)

	if err != nil {
		app.logError(r, err, "errorResponse")
		w.WriteHeader(500)
	}
}

func (app *application) badRequestResponseJSON(w http.ResponseWriter, r *http.Request, err error) {
	app.errorResponse(w, r, http.StatusBadRequest, err.Error())
}

func (app *application) serverErrorResponseJSON(w http.ResponseWriter, r *http.Request, err error, action string) {
	app.logError(r, err, action)
	message := "this server encountered a problem and could not process your request"
	app.errorResponse(w, r, http.StatusInternalServerError, message)
}

func (app *application) serverErrorResponse(w http.ResponseWriter, r *http.Request, err error, action string) {
	app.logError(r, err, action)
	app.render(w, r, http.StatusInternalServerError, "server-error.html", nil)
}

func (app *application) notFoundResponse(w http.ResponseWriter, r *http.Request) {
	app.render(w, r, http.StatusNotFound, "404.html", nil)
}

func (app *application) notFoundResponseJSON(w http.ResponseWriter, r *http.Request) {
	app.errorResponse(w, r, http.StatusBadRequest, fmt.Errorf("not found"))
}

func (app *application) pageNotFoundHandler(w http.ResponseWriter, r *http.Request) {
	app.notFoundResponse(w, r)
}

func (app *application) methodNotAllowedHandler(w http.ResponseWriter, r *http.Request) {
	app.render(w, r, http.StatusMethodNotAllowed, "method-not-allowed.html", nil)
}
