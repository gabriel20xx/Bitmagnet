import { useState } from 'react'
import { useMutation } from '@apollo/client/react'
import { SetFavoriteDocument, RemoveFavoriteDocument, type TorrentContentFragment } from '@/lib/graphql/generated'
import { addError } from '@/lib/toast/store'

// onChanged, if given, fires after a favorite assignment/removal is confirmed by the server -
// used to trigger a real refetch that reconciles the favorites-list sidebar counts (which come
// from the torrent search query's aggregations) with the server's ground truth. The `overrides`
// map returned below lets callers reflect the change in those same counts optimistically, ahead
// of that refetch, so the sidebar updates in lockstep with the star icon instead of lagging
// behind a network round trip.
export function useFavorite(onChanged?: () => void) {
  const [overrides, setOverrides] = useState<Record<string, string | null>>({})
  const [setFavorite] = useMutation(SetFavoriteDocument)
  const [removeFavorite] = useMutation(RemoveFavoriteDocument)

  const favoritesListId = (item: TorrentContentFragment): string | null =>
    item.infoHash in overrides ? overrides[item.infoHash] : (item.torrent.favoritesListId ?? null)

  const assign = (item: TorrentContentFragment, listId: string) => {
    const previous = favoritesListId(item)
    setOverrides((prev) => ({ ...prev, [item.infoHash]: listId }))

    setFavorite({ variables: { input: { infoHash: item.infoHash, favoritesListId: listId } } })
      .then(() => onChanged?.())
      .catch((err: Error) => {
        addError(err.message)
        setOverrides((prev) => ({ ...prev, [item.infoHash]: previous }))
      })
  }

  const remove = (item: TorrentContentFragment) => {
    const previous = favoritesListId(item)
    setOverrides((prev) => ({ ...prev, [item.infoHash]: null }))

    removeFavorite({ variables: { infoHash: item.infoHash } })
      .then(() => onChanged?.())
      .catch((err: Error) => {
        addError(err.message)
        setOverrides((prev) => ({ ...prev, [item.infoHash]: previous }))
      })
  }

  const assignMany = (items: TorrentContentFragment[], listId: string) => {
    const previous: Record<string, string | null> = {}
    for (const item of items) previous[item.infoHash] = favoritesListId(item)
    setOverrides((prev) => {
      const next = { ...prev }
      for (const item of items) next[item.infoHash] = listId
      return next
    })

    return Promise.all(
      items.map((item) => setFavorite({ variables: { input: { infoHash: item.infoHash, favoritesListId: listId } } })),
    )
      .then(() => {
        onChanged?.()
      })
      .catch((err: Error) => {
        addError(err.message)
        setOverrides((prev) => {
          const next = { ...prev }
          for (const item of items) next[item.infoHash] = previous[item.infoHash]
          return next
        })
      })
  }

  return { favoritesListId, overrides, assign, remove, assignMany }
}
