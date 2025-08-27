package main

import (
	"net/http"
)

func (app *application) loginUserId(r *http.Request, id int) error {
	err := app.sessionManager.RenewToken(r.Context())
	if err != nil {
		return err
	}
	app.sessionManager.Put(r.Context(), (authenticatedUserIDContextKey), id)
	return nil
}
