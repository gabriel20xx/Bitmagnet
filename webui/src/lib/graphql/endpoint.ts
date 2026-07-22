function resolveApiOrigin(): string {
  if (import.meta.env.DEV) {
    return 'http://localhost:3333'
  }

  return `${window.location.protocol}//${window.location.hostname}:${window.location.port}`
}

export function resolveGraphqlEndpoint(): string {
  return `${resolveApiOrigin()}/graphql`
}

export function resolveTorrentDownloadUrl(infoHash: string): string {
  return `${resolveApiOrigin()}/torrents/${infoHash}/download`
}
