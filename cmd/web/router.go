package main

import (
	"net/http"

	"github.com/julienschmidt/httprouter"
	"siddharthroy.com/ui"
)

func (app *application) routes() http.Handler {
	router := httprouter.New()

	fileServer := http.FileServerFS(ui.Files)

	// Static files
	router.Handler(http.MethodGet, "/static/*filepath", fileServer)

	// Home page
	router.HandlerFunc(http.MethodGet, "/", app.homePageHandler)

	// Posts
	router.HandlerFunc(http.MethodGet, "/posts", app.postsPageHandler)
	router.HandlerFunc(http.MethodGet, "/post/:slug", app.postPageHandler)

	router.HandlerFunc(http.MethodDelete, "/post/:slug", app.requireAdmin(app.deletePostHandler))

	router.HandlerFunc(http.MethodGet, "/create-post", app.requireAdmin(app.createPostPageHandler))
	router.HandlerFunc(http.MethodPost, "/create-post", app.requireAdmin(app.createPostHandler))

	router.HandlerFunc(http.MethodGet, "/edit-post/:slug", app.requireAdmin(app.updatePostPageHandler))
	router.HandlerFunc(http.MethodPost, "/edit-post/:slug", app.requireAdmin(app.updatePostHandler))

	// Prefrences
	router.HandlerFunc(http.MethodPut, "/toggledark", app.toggleThemePrefrenceHandler)

	// Image gallery
	router.HandlerFunc(http.MethodGet, "/media/*filepath", app.mediaHandler)
	router.HandlerFunc(http.MethodDelete, "/media/*filepath", app.requireAdmin(app.deleteMediaHandler))
	router.HandlerFunc(http.MethodPost, "/katrina", app.requireAdmin(app.uploadKatrinaPicHandler))
	router.HandlerFunc(http.MethodGet, "/katrina", app.petPicturesPageHandler)
	router.HandlerFunc(http.MethodGet, "/sketches", app.drawingsPageHandler)
	router.HandlerFunc(http.MethodPost, "/sketches", app.requireAdmin(app.uploadSketchHandler))

	// Auth
	router.HandlerFunc(http.MethodPost, "/login", app.loginWihGoogleHandler)
	router.HandlerFunc(http.MethodGet, "/logout", app.requireAuthenticated(app.logoutHandler))

	// Admin
	router.HandlerFunc(http.MethodGet, "/admin", (app.adminPageHandler))

	// Other
	router.HandlerFunc(http.MethodGet, "/not-authorized", app.notAuthorizedHanlder)
	router.NotFound = http.HandlerFunc(app.pageNotFoundHandler)
	router.MethodNotAllowed = http.HandlerFunc(app.methodNotAllowedHandler)

	return app.recoverPanic(app.logRequests(app.commonHeader(app.saveAndLoadSession(app.authenticate((router))))))
}
