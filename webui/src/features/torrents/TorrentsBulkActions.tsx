import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@apollo/client/react'
import { Copy, Tag, LayoutGrid, Trash2 } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { SimpleTooltip } from '@/components/ui/tooltip'
import { useIsDesktop } from '@/lib/hooks/useMediaQuery'
import { addError } from '@/lib/toast/store'
import {
  TorrentDeleteDocument,
  TorrentDeleteTagsDocument,
  TorrentPutTagsDocument,
  TorrentSetTagsDocument,
  type TorrentContentFragment,
} from '@/lib/graphql/generated'
import { TagInput } from './TagInput'
import { TorrentReprocess } from './TorrentReprocess'

export function TorrentsBulkActions({
  selectedItems,
  onUpdated,
}: {
  selectedItems: TorrentContentFragment[]
  onUpdated: () => void
}) {
  const { t } = useTranslation()
  const isDesktop = useIsDesktop()
  const [tab, setTab] = useState('copy')
  const [editedTags, setEditedTags] = useState<string[]>([])

  const [putTags] = useMutation(TorrentPutTagsDocument)
  const [setTags] = useMutation(TorrentSetTagsDocument)
  const [deleteTags] = useMutation(TorrentDeleteTagsDocument)
  const [deleteTorrents] = useMutation(TorrentDeleteDocument)

  const infoHashes = selectedItems.map((i) => i.infoHash)
  const hasSelection = infoHashes.length > 0

  const runSetTags = () => {
    if (!hasSelection) return
    setTags({ variables: { infoHashes, tagNames: editedTags } })
      .then(() => onUpdated())
      .catch((err: Error) => addError(`Error setting tags: ${err.message}`))
  }

  const runPutTags = () => {
    if (!hasSelection) return
    putTags({ variables: { infoHashes, tagNames: editedTags } })
      .then(() => onUpdated())
      .catch((err: Error) => addError(`Error putting tags: ${err.message}`))
  }

  const runDeleteTags = () => {
    if (!hasSelection) return
    deleteTags({ variables: { infoHashes, tagNames: editedTags } })
      .then(() => onUpdated())
      .catch((err: Error) => addError(`Error deleting tags: ${err.message}`))
  }

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="copy">
          <Copy className="size-4" />
          {isDesktop && t('torrents.copy')}
        </TabsTrigger>
        <TabsTrigger value="tags">
          <Tag className="size-4" />
          {isDesktop && t('torrents.edit_tags')}
        </TabsTrigger>
        <TabsTrigger value="reprocess">
          <LayoutGrid className="size-4" />
          {isDesktop && t('torrents.classification')}
        </TabsTrigger>
        <TabsTrigger value="delete">
          <Trash2 className="size-4" />
          {isDesktop && t('torrents.delete')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="copy">
        <div className="flex flex-wrap gap-2">
          <SimpleTooltip label={t('torrents.copy_to_clipboard')}>
            <Button
              variant="outline"
              disabled={!hasSelection}
              onClick={() =>
                void navigator.clipboard.writeText(selectedItems.map((i) => i.torrent.magnetUri).join('\n'))
              }
            >
              {t('torrents.magnet_links')}
            </Button>
          </SimpleTooltip>
          <SimpleTooltip label={t('torrents.copy_to_clipboard')}>
            <Button
              variant="outline"
              disabled={!hasSelection}
              onClick={() => void navigator.clipboard.writeText(infoHashes.join('\n'))}
            >
              {t('torrents.info_hashes')}
            </Button>
          </SimpleTooltip>
        </div>
      </TabsContent>

      <TabsContent value="tags">
        <TagInput
          tags={editedTags}
          onAdd={(tag) => setEditedTags((tags) => (tags.includes(tag) ? tags : [...tags, tag]))}
          onRename={(from, to) => setEditedTags((tags) => tags.map((t) => (t === from ? to : t)))}
          onDelete={(tag) => setEditedTags((tags) => tags.filter((t) => t !== tag))}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <SimpleTooltip label={t('torrents.tags.set_tip')}>
            <Button variant="outline" disabled={!hasSelection} onClick={runSetTags}>
              {t('torrents.tags.set')}
            </Button>
          </SimpleTooltip>
          <SimpleTooltip label={t('torrents.tags.put_tip')}>
            <Button variant="outline" disabled={!hasSelection || !editedTags.length} onClick={runPutTags}>
              {t('torrents.tags.put')}
            </Button>
          </SimpleTooltip>
          <SimpleTooltip label={t('torrents.tags.delete_tip')}>
            <Button variant="outline" disabled={!hasSelection || !editedTags.length} onClick={runDeleteTags}>
              {t('torrents.tags.delete')}
            </Button>
          </SimpleTooltip>
        </div>
      </TabsContent>

      <TabsContent value="reprocess">
        <TorrentReprocess infoHashes={infoHashes} onUpdated={onUpdated} />
      </TabsContent>

      <TabsContent value="delete">
        <div className="rounded-lg border border-danger/40 bg-surface p-4">
          <p className="text-sm">
            <strong>{t('torrents.delete_are_you_sure')}</strong>
            <br />
            {t('torrents.delete_action_cannot_be_undone')}.
          </p>
          <Button
            variant="danger"
            className="mt-3"
            disabled={!hasSelection}
            onClick={() =>
              void deleteTorrents({ variables: { infoHashes } })
                .then(() => onUpdated())
                .catch((err: Error) => addError(`Error deleting torrents: ${err.message}`))
            }
          >
            <Trash2 className="size-4" />
            {t('torrents.delete')}
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  )
}
