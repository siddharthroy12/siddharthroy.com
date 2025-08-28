package main

import (
	"fmt"
	"net/http"
	"time"

	"siddharthroy.com/internal/models"
	"siddharthroy.com/internal/slug"
	"siddharthroy.com/internal/validator"
)

type PostForm struct {
	Title               string    `form:"title"`
	CreatedAt           time.Time `form:"created_at"`
	IsDraft             bool      `form:"is_draft"`
	Content             string    `form:"content"`
	validator.Validator `form:"_"`
}

type PostFormPageData struct {
	Form   PostForm
	Action string
}

type PostsPageData struct {
	Posts []models.Post
}

type PostPageData struct {
	Post models.Post
}

func validatePostForm(form PostForm) bool {

	form.CheckField(validator.NotBlank(form.Title), "title", "This field cannot be blank")
	form.CheckField(validator.MaxChars(form.Title, 100), "title", "This field cannot be more than 100 characters long")
	form.CheckField(validator.NotBlank(form.Content), "content", "This field cannot be blank")

	return form.Valid()
}

func (app *application) createPostPageHandler(w http.ResponseWriter, r *http.Request) {
	pageData := PostFormPageData{
		Form: PostForm{
			Title:     "",
			CreatedAt: time.Now(),
			IsDraft:   true,
			Content:   "",
		},
		Action: "/create-post",
	}
	app.render(w, r, 200, "create-post.html", pageData)
}

func (app *application) createPostHandler(w http.ResponseWriter, r *http.Request) {
	var form PostForm

	err := app.decodePostForm(r, &form)
	if err != nil {
		app.clientErrorResponse(w, http.StatusBadRequest)
		return
	}

	if !validatePostForm(form) {
		pageData := PostFormPageData{
			Form:   form,
			Action: "/create-post",
		}
		app.render(w, r, http.StatusUnprocessableEntity, "create-post.html", pageData)
		return
	}

	slug := slug.GenerateSlug(form.Title)

	post, err := app.posts.Insert(form.Title, slug, form.Content, form.CreatedAt, form.IsDraft)

	if err != nil {
		app.serverErrorResponse(w, r, err, "inserting post")
		return
	}

	app.setFlash(r, "Post Created!")
	http.Redirect(w, r, fmt.Sprintf("/post/%s", post.Slug), http.StatusSeeOther)
}

func (app *application) updatePostPageHandler(w http.ResponseWriter, r *http.Request) {
	slug := app.readParam(r, "slug")

	post, err := app.posts.GetBySlug(slug)

	if err != nil {
		app.notFoundResponse(w, r)
		return
	}

	pageData := PostFormPageData{
		Form: PostForm{
			Title:     post.Title,
			CreatedAt: post.CreatedAt,
			IsDraft:   post.IsDraft,
			Content:   post.Content,
		},
		Action: fmt.Sprintf("/edit-post/%s", slug),
	}
	app.render(w, r, 200, "create-post.html", pageData)
}

func (app *application) updatePostHandler(w http.ResponseWriter, r *http.Request) {
	slug := app.readParam(r, "slug")
	var form PostForm

	err := app.decodePostForm(r, &form)
	if err != nil {
		app.clientErrorResponse(w, http.StatusBadRequest)
		return
	}

	if !validatePostForm(form) {
		pageData := PostFormPageData{
			Form:   form,
			Action: fmt.Sprintf("/edit-post/%s", slug),
		}
		app.render(w, r, http.StatusUnprocessableEntity, "create-post.html", pageData)
		return
	}

	post, err := app.posts.Update(slug, form.Title, form.Content, form.CreatedAt, form.IsDraft)

	if err != nil {
		app.serverErrorResponse(w, r, err, "updating post")
		return
	}

	app.setFlash(r, "Post Updated!")
	http.Redirect(w, r, fmt.Sprintf("/post/%s", post.Slug), http.StatusSeeOther)
}

func (app *application) deletePostHandler(w http.ResponseWriter, r *http.Request) {
	app.render(w, r, 200, "posts.html", nil)
	slug := app.readParam(r, "slug")

	err := app.posts.DeleteBySlug(slug)
	if err != nil {
		app.serverErrorResponse(w, r, err, "delete post")
		return
	}

	http.Redirect(w, r, "/posts", http.StatusSeeOther)
}

func (app *application) postsPageHandler(w http.ResponseWriter, r *http.Request) {
	isAdmin := app.isAdmin(r)

	posts, err := app.posts.GetAll(isAdmin)
	if err != nil {
		app.serverErrorResponse(w, r, err, "get posts")
		return
	}

	data := PostsPageData{
		Posts: posts,
	}

	app.render(w, r, 200, "posts.html", data)
}

func (app *application) postPageHandler(w http.ResponseWriter, r *http.Request) {
	slug := app.readParam(r, "slug")

	post, err := app.posts.GetBySlug(slug)

	if err != nil {
		app.notFoundResponse(w, r)
		return
	}

	post.Content = string(app.markdownRenderer.renderMarkdown([]byte(post.Content)))

	data := PostPageData{
		Post: post,
	}
	app.render(w, r, 200, "post.html", data)
}
