package main

import "net/http"

func (app *application) toggleThemePrefrenceHandler(w http.ResponseWriter, r *http.Request) {
	app.sessionManager.Put(r.Context(), (isDarkMode), !app.isDarkMode(r))
	app.writeJSON(w, http.StatusOK, envelope{"message": "updated"}, nil)
}
