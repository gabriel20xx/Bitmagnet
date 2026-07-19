import { useTranslation } from 'react-i18next'
import { useMutation } from '@apollo/client/react'
import { FileText, Tag, LayoutGrid, Trash2 } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { SimpleTooltip } from '@/components/ui/tooltip'
import { useIsDesktop } from '@/lib/hooks/useMediaQuery'
import { formatFilesize } from '@/lib/utils/filesize'
import { formatTimeAgo } from '@/lib/dates/format'
import { addError } from '@/lib/toast/store'
import { TorrentDeleteDocument, type TorrentContentFragment } from '@/lib/graphql/generated'
import type { TorrentTabSelection } from './searchControls'
import { TorrentFilesTable } from './TorrentFilesTable'
import { TorrentEditTags } from './TorrentEditTags'
import { TorrentReprocess } from './TorrentReprocess'

function getAttribute(tc: TorrentContentFragment, key: string, source?: string): string | undefined {
  return tc.content?.attributes?.find((a) => a.key === key && (source === undefined || a.source === source))?.value
}

function getCollections(tc: TorrentContentFragment, type: string): string[] | undefined {
  const collections = tc.content?.collections?.filter((a) => a.type === type).map((a) => a.name)
  return collections?.length ? collections.sort() : undefined
}

function filesCount(tc: TorrentContentFragment): number | undefined {
  if (tc.torrent.filesStatus === 'single') return 1
  return tc.torrent.filesCount ?? undefined
}

export function TorrentContent({
  torrentContent,
  heading = true,
  size = true,
  peers = true,
  published = true,
  selectedTab,
  onTabSelected,
  onUpdated,
}: {
  torrentContent: TorrentContentFragment
  heading?: boolean
  size?: boolean
  peers?: boolean
  published?: boolean
  selectedTab: TorrentTabSelection
  onTabSelected: (tab: TorrentTabSelection) => void
  onUpdated: () => void
}) {
  const { t, i18n } = useTranslation()
  const isDesktop = useIsDesktop()
  const [deleteTorrent] = useMutation(TorrentDeleteDocument)

  const posterPath = getAttribute(torrentContent, 'poster_path', 'tmdb')
  const genres = getCollections(torrentContent, 'genre')
  const fCount = filesCount(torrentContent)
  const tab = selectedTab ?? 'files'

  return (
    <div className="grid gap-4 md:grid-cols-[auto_1fr]">
      {posterPath && (
        <img
          src={`https://image.tmdb.org/t/p/w300${posterPath}`}
          alt={t('torrents.poster')}
          width={isDesktop ? 300 : 150}
          height={isDesktop ? 450 : 225}
          className="h-fit rounded-md"
        />
      )}
      <div className="min-w-0">
        {heading && (
          <h2 className="mb-2 text-lg font-semibold">
            <a href={`torrents/permalink/${torrentContent.infoHash}`} title={t('torrents.permalink')}>
              {torrentContent.torrent.name}
            </a>
          </h2>
        )}
        <div className="space-y-1 text-sm">
          {size && (
            <p>
              <strong>{t('torrents.size')}:</strong>{' '}
              <span title={formatFilesize(torrentContent.torrent.size, i18n.language, 10)}>
                {formatFilesize(torrentContent.torrent.size, i18n.language)}
              </span>
            </p>
          )}
          {published && (
            <p>
              <strong>{t('torrents.published')}</strong> {formatTimeAgo(torrentContent.publishedAt, i18n.language)}
            </p>
          )}
          {peers && (
            <p>
              <strong>{t('torrents.s_l')}:</strong> {torrentContent.seeders ?? '?'} / {torrentContent.leechers ?? '?'}
            </p>
          )}
          <p>
            <strong>{t('torrents.info_hash')}:</strong>{' '}
            <SimpleTooltip label={t('torrents.copy_to_clipboard')}>
              <button
                onClick={() => void navigator.clipboard.writeText(torrentContent.infoHash)}
                className="font-mono hover:underline"
              >
                {torrentContent.infoHash}
              </button>
            </SimpleTooltip>
          </p>
          <p>
            <strong>{t('torrents.source')}:</strong> {torrentContent.torrent.sources.map((s) => s.name).join(', ')}
          </p>
          {torrentContent.content && (
            <p>
              <strong>{t('torrents.title')}:</strong> {torrentContent.content.title}
            </p>
          )}
          {!!torrentContent.languages?.length && (
            <p>
              <strong>{t('torrents.languages')}:</strong>{' '}
              {torrentContent.languages
                .map((l) => l.name + (l.id === torrentContent.content?.originalLanguage?.id ? ' (original)' : ''))
                .join(', ')}
            </p>
          )}
          {torrentContent.content?.releaseYear && (
            <p>
              <strong>{t('torrents.original_release_date')}:</strong>{' '}
              {torrentContent.content.releaseDate ?? torrentContent.content.releaseYear}
            </p>
          )}
          {torrentContent.episodes && (
            <p>
              <strong>{t('torrents.episodes')}:</strong> {torrentContent.episodes.label}
            </p>
          )}
          {torrentContent.content?.overview && <p>{torrentContent.content.overview}</p>}
          {genres && (
            <p>
              <strong>{t('torrents.genres')}:</strong> {genres.join(', ')}
            </p>
          )}
          {torrentContent.content?.voteAverage != null && (
            <p>
              <strong>{t('torrents.rating')}:</strong> {torrentContent.content.voteAverage} / 10
              {torrentContent.content.voteCount != null &&
                ` (${t('torrents.votes_count_n', { count: torrentContent.content.voteCount })})`}
            </p>
          )}
          {!!torrentContent.content?.externalLinks?.length && (
            <p>
              <strong>{t('torrents.external_links')}:</strong>{' '}
              {torrentContent.content.externalLinks.map((l, j) => (
                <span key={l.metadataSource.key}>
                  {j > 0 && ', '}
                  <a href={l.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    {l.metadataSource.name}
                  </a>
                </span>
              ))}
            </p>
          )}
        </div>

        <Tabs value={tab} onValueChange={(v) => onTabSelected(v as TorrentTabSelection)} className="mt-4">
          <TabsList>
            <TabsTrigger value="files">
              <FileText className="size-4" />
              {isDesktop && t('torrents.files')}
              {fCount != null && (
                <span className="text-xs text-muted-fg">({fCount.toLocaleString(i18n.language)})</span>
              )}
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
          <TabsContent value="files">
            {torrentContent.torrent.filesStatus === 'no_info' && (
              <p className="mb-2 text-sm text-muted-fg">{t('torrents.files_no_info')}</p>
            )}
            <TorrentFilesTable torrent={torrentContent.torrent} />
          </TabsContent>
          <TabsContent value="tags">
            <TorrentEditTags torrentContent={torrentContent} onUpdated={onUpdated} />
          </TabsContent>
          <TabsContent value="reprocess">
            <TorrentReprocess infoHashes={[torrentContent.infoHash]} onUpdated={onUpdated} />
          </TabsContent>
          <TabsContent value="delete">
            <div className="rounded-lg border border-danger/40 bg-surface p-4">
              <p className="text-sm">
                <strong>{t('torrents.delete_are_you_sure')}</strong>
                <br />
                {t('torrents.delete_action_cannot_be_undone')}
              </p>
              <Button
                variant="danger"
                className="mt-3"
                onClick={() =>
                  void deleteTorrent({ variables: { infoHashes: [torrentContent.infoHash] } })
                    .then(() => onUpdated())
                    .catch((err: Error) => addError(`Error deleting torrent: ${err.message}`))
                }
              >
                <Trash2 className="size-4" />
                {t('torrents.delete')}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
