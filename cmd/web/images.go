package main

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

type ImageGalleryPageData struct {
	Folder string
	Images []string
}

func (app *application) createImageGalleryPageData(folder string) (ImageGalleryPageData, error) {
	images, err := app.getImageURLs(folder)
	if err != nil {
		return ImageGalleryPageData{}, err
	}
	return ImageGalleryPageData{
		Folder: folder,
		Images: images,
	}, nil
}

func (app *application) petPicturesPageHandler(w http.ResponseWriter, r *http.Request) {
	pageData, err := app.createImageGalleryPageData("katrina")
	if err != nil {
		app.serverErrorResponse(w, r, err, "fetching images")
		return
	}
	app.render(w, r, 200, "katrina.html", pageData)
}

func (app *application) drawingsPageHandler(w http.ResponseWriter, r *http.Request) {
	pageData, err := app.createImageGalleryPageData("sketches")
	if err != nil {
		app.serverErrorResponse(w, r, err, "fetching images")
		return
	}
	app.render(w, r, 200, "sketches.html", pageData)
}

func (app *application) uploadSketchHandler(w http.ResponseWriter, r *http.Request) {

	err := app.uploadMediaFromRequest(r, "sketches")
	if err != nil {
		app.logError(r, err, "uploading media")
		app.setFlash(r, "Something went wrong")
		pageData, err := app.createImageGalleryPageData("sketches")
		if err != nil {
			app.serverErrorResponse(w, r, err, "fetching images")
			return
		}
		app.render(w, r, http.StatusBadRequest, "sketches.html", pageData)
		return
	}

	app.setFlash(r, "Imaged Uploaded")
	pageData, err := app.createImageGalleryPageData("sketches")
	if err != nil {
		app.serverErrorResponse(w, r, err, "fetching images")
		return
	}
	app.render(w, r, http.StatusOK, "sketches.html", pageData)
}

func (app *application) uploadKatrinaPicHandler(w http.ResponseWriter, r *http.Request) {

	err := app.uploadMediaFromRequest(r, "katrina")
	if err != nil {
		app.logError(r, err, "uploading media")
		app.setFlash(r, "Something went wrong")
		pageData, err := app.createImageGalleryPageData("katrina")
		if err != nil {
			app.serverErrorResponse(w, r, err, "fetching images")
			return
		}
		app.render(w, r, http.StatusBadRequest, "katrina.html", pageData)
		return
	}

	app.setFlash(r, "Imaged Uploaded")
	pageData, err := app.createImageGalleryPageData("katrina")
	if err != nil {
		app.serverErrorResponse(w, r, err, "fetching images")
		return
	}
	app.render(w, r, http.StatusOK, "katrina.html", pageData)
}

func (app *application) deleteMediaHandler(w http.ResponseWriter, r *http.Request) {
	// Extract the file path from the URL
	// Remove "/media/" prefix to get the relative path
	filePath := strings.TrimPrefix(r.URL.Path, "/media/")

	// Prevent directory traversal attacks
	if strings.Contains(filePath, "..") {
		app.notFoundResponseJSON(w, r)
		return
	}

	// Construct full file path
	fullPath := filepath.Join(app.config.mediaDir, filePath)

	// Check if file exists and is not a directory
	_, err := os.Stat(fullPath)
	if err != nil {
		app.notFoundResponse(w, r)
		return
	}

	err = os.Remove(fullPath)

	if err != nil {
		app.serverErrorResponseJSON(w, r, err, "delete media")
	}

	app.writeJSON(w, http.StatusOK, envelope{"message": "media deleted"}, nil)
}

func (app *application) mediaHandler(w http.ResponseWriter, r *http.Request) {
	// Extract the file path from the URL
	// Remove "/media/" prefix to get the relative path
	filePath := strings.TrimPrefix(r.URL.Path, "/media/")

	// Prevent directory traversal attacks
	if strings.Contains(filePath, "..") {
		app.notFoundResponse(w, r)
		return
	}

	// Construct full file path
	fullPath := filepath.Join(app.config.mediaDir, filePath)

	// Check if file exists and is not a directory
	fileInfo, err := os.Stat(fullPath)
	if err != nil {
		app.notFoundResponse(w, r)
		return
	}

	if fileInfo.IsDir() {
		app.notFoundResponse(w, r)
		return
	}

	// Set appropriate content type based on file extension
	ext := strings.ToLower(filepath.Ext(fullPath))
	switch ext {
	case ".jpg", ".jpeg":
		w.Header().Set("Content-Type", "image/jpeg")
	case ".png":
		w.Header().Set("Content-Type", "image/png")
	case ".gif":
		w.Header().Set("Content-Type", "image/gif")
	case ".webp":
		w.Header().Set("Content-Type", "image/webp")
	default:
		w.Header().Set("Content-Type", "application/octet-stream")
	}

	// Set cache headers for better performance
	w.Header().Set("Cache-Control", "public, max-age=86400") // 1 day
	w.Header().Set("ETag", fmt.Sprintf(`"%x-%x"`, fileInfo.ModTime().Unix(), fileInfo.Size()))

	// Serve the file
	http.ServeFile(w, r, fullPath)
}
