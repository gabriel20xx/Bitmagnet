package webuireact

type Config struct {
	LocalAddress string
	GinMode      string
}

func NewDefaultConfig() Config {
	return Config{
		// :3333 is the main API/Angular server and :3334 is used by `task serve-webui`
		// (the Angular dev server), so this embedded production server defaults to
		// a distinct port to avoid any ambiguity between the two.
		LocalAddress: ":3336",
		GinMode:      "release",
	}
}
