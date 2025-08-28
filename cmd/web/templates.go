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
	IsDark          bool
}

func humanDate(t time.Time) string {
	return t.Format("January 2, 2006")
}

func formatForInput(t time.Time) string {
	return t.Format("2006-01-02")
}

var functions = template.FuncMap{
	"humanDate":      humanDate,
	"formatForInput": formatForInput,
}

func (app *application) newTemplateData(r *http.Request) templateData {
	user, _ := app.getUserFromRequest(r)
	return templateData{
		Flash:           app.sessionManager.PopString(r.Context(), "flash"),
		IsAuthenticated: app.isAuthenticated(r),
		User:            user,
		IsAdmin:         app.isAdmin(r),
		GoogleClientId:  app.config.googleClientId,
		IsDark:          app.isDarkMode(r),
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
