import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Star, Plus, X, Settings } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { SimpleTooltip } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { FavoritesListsDialog } from './FavoritesListsDialog'
import { useFavoritesLists } from './useFavoritesLists'

export function FavoritesPicker({
  favoritesListId,
  onAssign,
  onRemove,
}: {
  favoritesListId: string | null
  onAssign: (listId: string) => void
  onRemove: () => void
}) {
  const { t } = useTranslation()
  const { lists, create } = useFavoritesLists()
  const [newListName, setNewListName] = useState('')
  const [manageOpen, setManageOpen] = useState(false)
  const isFavorited = favoritesListId != null
  const currentList = lists.find((l) => l.id === favoritesListId)

  const handleCreate = () => {
    const name = newListName.trim()
    if (!name) return

    create(name).then((list) => {
      if (list) onAssign(list.id)
    })
    setNewListName('')
  }

  return (
    <DropdownMenu>
      <SimpleTooltip
        label={
          isFavorited
            ? t('torrents.favorited_in_list', { name: currentList?.name ?? '' })
            : t('torrents.add_to_favorites')
        }
      >
        <DropdownMenuTrigger asChild>
          <button type="button" className="shrink-0" onClick={(e) => e.stopPropagation()}>
            <Star
              className={cn(
                'size-4',
                isFavorited ? 'fill-yellow-400 text-yellow-400' : 'text-primary hover:text-yellow-400',
              )}
            />
          </button>
        </DropdownMenuTrigger>
      </SimpleTooltip>
      <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
        {lists.length === 0 && (
          <div className="px-2 py-1.5 text-xs text-muted-fg">{t('torrents.no_favorites_lists')}</div>
        )}
        {lists.map((list) => (
          <DropdownMenuItem key={list.id} active={list.id === favoritesListId} onSelect={() => onAssign(list.id)}>
            {list.name}
          </DropdownMenuItem>
        ))}
        {isFavorited && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onRemove}>
              <X className="size-3.5" />
              {t('torrents.remove_from_favorites')}
            </DropdownMenuItem>
          </>
        )}
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
