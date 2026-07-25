import { useState } from 'react'
import { useMutation } from '@apollo/client/react'
import { StarTorrentDocument, UnstarTorrentDocument, type TorrentContentFragment } from '@/lib/graphql/generated'
import { addError } from '@/lib/toast/store'

const STARRED_TAG = 'starred'

export function useStarTorrents() {
  const [overrides, setOverrides] = useState<Record<string, boolean>>({})
  const [starTorrent] = useMutation(StarTorrentDocument)
  const [unstarTorrent] = useMutation(UnstarTorrentDocument)

  const isStarred = (item: TorrentContentFragment) =>
    overrides[item.infoHash] ?? item.torrent.tagNames.includes(STARRED_TAG)

  const toggleStar = (item: TorrentContentFragment) => {
    const next = !isStarred(item)
    setOverrides((prev) => ({ ...prev, [item.infoHash]: next }))

    const mutation = next
      ? starTorrent({ variables: { infoHash: item.infoHash } })
      : unstarTorrent({ variables: { infoHash: item.infoHash } })

    mutation.catch((err: Error) => {
      addError(err.message)
      setOverrides((prev) => ({ ...prev, [item.infoHash]: !next }))
    })
  }

  return { isStarred, toggleStar }
}
