package models

import (
	"database/sql"
	"errors"
	"time"
)

type User struct {
	ID        int       `json:"id"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"created_at"`
	Name      string    `json:"name"`
}

type UserModel struct {
	DB *sql.DB
}

func (m *UserModel) Create(email string, name string) (User, error) {
	stmt := "INSERT INTO users (email, name) VALUES($1, $2) RETURNING id, email, created_at, name"

	row := m.DB.QueryRow(stmt, email, name)

	user, err := m.getUserFromRow(row)
	if err != nil {
		return User{}, err
	}

	return user, nil
}

func (m *UserModel) getUserFromRow(row *sql.Row) (User, error) {
	var u User

	err := row.Scan(&u.ID, &u.Email, &u.CreatedAt, &u.Name)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return User{}, ErrNoRecord
		}
		return User{}, err
	}

	return u, nil
}

func (m *UserModel) GetById(userId int) (User, error) {
	stmt := "SELECT id, email, created_at, name FROM users WHERE id = $1"
	row := m.DB.QueryRow(stmt, userId)
	return m.getUserFromRow(row)
}

func (m *UserModel) GetByEmail(email string) (User, error) {
	stmt := "SELECT id, email, created_at, name FROM users WHERE email = $1"
	row := m.DB.QueryRow(stmt, email)
	return m.getUserFromRow(row)
}

func (m *UserModel) Delete(userId int) error {
	stmt := "DELETE FROM users WHERE id = $1"

	_, err := m.DB.Exec(stmt, userId)

	if err != nil {
		return err
	}

	return nil
}
