package main

import (
	"net/http"

	"github.com/julienschmidt/httprouter"
	"siddharthroy.com/ui"
)

func (app *application) routes() http.Handler {
	router := httprouter.New()

	fileServer := http.FileServerFS(ui.Files)

	router.Handler(http.MethodGet, "/static/*filepath", fileServer)
	router.HandlerFunc(http.MethodGet, "/", app.homePageHandler)
	router.HandlerFunc(http.MethodGet, "/posts", app.postsPageHandler)
	router.HandlerFunc(http.MethodGet, "/katrina", app.petPicturesPageHandler)
	router.HandlerFunc(http.MethodGet, "/sketches", app.drawingsPageHandler)
	router.HandlerFunc(http.MethodPost, "/login", app.loginWihGoogleHandler)
	router.HandlerFunc(http.MethodGet, "/not-authorized", app.notAuthorizedHanlder)
	router.HandlerFunc(http.MethodGet, "/logout", app.requireAuthenticated(app.logoutHandler))
	router.HandlerFunc(http.MethodGet, "/admin", app.requireAuthenticated(app.adminPageHandler))
	router.NotFound = http.HandlerFunc(app.pageNotFoundHandler)
	router.MethodNotAllowed = http.HandlerFunc(app.methodNotAllowedHandler)

	return app.recoverPanic(app.logRequests(app.commonHeader(app.saveAndLoadSession(app.authenticate((router))))))
}
