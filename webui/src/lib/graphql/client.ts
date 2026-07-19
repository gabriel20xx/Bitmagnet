import { ApolloClient, InMemoryCache } from '@apollo/client'
import { HttpLink } from '@apollo/client/link/http'
import { resolveGraphqlEndpoint } from './endpoint'

export const apolloClient = new ApolloClient({
  link: new HttpLink({ uri: resolveGraphqlEndpoint() }),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          search: {
            merge(existing: Record<string, unknown>, incoming: Record<string, unknown>) {
              return { ...existing, ...incoming }
            },
          },
        },
      },
    },
  }),
})
