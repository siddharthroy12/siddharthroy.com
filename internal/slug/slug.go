package slug

import (
	"regexp"
	"strings"
	"unicode"
)

// GenerateSlug converts a title string into a URL-friendly slug
func GenerateSlug(title string) string {
	// Convert to lowercase
	slug := strings.ToLower(title)

	// Remove accents and convert special characters to ASCII
	slug = removeAccents(slug)

	// Replace spaces and multiple whitespace with hyphens
	spaceRegex := regexp.MustCompile(`\s+`)
	slug = spaceRegex.ReplaceAllString(slug, "-")

	// Remove all non-alphanumeric characters except hyphens
	nonAlphanumericRegex := regexp.MustCompile(`[^a-z0-9-]`)
	slug = nonAlphanumericRegex.ReplaceAllString(slug, "")

	// Remove multiple consecutive hyphens
	multipleHyphensRegex := regexp.MustCompile(`-+`)
	slug = multipleHyphensRegex.ReplaceAllString(slug, "-")

	// Trim hyphens from start and end
	slug = strings.Trim(slug, "-")

	// Handle empty slug
	if slug == "" {
		return "untitled"
	}

	return slug
}

// removeAccents converts accented characters to their ASCII equivalents
func removeAccents(s string) string {
	// Map of accented characters to ASCII equivalents
	accents := map[rune]string{
		'à': "a", 'á': "a", 'â': "a", 'ã': "a", 'ä': "a", 'å': "a", 'æ': "ae",
		'ç': "c",
		'è': "e", 'é': "e", 'ê': "e", 'ë': "e",
		'ì': "i", 'í': "i", 'î': "i", 'ï': "i",
		'ñ': "n",
		'ò': "o", 'ó': "o", 'ô': "o", 'õ': "o", 'ö': "o", 'ø': "o", 'œ': "oe",
		'ù': "u", 'ú': "u", 'û': "u", 'ü': "u",
		'ý': "y", 'ÿ': "y",
		'ß': "ss",
	}

	var result strings.Builder
	for _, r := range s {
		if replacement, exists := accents[r]; exists {
			result.WriteString(replacement)
		} else if unicode.IsLetter(r) || unicode.IsDigit(r) || unicode.IsSpace(r) || r == '-' {
			result.WriteRune(r)
		}
	}

	return result.String()
}
