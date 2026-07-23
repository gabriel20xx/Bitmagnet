import { useTranslation } from 'react-i18next'
import { FileText } from 'lucide-react'
import { SimpleTooltip } from '@/components/ui/tooltip'
import { useIsDesktop } from '@/lib/hooks/useMediaQuery'
import { formatFilesize } from '@/lib/utils/filesize'
import { formatTimeAgo } from '@/lib/dates/format'
import type { TorrentContentFragment } from '@/lib/graphql/generated'
import { TorrentFilesTree } from './TorrentFilesTree'

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
}: {
  torrentContent: TorrentContentFragment
  heading?: boolean
  size?: boolean
  peers?: boolean
  published?: boolean
}) {
  const { t, i18n } = useTranslation()
  const isDesktop = useIsDesktop()

  const posterPath = getAttribute(torrentContent, 'poster_path', 'tmdb')
  const genres = getCollections(torrentContent, 'genre')
  const fCount = filesCount(torrentContent)

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

        <div className="mt-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <FileText className="size-4" />
            {t('torrents.files')}
            {fCount != null && <span className="text-xs text-muted-fg">({fCount.toLocaleString(i18n.language)})</span>}
          </div>
          {torrentContent.torrent.filesStatus === 'no_info' && (
            <p className="mb-2 text-sm text-muted-fg">{t('torrents.files_no_info')}</p>
          )}
          <TorrentFilesTree torrent={torrentContent.torrent} />
        </div>
      </div>
    </div>
  )
}
