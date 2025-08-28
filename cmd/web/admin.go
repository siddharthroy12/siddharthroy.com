package main

import "net/http"

func (app *application) adminPageHandler(w http.ResponseWriter, r *http.Request) {
	app.render(w, r, http.StatusOK, "admin.html", nil)
}
