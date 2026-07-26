import { Album, Drama, FileText, Languages, Ratio, Share2, Star, type LucideIcon } from 'lucide-react'
import type { TFunction } from 'i18next'
import type {
  ContentType,
  FileType,
  Language,
  TorrentContentFragment,
  TorrentContentOrderByField,
  TorrentContentSearchQueryVariables,
  TorrentContentSearchResultFragment,
  VideoResolution,
  VideoSource,
} from '@/lib/graphql/generated'
import { stringListParam, stringParam, intParam } from '@/lib/utils/queryString'

export type ContentTypeSelection = ContentType | 'null' | null

interface TorrentSelection {
  infoHash: string
}

interface FacetInput<TValue = unknown> {
  active: boolean
  filter?: TValue[]
}

const inactiveFacet: FacetInput<never> = { active: false }

interface TorrentSearchFacets {
  genre: FacetInput<string>
  language: FacetInput<Language>
  fileType: FacetInput<FileType>
  torrentSource: FacetInput<string>
  videoResolution: FacetInput<VideoResolution>
  videoSource: FacetInput<VideoSource>
  favoritesList: FacetInput<string>
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
  sizeMin?: number
  sizeMax?: number
}

const defaultLimit = 20

const defaultOrderBy: OrderBySelection = { field: 'published_at', descending: true }

const initControls: TorrentSearchControls = {
  page: 1,
  limit: defaultLimit,
  contentType: null,
  orderBy: defaultOrderBy,
  facets: {
    genre: inactiveFacet,
    language: inactiveFacet,
    fileType: inactiveFacet,
    torrentSource: inactiveFacet,
    videoResolution: inactiveFacet,
    videoSource: inactiveFacet,
    favoritesList: inactiveFacet,
  },
  sizeMin: undefined,
  sizeMax: undefined,
}

type Agg<T, AllowNull extends boolean> = {
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

const torrentSourceFacet: FacetDefinition<string, false> = {
  key: 'torrent_source',
  icon: Share2,
  allowNull: false,
  extractInput: (f) => f.torrentSource,
  patchInput: (f, i) => ({ ...f, torrentSource: i }),
  extractAggregations: (aggs) => aggs.torrentSource ?? [],
  resolveLabel: (agg) => agg.label,
}

const fileTypeFacet: FacetDefinition<FileType, false> = {
  key: 'file_type',
  icon: FileText,
  allowNull: false,
  extractInput: (f) => f.fileType,
  patchInput: (f, i) => ({ ...f, fileType: i }),
  extractAggregations: (aggs) => aggs.torrentFileType ?? [],
  resolveLabel: (agg, t) => t(`file_types.${agg.value}`),
}

const languageFacet: FacetDefinition<Language, false> = {
  key: 'language',
  icon: Languages,
  allowNull: false,
  extractInput: (f) => f.language,
  patchInput: (f, i) => ({ ...f, language: i }),
  extractAggregations: (aggs) => aggs.language ?? [],
  resolveLabel: (agg, t) => t(`languages.${agg.value}`),
}

const genreFacet: FacetDefinition<string, false> = {
  key: 'genre',
  icon: Drama,
  allowNull: false,
  contentTypes: ['movie', 'tv_show'],
  extractInput: (f) => f.genre,
  patchInput: (f, i) => ({ ...f, genre: i }),
  extractAggregations: (aggs) => aggs.genre ?? [],
  resolveLabel: (agg) => agg.label,
}

const videoResolutionFacet: FacetDefinition<VideoResolution, true> = {
  key: 'video_resolution',
  icon: Ratio,
  allowNull: true,
  contentTypes: ['movie', 'tv_show', 'xxx'],
  extractInput: (f) => f.videoResolution,
  patchInput: (f, i) => ({ ...f, videoResolution: i }),
  extractAggregations: (aggs) => aggs.videoResolution ?? [],
  resolveLabel: (agg) => (agg.value as string | undefined)?.slice(1) ?? '?',
}

const videoSourceFacet: FacetDefinition<VideoSource, true> = {
  key: 'video_source',
  icon: Album,
  allowNull: true,
  contentTypes: ['movie', 'tv_show', 'xxx'],
  extractInput: (f) => f.videoSource,
  patchInput: (f, i) => ({ ...f, videoSource: i }),
  extractAggregations: (aggs) => aggs.videoSource ?? [],
  resolveLabel: (agg) => (agg.value as string | undefined) ?? '?',
}

export const favoritesListFacet: FacetDefinition<string, false> = {
  key: 'favorites_list',
  icon: Star,
  allowNull: false,
  extractInput: (f) => f.favoritesList,
  patchInput: (f, i) => ({ ...f, favoritesList: i }),
  extractAggregations: (aggs) => aggs.favoritesList ?? [],
  resolveLabel: (agg) => agg.label,
}

// The heterogeneous element types (each facet's T/AllowNull differ) can't be reconciled
// into a single generic signature, so callers over this list necessarily operate on `any`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const facets: FacetDefinition<any, any>[] = [
  torrentSourceFacet,
  fileTypeFacet,
  languageFacet,
  genreFacet,
  videoResolutionFacet,
  videoSourceFacet,
  favoritesListFacet,
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

function isDefaultOrdering(ctrl: TorrentSearchControls): boolean {
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
      sizeMin: ctrl.sizeMin,
      sizeMax: ctrl.sizeMax,
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
        videoResolution: ctrl.facets.videoResolution.active
          ? { aggregate: true, filter: ctrl.facets.videoResolution.filter }
          : undefined,
        videoSource: ctrl.facets.videoSource.active
          ? { aggregate: true, filter: ctrl.facets.videoSource.filter }
          : undefined,
        favoritesList: ctrl.facets.favoritesList.active
          ? { aggregate: true, filter: ctrl.facets.favoritesList.filter }
          : undefined,
      },
    },
  }
}

// Adjusts the favoritesList aggregation counts to reflect not-yet-confirmed local favorite
// assignments/removals (see useFavorite's `overrides`), so the sidebar count next to a list
// updates in lockstep with the star icon instead of lagging behind the server round trip that
// eventually reconciles it. Only affects items present in the current result set, which is
// always true for `overrides` since they're only ever set for currently-visible/selected items.
export function applyFavoriteOverrides(
  aggregations: TorrentContentSearchResultFragment['aggregations'],
  items: TorrentContentFragment[],
  overrides: Record<string, string | null>,
): TorrentContentSearchResultFragment['aggregations'] {
  const pending = Object.entries(overrides)
  if (pending.length === 0) return aggregations

  const itemsByHash = new Map(items.map((item) => [item.infoHash, item]))
  const counts = new Map((aggregations.favoritesList ?? []).map((agg) => [agg.value, { ...agg }]))

  for (const [infoHash, overrideListId] of pending) {
    const item = itemsByHash.get(infoHash)
    if (!item) continue

    const serverListId = item.torrent.favoritesListId ?? null
    if (serverListId === overrideListId) continue

    if (serverListId) {
      const entry = counts.get(serverListId)
      if (entry) entry.count = Math.max(0, entry.count - 1)
    }
    if (overrideListId) {
      const entry = counts.get(overrideListId)
      if (entry) entry.count += 1
      else counts.set(overrideListId, { value: overrideListId, label: overrideListId, count: 1, isEstimate: false })
    }
  }

  return { ...aggregations, favoritesList: Array.from(counts.values()) }
}

export function hasSizeFilter(ctrl: TorrentSearchControls): boolean {
  return ctrl.sizeMin != null || ctrl.sizeMax != null
}

export function clearSizeFilter(ctrl: TorrentSearchControls): TorrentSearchControls {
  return { ...ctrl, sizeMin: undefined, sizeMax: undefined, page: 1 }
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
  allValues: unknown[],
): TorrentSearchControls {
  const input = def.extractInput(ctrl.facets)
  const currentFilter = (input.filter as unknown[] | undefined) ?? allValues
  const nextFilter = currentFilter.filter((value) => value !== filter)
  return {
    ...ctrl,
    page: 1,
    facets: def.patchInput(ctrl.facets, { ...input, filter: nextFilter?.length ? nextFilter : undefined }),
  }
}

// Unlike activateFilter/deactivateFilter (which model an "opt-out" facet where nothing
// selected means everything included, and unchecking one excludes just that one), the
// favorites-list facet is "opt-in": nothing selected means no filtering at all, and checking
// an entry narrows results to that list (plus any others also checked).
export function toggleInclusiveFilter(
  ctrl: TorrentSearchControls,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  def: FacetDefinition<any, any>,
  value: unknown,
  include: boolean,
): TorrentSearchControls {
  const input = def.extractInput(ctrl.facets)
  const current = (input.filter as unknown[] | undefined) ?? []
  const next = include ? Array.from(new Set([...current, value])) : current.filter((v) => v !== value)
  return {
    ...ctrl,
    page: 1,
    facets: def.patchInput(ctrl.facets, { ...input, filter: next.length ? next.sort() : undefined }),
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
    selectedTorrent = { infoHash: selectedTorrentParam }
  }
  const sizeMin = intParam(params, 'size_min')
  const sizeMax = intParam(params, 'size_max')
  return {
    queryString,
    orderBy: orderByParam(params, !!queryString),
    contentType: contentTypeParam(params),
    limit: intParam(params, 'limit') ?? defaultLimit,
    page: intParam(params, 'page') ?? 1,
    selectedTorrent,
    sizeMin,
    sizeMax,
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
  set('size_min', ctrl.sizeMin?.toString())
  set('size_max', ctrl.sizeMax?.toString())
  const orderBy = isDefaultOrdering(ctrl) ? undefined : ctrl.orderBy
  set('order', orderBy?.field)
  set('desc', orderBy ? (orderBy.descending ? '1' : '0') : undefined)
  if (ctrl.selectedTorrent) {
    set('torrent', ctrl.selectedTorrent.infoHash)
  }
  const flat = flattenFacets(ctrl.facets)
  for (const [key, value] of Object.entries(flat)) {
    set(key, value)
  }
  return params
}
