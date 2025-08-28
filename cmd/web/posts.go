package main

import (
	"net/http"
)

func (app *application) createPostPageHandler(w http.ResponseWriter, r *http.Request) {
	app.render(w, r, 200, "posts.html", nil)
}

func (app *application) createPostHandler(w http.ResponseWriter, r *http.Request) {
	app.render(w, r, 200, "posts.html", nil)
}

func (app *application) updatePostPageHandler(w http.ResponseWriter, r *http.Request) {
	app.render(w, r, 200, "posts.html", nil)
}

func (app *application) deletePostHandler(w http.ResponseWriter, r *http.Request) {
	app.render(w, r, 200, "posts.html", nil)
}

func (app *application) postsPageHandler(w http.ResponseWriter, r *http.Request) {
	app.render(w, r, 200, "posts.html", nil)
}

func (app *application) postPageHandler(w http.ResponseWriter, r *http.Request) {
	app.render(w, r, 200, "posts.html", nil)
}
