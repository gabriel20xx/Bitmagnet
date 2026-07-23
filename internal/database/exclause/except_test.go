package exclause

import (
	"database/sql/driver"
	"reflect"
	"regexp"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func TestExcept_Query(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name      string
		operation func(db *gorm.DB) *gorm.DB
		want      string
		wantErr   bool
		wantArgs  []driver.Value
	}{
		{
			name: testNameStatementIsExpr,
			operation: func(db *gorm.DB) *gorm.DB {
				return db.Table("general_users").
					Clauses(Except{
						Statements: []clause.Expression{
							clause.Expr{
								SQL:  testSQLAllPlaceholder,
								Vars: []interface{}{db.Table("admin_users")},
							},
						},
					}).Scan(nil)
			},
			want:     "SELECT * FROM `general_users` EXCEPT ALL SELECT * FROM `admin_users`",
			wantArgs: []driver.Value{},
		},
		{
			name: testNameStatementIsSubquery,
			operation: func(db *gorm.DB) *gorm.DB {
				return db.Table("general_users").
					Clauses(Except{
						Statements: []clause.Expression{
							Subquery{
								DB: db.Table("admin_users"),
							},
						},
					}).Scan(nil)
			},
			want:     "SELECT * FROM `general_users` EXCEPT SELECT * FROM `admin_users`",
			wantArgs: []driver.Value{},
		},
		{
			name: "When has multiple EXCEPT, then should be used all EXCEPT clause",
			operation: func(db *gorm.DB) *gorm.DB {
				return db.Table("general_users").
					Clauses(Except{
						Statements: []clause.Expression{
							Subquery{
								DB: db.Table("admin_users"),
							},
						},
					}).
					Clauses(Except{
						Statements: []clause.Expression{
							Subquery{
								DB: db.Table("guest_users"),
							},
						},
					}).Scan(nil)
			},
			want: "SELECT * FROM `general_users` EXCEPT SELECT * FROM " +
				"`admin_users` EXCEPT SELECT * FROM `guest_users`",
			wantArgs: []driver.Value{},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			mockDB, mock, err := sqlmock.New()
			if err != nil {
				t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
			}

			defer mockDB.Close()

			db, _ := gorm.Open(mysql.New(mysql.Config{
				Conn:                      mockDB,
				SkipInitializeWithVersion: true,
			}))
			if err := db.Use(New()); err != nil {
				t.Fatalf("an error '%s' was not expected when using the database plugin", err)
			}

			mock.ExpectQuery(regexp.QuoteMeta(tt.want)).
				WithArgs(tt.wantArgs...).
				WillReturnRows(sqlmock.NewRows([]string{}))

			if tt.operation != nil {
				db = tt.operation(db)
			}

			if db.Error != nil {
				t.Error(db.Error.Error())
			}
		})
	}
}

func TestNewExcept(t *testing.T) {
	t.Parallel()

	mockDB, _, err := sqlmock.New()
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}

	t.Cleanup(func() {
		_ = mockDB.Close()
	})

	db, _ := gorm.Open(mysql.New(mysql.Config{
		Conn:                      mockDB,
		SkipInitializeWithVersion: true,
	}))
	db = db.Table("users")

	type args struct {
		subquery interface{}
	}

	tests := []struct {
		name string
		args args
		want Except
	}{
		{
			name: testNameSubqueryIsDB,
			args: args{
				subquery: db,
			},
			want: Except{
				Statements: []clause.Expression{
					Subquery{
						DB: db,
					},
				},
			},
		},
		{
			name: testNameSubqueryIsString,
			args: args{
				subquery: testSQLSelectFromUsers,
			},
			want: Except{
				Statements: []clause.Expression{
					clause.Expr{
						SQL: testSQLSelectFromUsers,
					},
				},
			},
		},
		{
			name: "When subquery is else, then statement is empty Except",
			args: args{
				subquery: 0,
			},
			want: Except{},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			if got := NewExcept(tt.args.subquery); !reflect.DeepEqual(got, tt.want) {
				t.Errorf("NewExcept() = %v, want %v", got, tt.want)
			}
		})
	}
}
