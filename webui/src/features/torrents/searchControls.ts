import { Album, Drama, FileText, Languages, Ratio, Share2, Tag, type LucideIcon } from 'lucide-react'
import type { TFunction } from 'i18next'
import type {
  ContentType,
  FileType,
  Language,
  TorrentContentOrderByField,
  TorrentContentSearchQueryVariables,
  TorrentContentSearchResultFragment,
  VideoResolution,
  VideoSource,
} from '@/lib/graphql/generated'
import { stringListParam, stringParam, intParam } from '@/lib/utils/queryString'

export type ContentTypeSelection = ContentType | 'null' | null

export const torrentTabNames = ['files', 'tags', 'reprocess', 'delete'] as const
export type TorrentTab = (typeof torrentTabNames)[number]
export type TorrentTabSelection = TorrentTab | undefined

export interface TorrentSelection {
  infoHash: string
  tab: TorrentTabSelection
}

export interface FacetInput<TValue = unknown> {
  active: boolean
  filter?: TValue[]
}

export const inactiveFacet: FacetInput<never> = { active: false }

export interface TorrentSearchFacets {
  genre: FacetInput<string>
  language: FacetInput<Language>
  fileType: FacetInput<FileType>
  torrentSource: FacetInput<string>
  torrentTag: FacetInput<string>
  videoResolution: FacetInput<VideoResolution>
  videoSource: FacetInput<VideoSource>
}

export interface OrderBySelection {
  field: TorrentContentOrderByField
  descending: boolean
}

export interface TorrentSearchControls {
  limit: number
  page: number
  queryString?: string
  contentType: ContentTypeSelection
  orderBy: OrderBySelection
  facets: TorrentSearchFacets
  selectedTorrent?: TorrentSelection
}

export const defaultLimit = 20

export const defaultOrderBy: OrderBySelection = { field: 'published_at', descending: true }
export const defaultQueryOrderBy: OrderBySelection = { field: 'relevance', descending: true }

export const initControls: TorrentSearchControls = {
  page: 1,
  limit: defaultLimit,
  contentType: null,
  orderBy: defaultOrderBy,
  facets: {
    genre: inactiveFacet,
    language: inactiveFacet,
    fileType: inactiveFacet,
    torrentSource: inactiveFacet,
    torrentTag: inactiveFacet,
    videoResolution: inactiveFacet,
    videoSource: inactiveFacet,
  },
}

export type Agg<T, AllowNull extends boolean> = {
  value: AllowNull extends true ? T | null : T
  label: string
  count: number
  isEstimate: boolean
}

export interface FacetDefinition<T, AllowNull extends boolean = boolean> {
  key: string
  icon: LucideIcon
  contentTypes?: ContentType[]
  allowNull: AllowNull
  extractInput: (facets: TorrentSearchFacets) => FacetInput<T>
  patchInput: (facets: TorrentSearchFacets, input: FacetInput<T>) => TorrentSearchFacets
  extractAggregations: (aggs: TorrentContentSearchResultFragment['aggregations']) => Array<Agg<T, AllowNull>>
  resolveLabel: (agg: Agg<T, AllowNull>, t: TFunction) => string
}

export const torrentSourceFacet: FacetDefinition<string, false> = {
  key: 'torrent_source',
  icon: Share2,
  allowNull: false,
  extractInput: (f) => f.torrentSource,
  patchInput: (f, i) => ({ ...f, torrentSource: i }),
  extractAggregations: (aggs) => aggs.torrentSource ?? [],
  resolveLabel: (agg) => agg.label,
}

export const torrentTagFacet: FacetDefinition<string, false> = {
  key: 'torrent_tag',
  icon: Tag,
  allowNull: false,
  extractInput: (f) => f.torrentTag,
  patchInput: (f, i) => ({ ...f, torrentTag: i }),
  extractAggregations: (aggs) => aggs.torrentTag ?? [],
  resolveLabel: (agg) => agg.value,
}

export const fileTypeFacet: FacetDefinition<FileType, false> = {
  key: 'file_type',
  icon: FileText,
  allowNull: false,
  extractInput: (f) => f.fileType,
  patchInput: (f, i) => ({ ...f, fileType: i }),
  extractAggregations: (aggs) => aggs.torrentFileType ?? [],
  resolveLabel: (agg, t) => t(`file_types.${agg.value}`),
}

export const languageFacet: FacetDefinition<Language, false> = {
  key: 'language',
  icon: Languages,
  allowNull: false,
  extractInput: (f) => f.language,
  patchInput: (f, i) => ({ ...f, language: i }),
  extractAggregations: (aggs) => aggs.language ?? [],
  resolveLabel: (agg, t) => t(`languages.${agg.value}`),
}

export const genreFacet: FacetDefinition<string, false> = {
  key: 'genre',
  icon: Drama,
  allowNull: false,
  contentTypes: ['movie', 'tv_show'],
  extractInput: (f) => f.genre,
  patchInput: (f, i) => ({ ...f, genre: i }),
  extractAggregations: (aggs) => aggs.genre ?? [],
  resolveLabel: (agg) => agg.label,
}

export const videoResolutionFacet: FacetDefinition<VideoResolution, true> = {
  key: 'video_resolution',
  icon: Ratio,
  allowNull: true,
  contentTypes: ['movie', 'tv_show', 'xxx'],
  extractInput: (f) => f.videoResolution,
  patchInput: (f, i) => ({ ...f, videoResolution: i }),
  extractAggregations: (aggs) => aggs.videoResolution ?? [],
  resolveLabel: (agg) => (agg.value as string | undefined)?.slice(1) ?? '?',
}

export const videoSourceFacet: FacetDefinition<VideoSource, true> = {
  key: 'video_source',
  icon: Album,
  allowNull: true,
  contentTypes: ['movie', 'tv_show', 'xxx'],
  extractInput: (f) => f.videoSource,
  patchInput: (f, i) => ({ ...f, videoSource: i }),
  extractAggregations: (aggs) => aggs.videoSource ?? [],
  resolveLabel: (agg) => (agg.value as string | undefined) ?? '?',
}

// The heterogeneous element types (each facet's T/AllowNull differ) can't be reconciled
// into a single generic signature, so callers over this list necessarily operate on `any`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const facets: FacetDefinition<any, any>[] = [
  torrentSourceFacet,
  torrentTagFacet,
  fileTypeFacet,
  languageFacet,
  genreFacet,
  videoResolutionFacet,
  videoSourceFacet,
]

export const orderByOptions: OrderBySelection[] = [
  { field: 'relevance', descending: true },
  { field: 'published_at', descending: true },
  { field: 'updated_at', descending: true },
  { field: 'size', descending: true },
  { field: 'files_count', descending: true },
  { field: 'seeders', descending: true },
  { field: 'leechers', descending: true },
  { field: 'name', descending: false },
]

export function isDefaultOrdering(ctrl: TorrentSearchControls): boolean {
  if (!ctrl.orderBy.descending) return false
  return ctrl.orderBy.field === (ctrl.queryString ? 'relevance' : 'published_at')
}

function matchesContentType(selection: ContentTypeSelection, cts?: ContentType[]): boolean {
  return !cts || !!(selection && cts.includes(selection as ContentType))
}

// Appends the tsquery prefix-match operator (already supported server-side, see
// internal/database/fts/tsquery.go) to the last word, so an in-progress word matches
// anything starting with it instead of requiring an exact/whole-word match.
function withPrefixMatch(str: string): string {
  return /\w$/.test(str) ? `${str}*` : str
}

export function controlsToQueryVariables(ctrl: TorrentSearchControls): TorrentContentSearchQueryVariables {
  return {
    input: {
      queryString: ctrl.queryString ? withPrefixMatch(ctrl.queryString) : ctrl.queryString,
      limit: ctrl.limit,
      page: ctrl.page,
      totalCount: true,
      hasNextPage: true,
      orderBy: [ctrl.orderBy],
      facets: {
        contentType: {
          aggregate: true,
          filter: ctrl.contentType ? [ctrl.contentType === 'null' ? null : ctrl.contentType] : undefined,
        },
        genre: ctrl.facets.genre.active ? { aggregate: true, filter: ctrl.facets.genre.filter } : undefined,
        language: ctrl.facets.language.active ? { aggregate: true, filter: ctrl.facets.language.filter } : undefined,
        torrentFileType: ctrl.facets.fileType.active
          ? { aggregate: true, filter: ctrl.facets.fileType.filter }
          : undefined,
        torrentSource: ctrl.facets.torrentSource.active
          ? { aggregate: true, filter: ctrl.facets.torrentSource.filter }
          : undefined,
        torrentTag: ctrl.facets.torrentTag.active
          ? { aggregate: true, filter: ctrl.facets.torrentTag.filter }
          : undefined,
        videoResolution: ctrl.facets.videoResolution.active
          ? { aggregate: true, filter: ctrl.facets.videoResolution.filter }
          : undefined,
        videoSource: ctrl.facets.videoSource.active
          ? { aggregate: true, filter: ctrl.facets.videoSource.filter }
          : undefined,
      },
    },
  }
}

export function selectContentType(ctrl: TorrentSearchControls, ct: ContentTypeSelection): TorrentSearchControls {
  return {
    ...ctrl,
    contentType: ct,
    page: 1,
    facets: {
      ...ctrl.facets,
      genre: matchesContentType(ct, genreFacet.contentTypes) ? ctrl.facets.genre : inactiveFacet,
      videoResolution: matchesContentType(ct, videoResolutionFacet.contentTypes)
        ? ctrl.facets.videoResolution
        : inactiveFacet,
      videoSource: matchesContentType(ct, videoSourceFacet.contentTypes) ? ctrl.facets.videoSource : inactiveFacet,
    },
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function activateFacet(ctrl: TorrentSearchControls, def: FacetDefinition<any, any>): TorrentSearchControls {
  return { ...ctrl, facets: def.patchInput(ctrl.facets, { ...def.extractInput(ctrl.facets), active: true }) }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function deactivateFacet(ctrl: TorrentSearchControls, def: FacetDefinition<any, any>): TorrentSearchControls {
  const input = def.extractInput(ctrl.facets)
  return {
    ...ctrl,
    page: input.filter ? 1 : ctrl.page,
    facets: def.patchInput(ctrl.facets, { ...input, active: false, filter: undefined }),
  }
}

export function activateFilter(
  ctrl: TorrentSearchControls,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  def: FacetDefinition<any, any>,
  filter: unknown,
): TorrentSearchControls {
  const input = def.extractInput(ctrl.facets)
  return {
    ...ctrl,
    page: 1,
    facets: def.patchInput(ctrl.facets, {
      ...input,
      filter: Array.from(new Set([...((input.filter as unknown[] | undefined) ?? []), filter])).sort(),
    }),
  }
}

export function deactivateFilter(
  ctrl: TorrentSearchControls,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  def: FacetDefinition<any, any>,
  filter: unknown,
): TorrentSearchControls {
  const input = def.extractInput(ctrl.facets)
  const nextFilter = (input.filter as unknown[] | undefined)?.filter((value) => value !== filter)
  return {
    ...ctrl,
    page: 1,
    facets: def.patchInput(ctrl.facets, { ...input, filter: nextFilter?.length ? nextFilter : undefined }),
  }
}

export function setQueryString(ctrl: TorrentSearchControls, str: string | null | undefined): TorrentSearchControls {
  str = str || undefined
  let orderBy = ctrl.orderBy
  if (str) {
    if (str !== ctrl.queryString) orderBy = defaultQueryOrderBy
  } else if (orderBy.field === 'relevance') {
    orderBy = defaultOrderBy
  }
  return { ...ctrl, queryString: str, orderBy, page: str === ctrl.queryString ? ctrl.page : 1 }
}

export function selectOrderBy(ctrl: TorrentSearchControls, field: TorrentContentOrderByField): TorrentSearchControls {
  const orderBy: OrderBySelection = {
    field,
    descending: orderByOptions.find((option) => option.field === field)?.descending ?? false,
  }
  return {
    ...ctrl,
    orderBy: orderBy.field !== 'relevance' || ctrl.queryString ? orderBy : defaultOrderBy,
    page: 1,
  }
}

export function toggleOrderByDirection(ctrl: TorrentSearchControls): TorrentSearchControls {
  return { ...ctrl, orderBy: { ...ctrl.orderBy, descending: !ctrl.orderBy.descending }, page: 1 }
}

export function selectTorrent(
  ctrl: TorrentSearchControls,
  infoHash: string,
  tab?: TorrentTabSelection | null,
): TorrentSearchControls {
  const resolvedTab = tab === undefined ? ctrl.selectedTorrent?.tab : tab === null ? undefined : tab
  return { ...ctrl, selectedTorrent: { infoHash, tab: resolvedTab } }
}

export function toggleSelectedTorrent(ctrl: TorrentSearchControls, infoHash: string): TorrentSearchControls {
  return {
    ...ctrl,
    selectedTorrent:
      ctrl.selectedTorrent?.infoHash === infoHash ? undefined : { infoHash, tab: ctrl.selectedTorrent?.tab },
  }
}

const contentTypeValues = new Set<string>([
  'movie',
  'tv_show',
  'music',
  'ebook',
  'comic',
  'audiobook',
  'software',
  'game',
  'xxx',
  'null',
])

function contentTypeParam(params: URLSearchParams): ContentTypeSelection {
  const str = stringParam(params, 'content_type')
  return str && contentTypeValues.has(str) ? (str as ContentTypeSelection) : null
}

function orderByParam(params: URLSearchParams, hasQuery: boolean): OrderBySelection {
  let desc: boolean | null = null
  const strDesc = stringParam(params, 'desc')
  if (strDesc === '1') desc = true
  else if (strDesc === '0') desc = false
  const field = stringParam(params, 'order')
  const opt = orderByOptions.find((o) => o.field === field)
  if (opt) {
    return { field: opt.field, descending: desc ?? opt.descending }
  }
  return { field: hasQuery ? 'relevance' : 'published_at', descending: desc ?? true }
}

export function paramsToControls(params: URLSearchParams): TorrentSearchControls {
  const queryString = stringParam(params, 'query')
  const activeFacets = stringListParam(params, 'facets')
  let selectedTorrent: TorrentSelection | undefined
  const selectedTorrentParam = stringParam(params, 'torrent')
  if (selectedTorrentParam) {
    const strTab = stringParam(params, 'tab')
    const tab = torrentTabNames.includes(strTab as TorrentTab) ? (strTab as TorrentTab) : undefined
    selectedTorrent = { infoHash: selectedTorrentParam, tab }
  }
  return {
    queryString,
    orderBy: orderByParam(params, !!queryString),
    contentType: contentTypeParam(params),
    limit: intParam(params, 'limit') ?? defaultLimit,
    page: intParam(params, 'page') ?? 1,
    selectedTorrent,
    facets: facets.reduce<TorrentSearchFacets>((acc, facet) => {
      const active = activeFacets?.includes(facet.key) ?? false
      const filter = stringListParam(params, facet.key)
      return facet.patchInput(acc, { active, filter: filter as never })
    }, initControls.facets),
  }
}

function flattenFacets(ctrl: TorrentSearchFacets): Record<string, string | undefined> {
  const activeFacets: string[] = []
  const filters: Record<string, string> = {}
  for (const f of facets) {
    const input = f.extractInput(ctrl)
    if (input.active) {
      activeFacets.push(f.key)
      if (input.filter?.length) {
        filters[f.key] = input.filter.join(',')
      }
    }
  }
  return {
    facets: activeFacets.length ? activeFacets.join(',') : undefined,
    ...filters,
  }
}

export function controlsToParams(ctrl: TorrentSearchControls): URLSearchParams {
  const params = new URLSearchParams()
  const set = (key: string, value: string | undefined) => {
    if (value !== undefined && value !== '') params.set(key, value)
  }
  set('query', ctrl.queryString)
  set('page', ctrl.page === 1 ? undefined : String(ctrl.page))
  set('limit', ctrl.limit === defaultLimit ? undefined : String(ctrl.limit))
  set('content_type', ctrl.contentType ?? undefined)
  const orderBy = isDefaultOrdering(ctrl) ? undefined : ctrl.orderBy
  set('order', orderBy?.field)
  set('desc', orderBy ? (orderBy.descending ? '1' : '0') : undefined)
  if (ctrl.selectedTorrent) {
    set('torrent', ctrl.selectedTorrent.infoHash)
    set('tab', ctrl.selectedTorrent.tab)
  }
  const flat = flattenFacets(ctrl.facets)
  for (const [key, value] of Object.entries(flat)) {
    set(key, value)
  }
  return params
}
