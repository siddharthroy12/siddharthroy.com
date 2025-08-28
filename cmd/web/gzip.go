package main

import (
	"compress/gzip"
	"net/http"
	"strings"
)

// gzipWriter wraps http.ResponseWriter to provide gzip compression
type gzipWriter struct {
	http.ResponseWriter
	gzipWriter *gzip.Writer
}

func (gw *gzipWriter) Write(b []byte) (int, error) {
	return gw.gzipWriter.Write(b)
}

func (gw *gzipWriter) Close() error {
	return gw.gzipWriter.Close()
}

// gzipMiddleware adds gzip compression support
func gzipMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Check if client supports gzip
		if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
			next(w, r)
			return
		}

		// Set the content encoding header
		w.Header().Set("Content-Encoding", "gzip")

		// Create gzip writer
		gz := gzip.NewWriter(w)
		defer gz.Close()

		// Wrap the response writer
		gzw := &gzipWriter{
			ResponseWriter: w,
			gzipWriter:     gz,
		}

		next(gzw, r)
	}
}
