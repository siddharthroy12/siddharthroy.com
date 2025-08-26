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
	router.NotFound = http.HandlerFunc(app.pageNotFoundHandler)
	router.MethodNotAllowed = http.HandlerFunc(app.methodNotAllowedHandler)

	return app.recoverPanic(router)
}
