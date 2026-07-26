package buildinfo

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCurrentReportsRuntimeInfo(t *testing.T) {
	info := Current()

	assert.True(t, strings.HasPrefix(info.GoVersion, "go"))
	assert.NotEmpty(t, info.OS)
	assert.NotEmpty(t, info.Arch)

	// Dependencies is env-dependent (this test binary doesn't itself import gin/gorm/etc, so
	// debug.ReadBuildInfo() legitimately may not list them) - just check any entries present
	// are well-formed rather than asserting specific modules show up.
	for _, dep := range info.Dependencies {
		assert.NotEmpty(t, dep.Name)
		assert.NotEmpty(t, dep.Version)
	}
}
