package auth

import "testing"

func TestNormalizeUsernamePreservesCase(t *testing.T) {
	got, err := normalizeUsername("  UserName  ")
	if err != nil {
		t.Fatalf("normalizeUsername() error = %v", err)
	}
	if got != "UserName" {
		t.Fatalf("normalizeUsername() = %q, want %q", got, "UserName")
	}
}
