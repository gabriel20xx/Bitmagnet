import { useState } from 'react'

const LIVE_TORRENT_SEARCH_STORAGE_KEY = 'bitmagnet-live-torrent-search'

function readLiveTorrentSearchEnabled(): boolean {
  return typeof window !== 'undefined' && window.localStorage.getItem(LIVE_TORRENT_SEARCH_STORAGE_KEY) === 'true'
}

// Defaults to off: the torrents search bar only searches on Enter unless a user opts into
// searching as they type via the admin page.
export function useLiveTorrentSearch() {
  const [enabled, setEnabledState] = useState(readLiveTorrentSearchEnabled)

  const setEnabled = (value: boolean) => {
    window.localStorage.setItem(LIVE_TORRENT_SEARCH_STORAGE_KEY, String(value))
    setEnabledState(value)
  }

  return [enabled, setEnabled] as const
}
