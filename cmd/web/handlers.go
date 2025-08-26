package main

import "net/http"

type Project struct {
	Name        string
	Description string
	Link        string
}

type PageData struct {
	Projects []Project
}

func (app *application) homePageHandler(w http.ResponseWriter, r *http.Request) {
	data := app.newTemplateData()

	pageData := PageData{
		Projects: []Project{
			{Name: "GlobeChat", Description: "Chats on world map", Link: "https://globechat.live"},
			{Name: "Links Explorer", Description: "View Interactive graph of links", Link: "https://github.com/siddharthroy12/links_explorer"},
			{Name: "Timebrew", Description: "A personal time tracker", Link: "https://github.com/siddharthroy12/timebrew"},
			{Name: "Gravity sandbox", Description: "2D Newtonian gravity simulator", Link: "https://github.com/siddharthroy12/Gravity-Sandbox"},
			{Name: "Rockets", Description: "Dodge rockets in retro style", Link: "https://www.lexaloffle.com/bbs/?pid=111184"},
		},
	}

	data.Page = pageData

	app.render(w, r, 200, "index.html", data)
}

func (app *application) postsPageHandler(w http.ResponseWriter, r *http.Request) {
	data := app.newTemplateData()

	app.render(w, r, 200, "posts.html", data)
}

func (app *application) petPicturesPageHandler(w http.ResponseWriter, r *http.Request) {
	data := app.newTemplateData()

	app.render(w, r, 200, "katrina.html", data)
}

func (app *application) drawingsPageHandler(w http.ResponseWriter, r *http.Request) {
	data := app.newTemplateData()

	app.render(w, r, 200, "sketches.html", data)
}

func (app *application) pageNotFoundHandler(w http.ResponseWriter, r *http.Request) {
	data := app.newTemplateData()

	app.render(w, r, 200, "sketches.html", data)
}

func (app *application) methodNotAllowedHandler(w http.ResponseWriter, r *http.Request) {
	data := app.newTemplateData()

	app.render(w, r, 200, "sketches.html", data)
}
