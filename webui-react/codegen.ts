import * as path from 'path'
import type { CodegenConfig } from '@graphql-codegen/cli'

// fast-glob (used by the loaders below) only understands forward slashes, so
// path.resolve's backslash-separated output on Windows must be normalized.
const toPosix = (p: string) => p.split(path.sep).join('/')

const config: CodegenConfig = {
  schema: toPosix(path.resolve(__dirname, '../graphql/schema/**/*.graphqls')),
  documents: toPosix(path.resolve(__dirname, '../graphql/{fragments,mutations,queries}/*.graphql')),
  generates: {
    './src/lib/graphql/generated.ts': {
      plugins: [
        'typescript-operations',
        'typed-document-node',
        {
          add: {
            content: '// THIS FILE IS GENERATED, DO NOT EDIT!',
          },
        },
      ],
      config: {
        addExplicitOverride: true,
        useTypeImports: true,
        enumsAsTypes: true,
        skipTypename: false,
        strictScalars: true,
        scalars: {
          Date: 'string',
          DateTime: 'string',
          Duration: 'string',
          Hash20: 'string',
          Void: 'void',
          Year: 'number',
        },
      },
    },
  },
}

export default config
