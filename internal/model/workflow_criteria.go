package model

import (
	"regexp"
	"slices"
	"strings"
)

// WorkflowCriteria describes the conditions a torrent's classified content must satisfy for a
// Workflow to fire. Within a single field, values are OR'd together (any match is sufficient);
// across fields, the result is AND'd (every specified field must match). Empty/nil fields are
// not applied.
type WorkflowCriteria struct {
	ContentTypes     []ContentType     `json:"contentTypes,omitempty"`
	Genres           []string          `json:"genres,omitempty"`
	Languages        []Language        `json:"languages,omitempty"`
	VideoResolutions []VideoResolution `json:"videoResolutions,omitempty"`
	VideoSources     []VideoSource     `json:"videoSources,omitempty"`
	// TitlePatterns match the torrent's raw name using glob-style wildcards: `*` stands in for
	// any run of characters, `?` for a single one (e.g. "The Office S01*" or "*2160p*HDR*").
	TitlePatterns []string `json:"titlePatterns,omitempty"`
	SizeMin       *uint64  `json:"sizeMin,omitempty"`
	SizeMax       *uint64  `json:"sizeMax,omitempty"`
	MinSeeders    *uint    `json:"minSeeders,omitempty"`
}

// Matches reports whether t/tc (as just produced by classification) satisfies c.
func (c WorkflowCriteria) Matches(t Torrent, tc TorrentContent) bool {
	if len(c.ContentTypes) > 0 && (!tc.ContentType.Valid || !slices.Contains(c.ContentTypes, tc.ContentType.ContentType)) {
		return false
	}

	if len(c.Genres) > 0 && !matchesAnyGenre(tc.Content.Collections, c.Genres) {
		return false
	}

	if len(c.Languages) > 0 && !matchesAnyLanguage(tc.Languages, c.Languages) {
		return false
	}

	if len(c.VideoResolutions) > 0 &&
		(!tc.VideoResolution.Valid || !slices.Contains(c.VideoResolutions, tc.VideoResolution.VideoResolution)) {
		return false
	}

	if len(c.VideoSources) > 0 &&
		(!tc.VideoSource.Valid || !slices.Contains(c.VideoSources, tc.VideoSource.VideoSource)) {
		return false
	}

	if len(c.TitlePatterns) > 0 && !matchesAnyTitlePattern(t.Name, c.TitlePatterns) {
		return false
	}

	if c.SizeMin != nil && uint64(t.Size) < *c.SizeMin {
		return false
	}

	if c.SizeMax != nil && uint64(t.Size) > *c.SizeMax {
		return false
	}

	if c.MinSeeders != nil && (!tc.Seeders.Valid || tc.Seeders.Uint < *c.MinSeeders) {
		return false
	}

	return true
}

func matchesAnyGenre(collections []ContentCollection, genres []string) bool {
	for _, collection := range collections {
		if collection.Type != "genre" {
			continue
		}

		for _, genre := range genres {
			if strings.EqualFold(collection.Name, genre) {
				return true
			}
		}
	}

	return false
}

func matchesAnyLanguage(have Languages, want []Language) bool {
	for _, lang := range want {
		if _, ok := have[lang]; ok {
			return true
		}
	}

	return false
}

func matchesAnyTitlePattern(name string, patterns []string) bool {
	for _, pattern := range patterns {
		if globMatch(name, pattern) {
			return true
		}
	}

	return false
}

func globMatch(name, pattern string) bool {
	re, err := globToRegexp(pattern)
	if err != nil {
		return false
	}

	return re.MatchString(name)
}

func globToRegexp(pattern string) (*regexp.Regexp, error) {
	var sb strings.Builder

	sb.WriteString("(?i)^")

	for _, r := range pattern {
		switch r {
		case '*':
			sb.WriteString(".*")
		case '?':
			sb.WriteString(".")
		default:
			sb.WriteString(regexp.QuoteMeta(string(r)))
		}
	}

	sb.WriteString("$")

	return regexp.Compile(sb.String())
}
