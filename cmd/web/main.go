package main

import (
	"context"
	"database/sql"
	"flag"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/alexedwards/scs/postgresstore"
	"github.com/alexedwards/scs/v2"
	"github.com/go-playground/form/v4"
	_ "github.com/lib/pq"
	"siddharthroy.com/internal/models"
)

type config struct {
	port           int
	env            string
	dsn            string
	googleClientId string
}

type application struct {
	config         config
	logger         *slog.Logger
	templateCache  templateCache
	sessionManager *scs.SessionManager
	formDecorder   *form.Decoder
	users          models.UserModel
}

func main() {
	var cfg config

	flag.IntVar(&cfg.port, "port", 4000, "API server port")
	flag.StringVar(&cfg.env, "env", "development", "Environment (development|staging|production)")
	flag.StringVar(&cfg.googleClientId, "gclientid", "", "Google client ID for oauth")
	flag.StringVar(&cfg.dsn, "dsn", "", "Postgres DSN")
	flag.Parse()

	if len(strings.TrimSpace(cfg.googleClientId)) == 0 {
		println("gclientid is not provided")
		os.Exit(1)
	}

	if len(strings.TrimSpace(cfg.dsn)) == 0 {
		println("dsn is not provided")
		os.Exit(1)
	}

	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))

	db, err := openDB(cfg)

	if err != nil {
		logger.Error(err.Error())
		os.Exit(1)
	}

	sessionManager := scs.New()
	sessionManager.Store = postgresstore.New(db)
	sessionManager.Lifetime = 12 * time.Hour

	formDecorder := form.NewDecoder()

	templateCache, err := newTemplateCache()

	if err != nil {
		logger.Error(err.Error())
		os.Exit(1)
	}

	app := application{
		config:         cfg,
		logger:         logger,
		sessionManager: sessionManager,
		formDecorder:   formDecorder,
		templateCache:  templateCache,
		users: models.UserModel{
			DB: db,
		},
	}

	srv := http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.port),
		Handler:      app.routes(),
		IdleTimeout:  time.Minute,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		ErrorLog:     slog.NewLogLogger(logger.Handler(), slog.LevelError),
	}

	logger.Info("starting server", "addr", srv.Addr, "env", cfg.env)

	err = srv.ListenAndServe()

	if err != nil {
		logger.Error(err.Error())
		os.Exit(1)
	}

}

func openDB(cfg config) (*sql.DB, error) {
	db, err := sql.Open("postgres", cfg.dsn)

	if err != nil {
		return nil, err
	}

	ctx, cancle := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancle()

	err = db.PingContext(ctx)

	if err != nil {
		db.Close()
		return nil, err
	}

	return db, nil
}
