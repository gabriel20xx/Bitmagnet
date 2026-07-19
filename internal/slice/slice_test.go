package slice_test

import (
	"slices"
	"strconv"
	"testing"

	"github.com/bitmagnet-io/bitmagnet/internal/slice"
	"github.com/stretchr/testify/assert"
)

func TestMap(t *testing.T) {
	t.Parallel()

	mapFunc := func(v int) string { return strconv.Itoa(v * 2) }

	t.Run("returns empty slice for an empty input", func(t *testing.T) {
		t.Parallel()
		assert.Empty(t, slice.Map([]int{}, mapFunc))
	})

	t.Run("returns a new slice with elements mapped", func(t *testing.T) {
		t.Parallel()
		assert.Equal(t, []string{"2", "4", "6", "8"}, slice.Map([]int{1, 2, 3, 4}, mapFunc))
	})
}

func TestMapWithArg(t *testing.T) {
	t.Parallel()

	mapFunc := func(a int, v int) string { return strconv.Itoa(a + v) }

	t.Run("returns empty slice for an empty input", func(t *testing.T) {
		t.Parallel()
		assert.Empty(t, slice.MapWithArg([]int{}, 10, mapFunc))
	})

	t.Run("returns a new slice with elements mapped", func(t *testing.T) {
		t.Parallel()
		assert.Equal(t, []string{"11", "12", "13", "14"}, slice.MapWithArg([]int{1, 2, 3, 4}, 10, mapFunc))
	})
}

func TestGroup(t *testing.T) {
	t.Parallel()

	keyFunc := func(v int) int { return v % 2 }

	t.Run("returns empty map for an empty input", func(t *testing.T) {
		t.Parallel()
		assert.Empty(t, slice.Group([]int{}, keyFunc))
	})

	t.Run("groups by the result of the key function", func(t *testing.T) {
		t.Parallel()

		result := slice.Group([]int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11}, keyFunc)
		assert.Len(t, result, 2)
		assert.Equal(t, []int{2, 4, 6, 8, 10}, result[0])
		assert.Equal(t, []int{1, 3, 5, 7, 9, 11}, result[1])
	})
}

func TestToMap(t *testing.T) {
	t.Parallel()

	t.Run("returns empty map for an empty input", func(t *testing.T) {
		t.Parallel()

		transformFunc := func(v int) (int, string) { return v, strconv.Itoa(v) }
		assert.Empty(t, slice.ToMap([]int{}, transformFunc))
	})

	t.Run("returns a map with the result of the transform function", func(t *testing.T) {
		t.Parallel()

		transformFunc := func(v int) (int, string) { return v * 2, strconv.Itoa(v * 2) }
		result := slice.ToMap([]int{1, 2, 3, 4}, transformFunc)
		assert.Len(t, result, 4)
		assert.Equal(t, map[int]string{2: "2", 4: "4", 6: "6", 8: "8"}, result)
	})
}

func TestUnique(t *testing.T) {
	t.Parallel()

	t.Run("returns empty slice for an empty input", func(t *testing.T) {
		t.Parallel()
		assert.Empty(t, slice.Unique([]int{}))
	})

	t.Run("returns the unique elements", func(t *testing.T) {
		t.Parallel()
		assert.Equal(t, []int{1, 2, 3}, slice.Unique([]int{1, 2, 1, 2, 3, 2}))
	})
}

func TestCollectChunks(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name     string
		input    []int
		n        int
		expected [][]int
	}{
		{"returns empty slice (nil) for an empty input", []int{}, 1, nil},
		{"returns the slice in one chunk if len < chunkSize", []int{1, 2, 3}, 10, [][]int{{1, 2, 3}}},
		{"breaks up the slice if len > chunkSize", []int{1, 2, 3, 4, 5}, 3, [][]int{{1, 2, 3}, {4, 5}}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			var result [][]int
			for chunks := range slice.CollectChunks(slices.Values(tt.input), tt.n) {
				result = append(result, chunks)
			}

			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestSeqFunc(t *testing.T) {
	t.Parallel()

	t.Run("returns empty slice for an empty input", func(t *testing.T) {
		t.Parallel()

		it := slice.SeqFunc([]int{}, func(v int) int { return v })
		assert.Empty(t, slices.Collect(it))
	})

	t.Run("returns a new slice with mapped elements", func(t *testing.T) {
		t.Parallel()

		it := slice.SeqFunc([]int{1, 2, 3, 4}, func(v int) string { return strconv.Itoa(v * 2) })
		assert.Equal(t, []string{"2", "4", "6", "8"}, slices.Collect(it))
	})
}
