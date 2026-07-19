export function resolveGraphqlEndpoint(): string {
  if (import.meta.env.DEV) {
    return 'http://localhost:3333/graphql'
  }

  return `${window.location.protocol}//${window.location.hostname}:${window.location.port}/graphql`
}
