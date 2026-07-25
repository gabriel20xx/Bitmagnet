import { useState } from 'react'
import { useMutation } from '@apollo/client/react'
import { SetFavoriteDocument, RemoveFavoriteDocument, type TorrentContentFragment } from '@/lib/graphql/generated'
import { addError } from '@/lib/toast/store'

export function useFavorite() {
  const [overrides, setOverrides] = useState<Record<string, string | null>>({})
  const [setFavorite] = useMutation(SetFavoriteDocument)
  const [removeFavorite] = useMutation(RemoveFavoriteDocument)

  const favoritesListId = (item: TorrentContentFragment): string | null =>
    item.infoHash in overrides ? overrides[item.infoHash] : (item.torrent.favoritesListId ?? null)

  const assign = (item: TorrentContentFragment, listId: string) => {
    const previous = favoritesListId(item)
    setOverrides((prev) => ({ ...prev, [item.infoHash]: listId }))

    setFavorite({ variables: { input: { infoHash: item.infoHash, favoritesListId: listId } } }).catch((err: Error) => {
      addError(err.message)
      setOverrides((prev) => ({ ...prev, [item.infoHash]: previous }))
    })
  }

  const remove = (item: TorrentContentFragment) => {
    const previous = favoritesListId(item)
    setOverrides((prev) => ({ ...prev, [item.infoHash]: null }))

    removeFavorite({ variables: { infoHash: item.infoHash } }).catch((err: Error) => {
      addError(err.message)
      setOverrides((prev) => ({ ...prev, [item.infoHash]: previous }))
    })
  }

  return { favoritesListId, assign, remove }
}
