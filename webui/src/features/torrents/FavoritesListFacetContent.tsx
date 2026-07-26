import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { formatIntEstimate } from '@/lib/utils/intEstimate'
import { useFavoritesLists } from './useFavoritesLists'
import { favoritesListFacet, toggleInclusiveFilter, type TorrentSearchControls } from './searchControls'

const inputClass =
  'h-7 w-full min-w-0 rounded-md border border-border bg-bg px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring'

// Special-cased content for the favorites-list facet section: unlike every other facet (whose
// values only ever come from the current search result's aggregations), favorites lists are
// user-managed entities - so this merges the authoritative list from useFavoritesLists() (used
// for create/rename/delete, and so a brand-new empty list shows up immediately) with per-list
// match counts from the aggregation (which only knows about lists with at least one current
// match).
export function FavoritesListFacetContent({
  filter,
  aggregations,
  onUpdate,
}: {
  filter?: string[]
  aggregations: { value: string; count: number; isEstimate: boolean }[]
  onUpdate: (fn: (c: TorrentSearchControls) => TorrentSearchControls) => void
}) {
  const { t, i18n } = useTranslation()
  const { lists, create, rename, remove, saving } = useFavoritesLists()
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const countsByListId = new Map(aggregations.map((a) => [a.value, a]))

  const handleCreate = () => {
    const name = newName.trim()
    if (!name) return

    create(name)
    setNewName('')
  }

  const startEditing = (id: string, name: string) => {
    setPendingDeleteId(null)
    setEditingId(id)
    setEditingName(name)
  }

  const commitRename = () => {
    const name = editingName.trim()
    if (editingId && name) rename(editingId, name)
    setEditingId(null)
  }

  const newListRow = (
    <div className="flex items-center gap-1 px-2 pt-1">
      <input
        className={inputClass}
        placeholder={t('torrents.new_list_name')}
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleCreate()
        }}
      />
      <Button type="button" variant="ghost" size="icon" disabled={!newName.trim() || saving} onClick={handleCreate}>
        <Plus className="size-4" />
      </Button>
    </div>
  )

  if (lists.length === 0) {
    return (
      <div className="space-y-2">
        <p className="px-2 text-sm text-muted-fg">{t('torrents.no_favorites_lists')}</p>
        {newListRow}
      </div>
    )
  }

  return (
    <ul className="space-y-1.5">
      {lists.map((list) => {
        if (editingId === list.id) {
          return (
            <li key={list.id} className="flex items-center gap-1 px-2">
              <input
                autoFocus
                className={inputClass}
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename()
                  if (e.key === 'Escape') setEditingId(null)
                }}
              />
              <Button type="button" variant="ghost" size="icon" onClick={commitRename} disabled={saving}>
                <Check className="size-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => setEditingId(null)}>
                <X className="size-4" />
              </Button>
            </li>
          )
        }

        if (pendingDeleteId === list.id) {
          return (
            <li key={list.id} className="space-y-1 px-2">
              <p className="text-xs text-muted-fg">
                {t('torrents.confirm_delete_favorites_list', { name: list.name })}
              </p>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  disabled={saving}
                  onClick={() => {
                    remove(list.id)
                    setPendingDeleteId(null)
                  }}
                >
                  {t('general.delete')}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setPendingDeleteId(null)}>
                  {t('general.dismiss')}
                </Button>
              </div>
            </li>
          )
        }

        const agg = countsByListId.get(list.id)
        const checked = !!filter?.includes(list.id)

        return (
          <li key={list.id} className="flex items-center gap-2 px-2 text-sm">
            <Checkbox
              checked={checked}
              onCheckedChange={(isChecked) =>
                onUpdate((c) => toggleInclusiveFilter(c, favoritesListFacet, list.id, !!isChecked))
              }
            />
            <span className="flex-1 truncate">{list.name}</span>
            <small className="text-muted-fg">
              {agg ? formatIntEstimate(agg.count, i18n.language, agg.isEstimate) : '0'}
            </small>
            <button
              type="button"
              className="text-muted-fg hover:text-fg"
              onClick={() => startEditing(list.id, list.name)}
              aria-label={t('torrents.rename_favorites_list')}
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              type="button"
              className="text-muted-fg hover:text-danger"
              onClick={() => setPendingDeleteId(list.id)}
              aria-label={t('torrents.delete_favorites_list')}
            >
              <Trash2 className="size-3.5" />
            </button>
          </li>
        )
      })}
      <li>{newListRow}</li>
    </ul>
  )
}
