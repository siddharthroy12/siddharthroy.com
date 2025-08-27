package main

import (
	"io/fs"
	"net/http"
	"path/filepath"
	"text/template"
	"time"

	"siddharthroy.com/internal/models"
	"siddharthroy.com/ui"
)

type templateData struct {
	Page            any
	Flash           string
	IsAuthenticated bool
	User            models.User
	IsAdmin         bool
	GoogleClientId  string
}

func humanDate(t time.Time) string {
	return t.Format("02 Jan 2006 at 15:04")
}

var functions = template.FuncMap{
	"humanDate": humanDate,
}

func (app *application) newTemplateData(r *http.Request) templateData {
	user, _ := app.getUserFromRequest(r)
	return templateData{
		Flash:           app.sessionManager.PopString(r.Context(), "flash"),
		IsAuthenticated: app.isAuthenticated(r),
		User:            user,
		GoogleClientId:  app.config.googleClientId,
	}
}

type templateCache map[string]*template.Template

func newTemplateCache() (templateCache, error) {
	cache := map[string]*template.Template{}

	pages, err := fs.Glob(ui.Files, "html/pages/*.html")

	if err != nil {
		return nil, err
	}

	for _, page := range pages {
		name := filepath.Base(page)

		patterns := []string{
			"html/base.html",
			"html/partials/*.html",
			page,
		}

		ts, err := template.New(name).Funcs(functions).ParseFS(ui.Files, patterns...)

		if err != nil {
			return nil, err
		}

		cache[name] = ts
	}

	return cache, nil
}
