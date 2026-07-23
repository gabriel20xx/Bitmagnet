package exclause

// Shared test fixtures for except_test.go, intersect_test.go, union_test.go and with_test.go,
// which all exercise near-identical scenarios for their respective clause types.
const (
	testNameStatementIsExpr     = "When statement is clause.Expr, then should be used as statement"
	testNameStatementIsSubquery = "When statement is exclause.Subquery, then should be used as statement"
	testNameSubqueryIsDB        = "When subquery is *gorm.DB, then statement is exclause.Subquery"
	testNameSubqueryIsString    = "When subquery is string, then statement is clause.Expr"
	testSQLAllPlaceholder       = "ALL ?"
	testSQLSelectFromUsers      = "SELECT * FROM users"
	testSQLSelectFromUsersWhere = "SELECT * FROM `users` WHERE `name` = ?"
	testCTEName                 = "cte"
	testNameValue               = "WinterYukky"
)
