package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/bitmagnet-io/bitmagnet/internal/lazy"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var (
	ErrUnauthorized       = errors.New("authentication required")
	ErrInvalidCredentials = errors.New("invalid username or password")
	ErrSetupComplete      = errors.New("initial user has already been created")
	ErrInvalidInput       = errors.New("invalid authentication input")
)

type User struct {
	ID       string
	Username string
}

type Status struct {
	SetupRequired bool
	Authenticated bool
	User          *User
}

type Service interface {
	Status(ctx context.Context) (Status, error)
	CreateInitialUser(ctx context.Context, username, password string) (User, error)
	Login(ctx context.Context, username, password string) (User, error)
	Logout(ctx context.Context) error
	UpdateCredentials(ctx context.Context, currentPassword string, username *string, newPassword *string) (User, error)
	CurrentUser(ctx context.Context) (*User, error)
}

type userRecord struct {
	ID           string    `gorm:"column:id;primaryKey;default:gen_random_uuid();<-:false"`
	Username     string    `gorm:"column:username;not null"`
	PasswordHash string    `gorm:"column:password_hash;not null"`
	CreatedAt    time.Time `gorm:"column:created_at;not null;<-:create"`
	UpdatedAt    time.Time `gorm:"column:updated_at;not null"`
}

func (userRecord) TableName() string { return "auth_users" }

type sessionRecord struct {
	ID        string    `gorm:"column:id;primaryKey;default:gen_random_uuid();<-:false"`
	UserID    string    `gorm:"column:user_id;not null"`
	TokenHash string    `gorm:"column:token_hash;not null;uniqueIndex"`
	ExpiresAt time.Time `gorm:"column:expires_at;not null"`
	CreatedAt time.Time `gorm:"column:created_at;not null;<-:create"`
}

func (sessionRecord) TableName() string { return "auth_sessions" }

type service struct {
	db     lazy.Lazy[*gorm.DB]
	config Config
}

func (s *service) Status(ctx context.Context) (Status, error) {
	db, err := s.db.Get()
	if err != nil {
		return Status{}, err
	}

	var count int64
	if err := db.WithContext(ctx).Model(&userRecord{}).Count(&count).Error; err != nil {
		return Status{}, err
	}

	user, err := s.CurrentUser(ctx)
	if err != nil {
		return Status{}, err
	}

	return Status{
		SetupRequired: count == 0,
		Authenticated: user != nil,
		User:          user,
	}, nil
}

func (s *service) CreateInitialUser(ctx context.Context, username, password string) (User, error) {
	normalizedUsername, err := normalizeUsername(username)
	if err != nil {
		return User{}, err
	}
	if err := validatePassword(password); err != nil {
		return User{}, err
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return User{}, err
	}

	db, err := s.db.Get()
	if err != nil {
		return User{}, err
	}

	record := userRecord{Username: normalizedUsername, PasswordHash: string(hash)}
	err = db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var count int64
		if err := tx.Model(&userRecord{}).Count(&count).Error; err != nil {
			return err
		}
		if count != 0 {
			return ErrSetupComplete
		}
		return tx.Create(&record).Error
	})
	if err != nil {
		if errors.Is(err, ErrSetupComplete) || strings.Contains(err.Error(), "auth_users_singleton_idx") {
			return User{}, ErrSetupComplete
		}
		return User{}, err
	}

	user := toUser(record)
	if err := s.createSession(ctx, user.ID); err != nil {
		return User{}, err
	}
	return user, nil
}

func (s *service) Login(ctx context.Context, username, password string) (User, error) {
	normalizedUsername, err := normalizeUsername(username)
	if err != nil {
		return User{}, ErrInvalidCredentials
	}

	db, err := s.db.Get()
	if err != nil {
		return User{}, err
	}

	var record userRecord
	if err := db.WithContext(ctx).Where("username = ?", normalizedUsername).First(&record).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return User{}, ErrInvalidCredentials
		}
		return User{}, err
	}
	if bcrypt.CompareHashAndPassword([]byte(record.PasswordHash), []byte(password)) != nil {
		return User{}, ErrInvalidCredentials
	}

	user := toUser(record)
	if err := s.createSession(ctx, user.ID); err != nil {
		return User{}, err
	}
	return user, nil
}

func (s *service) Logout(ctx context.Context) error {
	db, err := s.db.Get()
	if err != nil {
		return err
	}

	if token := s.sessionToken(ctx); token != "" {
		if err := db.WithContext(ctx).Where("token_hash = ?", hashToken(token)).Delete(&sessionRecord{}).Error; err != nil {
			return err
		}
	}
	s.clearCookie(ctx)
	return nil
}

func (s *service) UpdateCredentials(
	ctx context.Context,
	currentPassword string,
	username *string,
	newPassword *string,
) (User, error) {
	currentUser, err := s.CurrentUser(ctx)
	if err != nil {
		return User{}, err
	}
	if currentUser == nil {
		return User{}, ErrUnauthorized
	}
	if currentPassword == "" {
		return User{}, ErrInvalidInput
	}

	db, err := s.db.Get()
	if err != nil {
		return User{}, err
	}
	var record userRecord
	if err := db.WithContext(ctx).Where("id = ?", currentUser.ID).First(&record).Error; err != nil {
		return User{}, err
	}
	if bcrypt.CompareHashAndPassword([]byte(record.PasswordHash), []byte(currentPassword)) != nil {
		return User{}, ErrInvalidCredentials
	}
	if username == nil && newPassword == nil {
		return User{}, ErrInvalidInput
	}

	updates := map[string]any{}
	if username != nil {
		normalizedUsername, err := normalizeUsername(*username)
		if err != nil {
			return User{}, err
		}
		updates["username"] = normalizedUsername
		record.Username = normalizedUsername
	}
	if newPassword != nil {
		if err := validatePassword(*newPassword); err != nil {
			return User{}, err
		}
		hash, err := bcrypt.GenerateFromPassword([]byte(*newPassword), bcrypt.DefaultCost)
		if err != nil {
			return User{}, err
		}
		updates["password_hash"] = string(hash)
		record.PasswordHash = string(hash)
	}
	updates["updated_at"] = time.Now()

	if err := db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&userRecord{}).Where("id = ?", record.ID).Updates(updates).Error; err != nil {
			return err
		}
		return tx.Where("user_id = ?", record.ID).Delete(&sessionRecord{}).Error
	}); err != nil {
		return User{}, err
	}

	user := toUser(record)
	if err := s.createSession(ctx, user.ID); err != nil {
		return User{}, err
	}
	return user, nil
}

func (s *service) CurrentUser(ctx context.Context) (*User, error) {
	token := s.sessionToken(ctx)
	if token == "" {
		return nil, nil
	}

	db, err := s.db.Get()
	if err != nil {
		return nil, err
	}
	var session sessionRecord
	if err := db.WithContext(ctx).
		Where("token_hash = ? AND expires_at > ?", hashToken(token), time.Now()).
		First(&session).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	var record userRecord
	if err := db.WithContext(ctx).Where("id = ?", session.UserID).First(&record).Error; err != nil {
		return nil, err
	}
	user := toUser(record)
	return &user, nil
}

func (s *service) createSession(ctx context.Context, userID string) error {
	db, err := s.db.Get()
	if err != nil {
		return err
	}
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return err
	}
	token := base64.RawURLEncoding.EncodeToString(tokenBytes)
	session := sessionRecord{
		UserID:    userID,
		TokenHash: hashToken(token),
		ExpiresAt: time.Now().Add(s.config.SessionTTL),
	}
	if err := db.WithContext(ctx).Create(&session).Error; err != nil {
		return err
	}
	s.setCookie(ctx, token)
	return nil
}

func (s *service) sessionToken(ctx context.Context) string {
	h, ok := getHTTPContext(ctx)
	if !ok || h.Request == nil {
		return ""
	}
	cookie, err := h.Request.Cookie(s.config.CookieName)
	if err != nil {
		return ""
	}
	return cookie.Value
}

func (s *service) setCookie(ctx context.Context, token string) {
	h, ok := getHTTPContext(ctx)
	if !ok || h.Writer == nil {
		return
	}
	http.SetCookie(h.Writer, &http.Cookie{
		Name:     s.config.CookieName,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   s.config.CookieSecure,
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(s.config.SessionTTL),
	})
}

func (s *service) clearCookie(ctx context.Context) {
	h, ok := getHTTPContext(ctx)
	if !ok || h.Writer == nil {
		return
	}
	http.SetCookie(h.Writer, &http.Cookie{
		Name:     s.config.CookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   s.config.CookieSecure,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})
}

func normalizeUsername(username string) (string, error) {
	normalized := strings.TrimSpace(username)
	if normalized == "" || utf8.RuneCountInString(normalized) > 64 {
		return "", fmt.Errorf("%w: username must be between 1 and 64 characters", ErrInvalidInput)
	}
	return normalized, nil
}

func validatePassword(password string) error {
	if utf8.RuneCountInString(password) < 8 {
		return fmt.Errorf("%w: password must be at least 8 characters", ErrInvalidInput)
	}
	return nil
}

func hashToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}

func toUser(record userRecord) User {
	return User{ID: record.ID, Username: record.Username}
}
