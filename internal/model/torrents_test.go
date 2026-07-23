package model

import (
	"testing"
	"unicode/utf8"
)

func TestFileSearchStringsProducesValidUTF8(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name  string
		paths []string
	}{
		{
			name: "cyrillic shared prefix",
			paths: []string{
				"Сериал Название/Серия 01.mkv",
				"Сериал Название/Серия 02.mkv",
				"Сериал Название/Серия 03.mkv",
			},
		},
		{
			name: "japanese shared prefix and suffix",
			paths: []string{
				"日本語のフォルダ/第一話.mkv", //nolint:gosmopolitan // intentional non-Latin test fixture
				"日本語のフォルダ/第二話.mkv", //nolint:gosmopolitan // intentional non-Latin test fixture
			},
		},
		{
			name: "korean, accented latin and emoji mixed",
			paths: []string{
				"폴더/파일 하나.mkv",
				"폴더/파일 둘.mkv",
				"Café Días 🎬/Épisode Uno.mkv",
				"Café Días 🎬/Épisode Dos.mkv",
			},
		},
		{
			name: "chinese fully shared suffix",
			paths: []string{
				"甲乙丙丁戊己庚辛壬癸.mkv",       //nolint:gosmopolitan // intentional non-Latin test fixture
				"子丑寅卯辰巳午未申酉戊己庚辛壬癸.mkv", //nolint:gosmopolitan // intentional non-Latin test fixture
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			files := make([]TorrentFile, len(tt.paths))
			for i, p := range tt.paths {
				files[i] = TorrentFile{Path: p}
			}

			torrent := Torrent{Files: files}

			for _, str := range torrent.fileSearchStrings() {
				if !utf8.ValidString(str) {
					t.Errorf(
						"fileSearchStrings() returned invalid UTF-8 string %q (bytes: %x)",
						str, []byte(str),
					)
				}
			}
		})
	}
}

func TestAlignToRuneBoundary(t *testing.T) {
	t.Parallel()

	s := "日本語" //nolint:gosmopolitan // intentional non-Latin test fixture; 3 runes, 3 bytes each

	tests := []struct {
		name string
		i    int
		want int
	}{
		{name: "start", i: 0, want: 0},
		{name: "end", i: len(s), want: len(s)},
		{name: "already aligned", i: 3, want: 3},
		{name: "mid rune", i: 4, want: 3},
		{name: "mid rune near end", i: 8, want: 6},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			got := alignToRuneBoundary(s, tt.i)
			if got != tt.want {
				t.Errorf("alignToRuneBoundary(%q, %d) = %d, want %d", s, tt.i, got, tt.want)
			}

			if !utf8.ValidString(s[:got]) || !utf8.ValidString(s[got:]) {
				t.Errorf(
					"alignToRuneBoundary(%q, %d) = %d does not split on a valid rune boundary",
					s, tt.i, got,
				)
			}
		})
	}
}
