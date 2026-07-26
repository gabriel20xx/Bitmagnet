// Package buildinfo reports the Go toolchain and a curated set of dependency versions this
// binary was actually built with, sourced from runtime/debug.ReadBuildInfo() rather than a
// hand-maintained list - so it can never drift out of sync with what's actually running.
package buildinfo

import (
	"runtime"
	"runtime/debug"
)

type Dependency struct {
	Name    string
	Version string
}

type Info struct {
	GoVersion    string
	OS           string
	Arch         string
	Dependencies []Dependency
}

// interestingModules is a curated allowlist of the dependencies most worth showing on an
// admin "tech stack" page - the full build has hundreds of transitive entries that wouldn't
// mean anything to a reader. Order here is the display order.
var interestingModules = []struct {
	path string
	name string
}{
	{"github.com/anacrolix/torrent", "anacrolix/torrent"},
	{"github.com/gin-gonic/gin", "Gin"},
	{"gorm.io/gorm", "GORM"},
	{"github.com/99designs/gqlgen", "gqlgen"},
	{"go.uber.org/fx", "Uber fx"},
	{"go.uber.org/zap", "Uber zap"},
	{"github.com/jackc/pgx/v5", "pgx"},
	{"github.com/pressly/goose/v3", "goose"},
}

func Current() Info {
	info := Info{
		GoVersion: runtime.Version(),
		OS:        runtime.GOOS,
		Arch:      runtime.GOARCH,
	}

	buildInfo, ok := debug.ReadBuildInfo()
	if !ok {
		return info
	}

	versionByPath := make(map[string]string, len(buildInfo.Deps))
	for _, dep := range buildInfo.Deps {
		versionByPath[dep.Path] = dep.Version
	}

	for _, m := range interestingModules {
		if v, ok := versionByPath[m.path]; ok {
			info.Dependencies = append(info.Dependencies, Dependency{Name: m.name, Version: v})
		}
	}

	return info
}
