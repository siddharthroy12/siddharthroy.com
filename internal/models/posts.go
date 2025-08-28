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

// Helper function to scan posts from rows (for multiple results) - without content
func (m *PostModel) getPostsFromRows(rows *sql.Rows) ([]Post, error) {
	var posts []Post

	for rows.Next() {
		var p Post
		err := rows.Scan(&p.ID, &p.Title, &p.Slug, &p.CreatedAt, &p.IsDraft)
		if err != nil {
			return nil, err
		}
		posts = append(posts, p)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return posts, nil
}

func (m PostModel) Insert(title string, slug string, content string, createdAt time.Time, isDraft bool) (Post, error) {
	stmt := "INSERT INTO posts (title, slug, content, created_at, is_draft) VALUES($1, $2, $3, $4, $5) RETURNING id, title, slug, content, created_at, is_draft"

	row := m.DB.QueryRow(stmt, title, slug, content, createdAt, isDraft)

	post, err := m.getPostFromRow(row)
	if err != nil {
		return Post{}, err
	}

	return post, nil
}

func (m PostModel) Update(slug string, title string, content string, createdAt time.Time, isDraft bool) (Post, error) {
	stmt := "UPDATE posts SET title = $2, content = $3, created_at = $4, is_draft = $5 WHERE slug = $1 RETURNING id, title, slug, content, created_at, is_draft"

	row := m.DB.QueryRow(stmt, slug, title, content, createdAt, isDraft)

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

// GetAll returns all posts, optionally filtering by draft status
func (m *PostModel) GetAll(includeDrafts bool) ([]Post, error) {
	var stmt string
	var rows *sql.Rows
	var err error

	if includeDrafts {
		stmt = "SELECT id, title, slug, created_at, is_draft FROM posts ORDER BY created_at DESC"
		rows, err = m.DB.Query(stmt)
	} else {
		stmt = "SELECT id, title, slug, created_at, is_draft FROM posts WHERE is_draft = false ORDER BY created_at DESC"
		rows, err = m.DB.Query(stmt)
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return m.getPostsFromRows(rows)
}

// GetAllPaginated returns posts with pagination
func (m *PostModel) GetAllPaginated(limit, offset int, includeDrafts bool) ([]Post, error) {
	var stmt string
	var rows *sql.Rows
	var err error

	if includeDrafts {
		stmt = "SELECT id, title, slug, created_at, is_draft FROM posts ORDER BY created_at DESC LIMIT $1 OFFSET $2"
		rows, err = m.DB.Query(stmt, limit, offset)
	} else {
		stmt = "SELECT id, title, slug, created_at, is_draft FROM posts WHERE is_draft = false ORDER BY created_at DESC LIMIT $1 OFFSET $2"
		rows, err = m.DB.Query(stmt, limit, offset)
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return m.getPostsFromRows(rows)
}

func (m *PostModel) DeleteBySlug(slug string) error {
	stmt := "DELETE FROM posts WHERE slug = $1"

	_, err := m.DB.Exec(stmt, slug)

	if err != nil {
		return err
	}

	return nil
}
