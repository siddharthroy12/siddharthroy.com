package main

import "net/http"

type Project struct {
	Name        string
	Description string
	Link        string
}

type HomePageData struct {
	Projects []Project
}

func (app *application) homePageHandler(w http.ResponseWriter, r *http.Request) {
	pageData := HomePageData{
		Projects: []Project{
			{Name: "Noa", Description: "A dynamically type interpreted language", Link: "https://github.com/siddharthroy12/noa"},
			{Name: "GlobeChat", Description: "Chats on world map", Link: "https://globechat.live"},
			{Name: "Links Explorer", Description: "View Interactive graph of links", Link: "https://github.com/siddharthroy12/links_explorer"},
			{Name: "Timebrew", Description: "A personal time tracker", Link: "https://github.com/siddharthroy12/timebrew"},
			{Name: "Gravity sandbox", Description: "2D Newtonian gravity simulator", Link: "https://github.com/siddharthroy12/Gravity-Sandbox"},
			{Name: "Rockets", Description: "Dodge rockets in retro style", Link: "https://www.lexaloffle.com/bbs/?pid=111184"},
		},
	}

	app.render(w, r, 200, "index.html", pageData)
}
