import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useFavoritesLists } from './useFavoritesLists'

const inputClass =
  'h-8 w-full min-w-0 rounded-md border border-border bg-bg px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function FavoritesListsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation()
  const { lists, create, rename, remove, saving } = useFavoritesLists()
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('torrents.favorites_lists')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-1">
          {lists.length === 0 && <p className="text-sm text-muted-fg">{t('torrents.no_favorites_lists')}</p>}
          {lists.map((list) => (
            <div key={list.id} className="flex items-center gap-2 rounded-md px-1 py-1.5">
              {editingId === list.id ? (
                <>
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
                </>
              ) : pendingDeleteId === list.id ? (
                <>
                  <p className="min-w-0 flex-1 truncate text-sm">
                    {t('torrents.confirm_delete_favorites_list', { name: list.name })}
                  </p>
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
                </>
              ) : (
                <>
                  <p className="min-w-0 flex-1 truncate text-sm">{list.name}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t('torrents.rename_favorites_list')}
                    onClick={() => startEditing(list.id, list.name)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t('torrents.delete_favorites_list')}
                    onClick={() => setPendingDeleteId(list.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 border-t border-border pt-3">
          <input
            className={inputClass}
            placeholder={t('torrents.new_list_name')}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!newName.trim() || saving}
            onClick={handleCreate}
          >
            <Plus className="size-4" />
            {t('torrents.create_favorites_list')}
          </Button>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('general.dismiss')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
