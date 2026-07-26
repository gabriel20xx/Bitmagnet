import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Star, Plus, Check, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import type { TorrentContentFragment } from '@/lib/graphql/generated'
import { useFavoritesLists } from './useFavoritesLists'
import { FavoritesListsDialog } from './FavoritesListsDialog'

// Assigns every selected torrent to a favorites list in one go - used in the torrents bulk
// actions bar, alongside "send to integration". Unlike the per-row FavoritesPicker, there's
// no single "current list"/"remove" state to show for a multi-torrent selection, so this is
// add-only: pick a list (or create one) and every selected torrent gets assigned to it.
// Delegates the actual assignment to the shared useFavorite() instance (via onAssign) so its
// optimistic `overrides` - and the favorites-list sidebar counts derived from them - cover
// bulk assignment the same way they do the per-row FavoritesPicker.
export function AddToFavoritesButton({
  items,
  onAssign,
}: {
  items: TorrentContentFragment[]
  onAssign: (items: TorrentContentFragment[], listId: string) => Promise<void>
}) {
  const { t } = useTranslation()
  const { lists, create } = useFavoritesLists()
  const [newListName, setNewListName] = useState('')
  const [manageOpen, setManageOpen] = useState(false)
  const [justAssigned, setJustAssigned] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  const hasSelection = items.length > 0

  const assignAll = (listId: string) => {
    onAssign(items, listId).then(() => {
      clearTimeout(timeoutRef.current)
      setJustAssigned(true)
      timeoutRef.current = setTimeout(() => setJustAssigned(false), 1500)
    })
  }

  const handleCreate = () => {
    const name = newListName.trim()
    if (!name) return

    create(name).then((list) => {
      if (list) assignAll(list.id)
    })
    setNewListName('')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" disabled={!hasSelection}>
          {justAssigned ? <Check className="size-4" /> : <Star className="size-4" />}
          {t('torrents.add_to_favorites')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {lists.length === 0 && (
          <div className="px-2 py-1.5 text-xs text-muted-fg">{t('torrents.no_favorites_lists')}</div>
        )}
        {lists.map((list) => (
          <DropdownMenuItem key={list.id} onSelect={() => assignAll(list.id)}>
            {list.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="flex items-center gap-1 p-1" onKeyDown={(e) => e.stopPropagation()}>
          <input
            className="h-7 w-full min-w-0 rounded-md border border-border bg-bg px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder={t('torrents.new_list_name')}
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleCreate()
              }
            }}
          />
          <button
            type="button"
            className="shrink-0 rounded-md p-1 text-muted-fg hover:text-primary disabled:opacity-50"
            disabled={!newListName.trim()}
            onClick={(e) => {
              e.stopPropagation()
              handleCreate()
            }}
          >
            <Plus className="size-4" />
          </button>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setManageOpen(true)}>
          <Settings className="size-3.5" />
          {t('torrents.manage_favorites_lists')}
        </DropdownMenuItem>
      </DropdownMenuContent>
      <FavoritesListsDialog open={manageOpen} onOpenChange={setManageOpen} />
    </DropdownMenu>
  )
}
