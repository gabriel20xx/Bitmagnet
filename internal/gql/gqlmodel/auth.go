package gqlmodel

import (
	"context"

	"github.com/bitmagnet-io/bitmagnet/internal/auth"
	"github.com/bitmagnet-io/bitmagnet/internal/gql/gqlmodel/gen"
)

type AuthQuery struct {
	Service auth.Service
}

func (q AuthQuery) Status(ctx context.Context) (gen.AuthStatus, error) {
	status, err := q.Service.Status(ctx)
	if err != nil {
		return gen.AuthStatus{}, err
	}

	result := gen.AuthStatus{
		SetupRequired: status.SetupRequired,
		Authenticated: status.Authenticated,
	}
	if status.User != nil {
		result.User = &gen.AuthUser{Username: status.User.Username}
	}
	return result, nil
}

type AuthMutation struct {
	Service auth.Service
}

func (m AuthMutation) CreateInitialUser(ctx context.Context, input gen.CreateInitialUserInput) (gen.AuthResult, error) {
	user, err := m.Service.CreateInitialUser(ctx, input.Username, input.Password)
	if err != nil {
		return gen.AuthResult{}, err
	}
	return authResult(user), nil
}

func (m AuthMutation) Login(ctx context.Context, input gen.LoginInput) (gen.AuthResult, error) {
	user, err := m.Service.Login(ctx, input.Username, input.Password)
	if err != nil {
		return gen.AuthResult{}, err
	}
	return authResult(user), nil
}

func (m AuthMutation) Logout(ctx context.Context) (bool, error) {
	return true, m.Service.Logout(ctx)
}

func (m AuthMutation) UpdateCredentials(ctx context.Context, input gen.UpdateCredentialsInput) (gen.AuthResult, error) {
	var username *string
	if value, ok := input.Username.ValueOK(); ok {
		username = value
	}
	var newPassword *string
	if value, ok := input.NewPassword.ValueOK(); ok {
		newPassword = value
	}
	user, err := m.Service.UpdateCredentials(ctx, input.CurrentPassword, username, newPassword)
	if err != nil {
		return gen.AuthResult{}, err
	}
	return authResult(user), nil
}

func authResult(user auth.User) gen.AuthResult {
	return gen.AuthResult{User: gen.AuthUser{Username: user.Username}}
}
