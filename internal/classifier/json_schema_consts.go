package classifier

// JSON Schema (draft-07) keyword/type-name constants and shared $ref targets, reused across the
// various action/condition JSONSchema() builders in this package.
const (
	jsonSchemaTypeObject = "object"
	jsonSchemaTypeArray  = "array"
	jsonSchemaTypeString = "string"

	jsonSchemaKeyType                 = "type"
	jsonSchemaKeyRef                  = "$ref"
	jsonSchemaKeyProperties           = "properties"
	jsonSchemaKeyAdditionalProperties = "additionalProperties"
	jsonSchemaKeyItems                = "items"
	jsonSchemaKeyOneOf                = "oneOf"
	jsonSchemaKeyCondition            = "condition"

	refCondition    = "#/definitions/condition"
	refAction       = "#/definitions/action"
	refActionSingle = "#/definitions/action_single"
)
