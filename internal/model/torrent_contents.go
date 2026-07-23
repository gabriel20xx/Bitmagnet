package model

import (
	"fmt"
	"strings"

	"github.com/bitmagnet-io/bitmagnet/internal/database/fts"
)

func (tc TorrentContent) InferID() string {
	parts := make([]string, 4)
	parts[0] = tc.InfoHash.String()

	if tc.ContentType.Valid {
		parts[1] = tc.ContentType.ContentType.String()
	} else {
		parts[1] = "?"
	}

	if tc.ContentSource.Valid {
		parts[2] = tc.ContentSource.String
		parts[3] = tc.ContentID.String
	} else {
		parts[2] = "?"
		parts[3] = "?"
	}

	return strings.Join(parts, ":")
}

func (tc TorrentContent) Title() string {
	if !tc.ContentID.Valid || tc.Content.Title == "" {
		return tc.Torrent.Name
	}

	var titleParts []string

	titleParts = append(titleParts, tc.Content.Title)
	if tc.Content.OriginalTitle.Valid && tc.Content.Title != tc.Content.OriginalTitle.String {
		titleParts = append(titleParts, fmt.Sprintf("/ %s", tc.Content.OriginalTitle.String))
	}

	if !tc.Content.ReleaseYear.IsNil() {
		titleParts = append(titleParts, fmt.Sprintf("(%d)", tc.Content.ReleaseYear))
	}

	if len(tc.Episodes) > 0 {
		titleParts = append(titleParts, tc.Episodes.String())
	}

	return strings.Join(titleParts, " ")
}

func (tc TorrentContent) ContentRef() Maybe[ContentRef] {
	if tc.ContentID.Valid {
		return MaybeValid(ContentRef{
			Type:   tc.ContentType.ContentType,
			Source: tc.ContentSource.String,
			ID:     tc.ContentID.String,
		})
	}

	return Maybe[ContentRef]{}
}

func (tc *TorrentContent) UpdateTsv() {
	var tsv fts.Tsvector
	searchParts := make([]string, 0, 8)
	if tc.ContentID.Valid {
		tsv = tc.Content.Tsv.Copy()
		if tc.Content.SearchString != "" {
			searchParts = append(searchParts, strings.ToValidUTF8(tc.Content.SearchString, ""))
		}
	} else {
		tsv = fts.Tsvector{}
	}

	addText := func(text string, weight fts.TsvectorWeight) {
		text = strings.ToValidUTF8(text, "")
		tsv.AddText(text, weight)
		searchParts = append(searchParts, text)
	}

	if tc.VideoResolution.Valid {
		addText(tc.VideoResolution.VideoResolution.Label(), fts.TsvectorWeightC)
	}

	if tc.VideoSource.Valid {
		addText(tc.VideoSource.VideoSource.String(), fts.TsvectorWeightC)
	}

	if tc.VideoCodec.Valid {
		addText(tc.VideoCodec.VideoCodec.String(), fts.TsvectorWeightC)
	}

	if tc.Video3D.Valid {
		addText("3D", fts.TsvectorWeightC)
	}

	if tc.VideoModifier.Valid {
		addText(tc.VideoModifier.VideoModifier.String(), fts.TsvectorWeightC)
	}

	if tc.ReleaseGroup.Valid {
		addText(tc.ReleaseGroup.String, fts.TsvectorWeightC)
	}

	addText(tc.InfoHash.String(), fts.TsvectorWeightA)
	addText(tc.Torrent.Name, fts.TsvectorWeightA)

	for _, str := range tc.Torrent.fileSearchStrings() {
		addText(str, fts.TsvectorWeightD)
	}

	tc.Tsv = tsv
	tc.SearchString = strings.Join(searchParts, " ")
}
