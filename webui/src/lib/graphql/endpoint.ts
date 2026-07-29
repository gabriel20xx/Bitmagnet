function resolveApiOrigin(): string {
  if (import.meta.env.DEV) {
    return window.location.origin
  }

  return `${window.location.protocol}//${window.location.hostname}:${window.location.port}`
}

export function resolveGraphqlEndpoint(): string {
  return `${resolveApiOrigin()}/graphql`
}

export function resolveTorrentDownloadUrl(infoHash: string): string {
  return `${resolveApiOrigin()}/torrents/${infoHash}/download`
}

export function resolveTorrentFileStreamUrl(infoHash: string, index: number): string {
  return `${resolveApiOrigin()}/torrents/${infoHash}/files/${index}/stream`
}

export function resolveTorrentArchiveEntryStreamUrl(infoHash: string, fileIndex: number, entryIndex: number): string {
  return `${resolveApiOrigin()}/torrents/${infoHash}/files/${fileIndex}/archive/${entryIndex}/stream`
}
