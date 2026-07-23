package mediastream

import "mime"

// extraMimeTypes fills in extensions commonly found in torrents that aren't reliably
// registered in the standard library's mime type table across platforms, so browsers
// receive a correct Content-Type for playback.
var extraMimeTypes = map[string]string{
	".mkv":  "video/x-matroska",
	".avi":  "video/x-msvideo",
	".mov":  "video/quicktime",
	".wmv":  "video/x-ms-wmv",
	".flv":  "video/x-flv",
	".m4v":  "video/x-m4v",
	".mpg":  "video/mpeg",
	".mpeg": "video/mpeg",
	".ts":   "video/mp2t",
	".webm": "video/webm",
	".mp4":  "video/mp4",

	".mp3":  "audio/mpeg",
	".wav":  "audio/wav",
	".flac": "audio/flac",
	".aac":  "audio/aac",
	".ogg":  "audio/ogg",
	".m4a":  "audio/mp4",
	".m4b":  "audio/mp4",
	".opus": "audio/opus",

	".jpg":  "image/jpeg",
	".jpeg": "image/jpeg",
	".png":  "image/png",
	".gif":  "image/gif",
	".bmp":  "image/bmp",
	".svg":  "image/svg+xml",
	".webp": "image/webp",
	".ico":  "image/x-icon",
	".tif":  "image/tiff",
	".tiff": "image/tiff",
}

func init() {
	for ext, typ := range extraMimeTypes {
		_ = mime.AddExtensionType(ext, typ)
	}
}
