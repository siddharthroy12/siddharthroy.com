package main

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"image"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	_ "image/jpeg" // Register the JPEG format
	_ "image/png"  // Import for PNG decoding registration

	"github.com/chai2010/webp"
	"github.com/go-playground/form/v4"
	"github.com/julienschmidt/httprouter"
)

type envelope map[string]any

// generateRandomID generates a random hex string for file naming
func generateRandomID(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func (app *application) readParam(r *http.Request, param string) string {
	params := httprouter.ParamsFromContext(r.Context())
	return params.ByName(param)
}

func (app *application) render(w http.ResponseWriter, r *http.Request, status int, page string, pageData any) {
	templateData := app.newTemplateData(r)
	templateData.Page = pageData
	ts, ok := app.templateCache[page]

	if !ok {
		err := fmt.Errorf("this template %s does not exist", page)
		app.serverErrorResponse(w, r, err, "getting template")
		return
	}
	var buf bytes.Buffer

	err := ts.ExecuteTemplate(&buf, "base", templateData)

	if err != nil {
		app.serverErrorResponse(w, r, err, "executing template")
		return
	}

	w.WriteHeader(status)

	buf.WriteTo(w)
}

func (app *application) decodePostForm(r *http.Request, dst any) error {
	err := r.ParseForm()
	if err != nil {
		return err
	}

	err = app.formDecorder.Decode(dst, r.PostForm)

	if err != nil {
		var invalidDecodeError *form.InvalidEncodeError

		if errors.As(err, &invalidDecodeError) {
			panic(err)
		}

		return err
	}
	return nil
}

func (app *application) readJSON(r io.Reader, dst any) error {
	dec := json.NewDecoder(r)

	err := dec.Decode(dst)

	if err != nil {
		var syntaxError *json.SyntaxError
		var unmarshalTypeError *json.UnmarshalTypeError
		var invalidUnmarshalError *json.InvalidUnmarshalError
		var maxBytesError *http.MaxBytesError

		switch {
		case errors.As(err, &syntaxError):
			return fmt.Errorf("body contains badly-formed JSON (at character %d)", syntaxError.Offset)
		case errors.Is(err, io.ErrUnexpectedEOF):
			return fmt.Errorf("body is badly-formed JSON (at character %d)", syntaxError.Offset)
		case errors.As(err, &unmarshalTypeError):
			if unmarshalTypeError.Field != "" {
				return fmt.Errorf("body contains incorrect JSON type for field %q", unmarshalTypeError.Field)
			}
			return fmt.Errorf("body contains incorrect JSON type (at character %d)", unmarshalTypeError.Offset)
		case errors.Is(err, io.EOF):
			return errors.New("body must not be empty")
		case strings.HasPrefix(err.Error(), "json: unknown field "):
			fieldName := strings.TrimPrefix(err.Error(), "json: unknown field ")
			return fmt.Errorf("body contains unkown key %s", fieldName)
		case errors.As(err, &maxBytesError):
			return fmt.Errorf("body must not be larger than %d bytes", maxBytesError.Limit)
		case errors.As(err, &invalidUnmarshalError):
			panic(err)
		default:
			return err
		}

	}

	err = dec.Decode(&struct{}{})
	if !errors.Is(err, io.EOF) {
		return errors.New("body must contain only  a single JSON value")
	}

	return nil
}

func (app *application) readJSONFromRequest(w http.ResponseWriter, r *http.Request, dst any) error {
	r.Body = http.MaxBytesReader(w, r.Body, 1_048_576)
	return app.readJSON(r.Body, dst)
}

func (app *application) writeJSON(w http.ResponseWriter, status int, data envelope, headers http.Header) error {
	js, err := json.Marshal(data)

	if err != nil {
		return err
	}

	js = append(js, '\n')

	for key, value := range headers {
		w.Header()[key] = value
	}

	w.Header().Set("Content-type", "application/json")
	w.WriteHeader(status)
	w.Write(js)

	return nil
}

func (app *application) setFlash(r *http.Request, message string) {
	app.sessionManager.Put(r.Context(), "flash", message)
}

func (app *application) uploadMedia(img image.Image, folder string, filename string) error {
	// Create profile pictures directory path
	profilePicturesDir := filepath.Join(app.config.mediaDir, folder)

	// Ensure the profile pictures directory exists
	if err := os.MkdirAll(profilePicturesDir, 0755); err != nil {
		return fmt.Errorf("failed to create profile pictures directory: %w", err)
	}

	// Create the full file path
	filePath := filepath.Join(profilePicturesDir, filename)

	// Create the file
	file, err := os.Create(filePath)
	if err != nil {
		return fmt.Errorf("failed to create file: %w", err)
	}
	defer file.Close()

	// Encode and save as WebP
	webpOptions := &webp.Options{
		Lossless: false,
		Quality:  90, // 0-100, higher is better quality
	}
	if err := webp.Encode(file, img, webpOptions); err != nil {
		return fmt.Errorf("failed to encode WebP: %w", err)
	}

	return nil
}

// getImageURLs returns a list of URLs for images within the specified folder
func (app *application) getImageURLs(folder string) ([]string, error) {
	// Create the directory path
	folderPath := filepath.Join(app.config.mediaDir, folder)

	// Check if directory exists
	if _, err := os.Stat(folderPath); os.IsNotExist(err) {
		return []string{}, nil
	}

	// Read directory contents
	files, err := os.ReadDir(folderPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read directory: %w", err)
	}

	var imageURLs []string

	// Iterate through files and collect image URLs
	for _, file := range files {
		if file.IsDir() {
			continue // Skip directories
		}

		filename := file.Name()
		imageURL := fmt.Sprintf("/media/%s/%s", folder, filename)
		imageURLs = append(imageURLs, imageURL)

	}

	return imageURLs, nil
}

func (app *application) uploadMediaFromRequest(r *http.Request, folder string) error {
	// Parse multipart form with 32MB max memory
	err := r.ParseMultipartForm(32 << 20)
	if err != nil {
		return err
	}

	// Get all files from the "images" field (note: changed from "image" to "images")
	files := r.MultipartForm.File["images"]
	if len(files) == 0 {
		return fmt.Errorf("no files provided")
	}

	// Process each file
	for _, fileHeader := range files {
		// Open the file
		file, err := fileHeader.Open()
		if err != nil {
			return fmt.Errorf("failed to open file %s: %w", fileHeader.Filename, err)
		}

		// Validate file size (limit to 10MB per file)
		if fileHeader.Size > 10<<20 {
			file.Close()
			return fmt.Errorf("file %s exceeds 10MB limit", fileHeader.Filename)
		}

		// Decode the image (supports JPEG, PNG, GIF)
		img, _, err := image.Decode(file)
		if err != nil {
			file.Close()
			return fmt.Errorf("failed to decode image %s: %w", fileHeader.Filename, err)
		}

		// Generate random filename
		randomID, err := generateRandomID(16)
		if err != nil {
			file.Close()
			return fmt.Errorf("failed to generate random ID for %s: %w", fileHeader.Filename, err)
		}
		filename := fmt.Sprintf("%s.webp", randomID)

		// Save the resized image to file
		if err := app.uploadMedia(img, folder, filename); err != nil {
			file.Close()
			return fmt.Errorf("failed to upload %s: %w", fileHeader.Filename, err)
		}

		file.Close()
	}

	return nil
}

func (app *application) isDarkMode(r *http.Request) bool {
	isDark := app.sessionManager.GetBool(r.Context(), (isDarkMode))
	return isDark
}
