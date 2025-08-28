package models

import (
	"database/sql"
	"errors"
	"time"
)

type Post struct {
	ID        int
	Title     string
	Slug      string
	Content   string
	CreatedAt time.Time
	IsDraft   bool
}

type PostModel struct {
	DB *sql.DB
}

func (m *PostModel) getPostFromRow(row *sql.Row) (Post, error) {
	var p Post

	err := row.Scan(&p.ID, &p.Title, &p.Slug, &p.Content, &p.CreatedAt, &p.IsDraft)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Post{}, ErrNoRecord
		}
		return Post{}, err
	}

	return p, nil
}

func (m PostModel) Insert(title string, slug string, content string, createdAt time.Time, isDraft bool) (Post, error) {
	stmt := "INSERT INTO posts (title, slug, content, created_at, is_draft) VALUES($1, $2, $3, $4) RETURNING id, title, slug, content, created_at, is_draft"

	row := m.DB.QueryRow(stmt, title, slug, content, createdAt, isDraft)

	post, err := m.getPostFromRow(row)
	if err != nil {
		return Post{}, err
	}

	return post, nil
}

func (m PostModel) Update(postId int, title string, slug string, content string, createdAt time.Time, isDraft bool) (Post, error) {
	stmt := "UPDATE posts SET title = $2, slug = $3, content = $4, created_at = $5 is_draft = $6 WHERE id = $1 RETURNING id, title, slug, content, created_at, is_draft"

	row := m.DB.QueryRow(stmt, postId, title, slug, content, createdAt, isDraft)

	post, err := m.getPostFromRow(row)
	if err != nil {
		return Post{}, err
	}

	return post, nil
}

func (m *PostModel) GetById(postId int) (Post, error) {
	stmt := "SELECT id, title, slug, content, created_at, is_draft FROM posts WHERE id = $1"
	row := m.DB.QueryRow(stmt, postId)
	return m.getPostFromRow(row)
}

func (m *PostModel) GetBySlug(slug string) (Post, error) {
	stmt := "SELECT id, title, slug, content, created_at, is_draft FROM posts WHERE slug = $1"
	row := m.DB.QueryRow(stmt, slug)
	return m.getPostFromRow(row)
}

func (m *PostModel) Delete(postId int) error {
	stmt := "DELETE FROM posts WHERE id = $1"

	_, err := m.DB.Exec(stmt, postId)

	if err != nil {
		return err
	}

	return nil
}
