/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
// THIS FILE IS GENERATED, DO NOT EDIT!
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type ContentType =
  | 'audiobook'
  | 'comic'
  | 'ebook'
  | 'game'
  | 'movie'
  | 'music'
  | 'software'
  | 'tv_show'
  | 'xxx';

export type ContentTypeFacetInput = {
  aggregate?: boolean | null | undefined;
  filter?: Array<ContentType | null | undefined> | null | undefined;
};

export type CreateIntegrationInput = {
  apiKey?: string | null | undefined;
  enabled?: boolean | null | undefined;
  name: string;
  password?: string | null | undefined;
  type: IntegrationType;
  url: string;
  username?: string | null | undefined;
};

export type FacetLogic =
  | 'and'
  | 'or';

export type FileType =
  | 'archive'
  | 'audio'
  | 'data'
  | 'document'
  | 'image'
  | 'software'
  | 'subtitles'
  | 'video';

export type FilesStatus =
  | 'multi'
  | 'no_info'
  | 'over_threshold'
  | 'single';

export type GenreFacetInput = {
  aggregate?: boolean | null | undefined;
  filter?: Array<string> | null | undefined;
  logic?: FacetLogic | null | undefined;
};

export type HealthStatus =
  | 'down'
  | 'inactive'
  | 'unknown'
  | 'up';

export type IntegrationType =
  | 'qbittorrent';

export type Language =
  | 'af'
  | 'ar'
  | 'az'
  | 'be'
  | 'bg'
  | 'bs'
  | 'ca'
  | 'ce'
  | 'co'
  | 'cs'
  | 'cy'
  | 'da'
  | 'de'
  | 'el'
  | 'en'
  | 'es'
  | 'et'
  | 'eu'
  | 'fa'
  | 'fi'
  | 'fr'
  | 'he'
  | 'hi'
  | 'hr'
  | 'hu'
  | 'hy'
  | 'id'
  | 'is'
  | 'it'
  | 'ja'
  | 'ka'
  | 'ko'
  | 'ku'
  | 'lt'
  | 'lv'
  | 'mi'
  | 'mk'
  | 'ml'
  | 'mn'
  | 'ms'
  | 'mt'
  | 'nl'
  | 'no'
  | 'pl'
  | 'pt'
  | 'ro'
  | 'ru'
  | 'sa'
  | 'sk'
  | 'sl'
  | 'sm'
  | 'so'
  | 'sr'
  | 'sv'
  | 'ta'
  | 'th'
  | 'tr'
  | 'uk'
  | 'vi'
  | 'yi'
  | 'zh'
  | 'zu';

export type LanguageFacetInput = {
  aggregate?: boolean | null | undefined;
  filter?: Array<Language> | null | undefined;
};

export type MetricsBucketDuration =
  | 'day'
  | 'hour'
  | 'minute';

export type QueueEnqueueReprocessTorrentsBatchInput = {
  apisDisabled?: boolean | null | undefined;
  batchSize?: number | null | undefined;
  chunkSize?: number | null | undefined;
  classifierRematch?: boolean | null | undefined;
  classifierWorkflow?: string | null | undefined;
  contentTypes?: Array<ContentType | null | undefined> | null | undefined;
  localSearchDisabled?: boolean | null | undefined;
  orphans?: boolean | null | undefined;
  purge?: boolean | null | undefined;
};

export type QueueJobQueueFacetInput = {
  aggregate?: boolean | null | undefined;
  filter?: Array<string> | null | undefined;
};

export type QueueJobStatus =
  | 'failed'
  | 'pending'
  | 'processed'
  | 'retry';

export type QueueJobStatusFacetInput = {
  aggregate?: boolean | null | undefined;
  filter?: Array<QueueJobStatus> | null | undefined;
};

export type QueueJobsFacetsInput = {
  queue?: QueueJobQueueFacetInput | null | undefined;
  status?: QueueJobStatusFacetInput | null | undefined;
};

export type QueueJobsOrderByField =
  | 'created_at'
  | 'priority'
  | 'ran_at';

export type QueueJobsOrderByInput = {
  descending?: boolean | null | undefined;
  field: QueueJobsOrderByField;
};

export type QueueJobsQueryInput = {
  facets?: QueueJobsFacetsInput | null | undefined;
  hasNextPage?: boolean | null | undefined;
  limit?: number | null | undefined;
  offset?: number | null | undefined;
  orderBy?: Array<QueueJobsOrderByInput> | null | undefined;
  page?: number | null | undefined;
  queues?: Array<string> | null | undefined;
  statuses?: Array<QueueJobStatus> | null | undefined;
  totalCount?: boolean | null | undefined;
};

export type QueueMetricsQueryInput = {
  bucketDuration: MetricsBucketDuration;
  endTime?: string | null | undefined;
  queues?: Array<string> | null | undefined;
  startTime?: string | null | undefined;
  statuses?: Array<QueueJobStatus> | null | undefined;
};

export type QueuePurgeJobsInput = {
  queues?: Array<string> | null | undefined;
  statuses?: Array<QueueJobStatus> | null | undefined;
};

export type ReleaseYearFacetInput = {
  aggregate?: boolean | null | undefined;
  filter?: Array<number | null | undefined> | null | undefined;
};

export type TestIntegrationInput = {
  apiKey?: string | null | undefined;
  password?: string | null | undefined;
  type: IntegrationType;
  url: string;
  username?: string | null | undefined;
};

export type TorrentContentFacetsInput = {
  contentType?: ContentTypeFacetInput | null | undefined;
  genre?: GenreFacetInput | null | undefined;
  language?: LanguageFacetInput | null | undefined;
  releaseYear?: ReleaseYearFacetInput | null | undefined;
  torrentFileType?: TorrentFileTypeFacetInput | null | undefined;
  torrentSource?: TorrentSourceFacetInput | null | undefined;
  torrentTag?: TorrentTagFacetInput | null | undefined;
  videoResolution?: VideoResolutionFacetInput | null | undefined;
  videoSource?: VideoSourceFacetInput | null | undefined;
};

export type TorrentContentOrderByField =
  | 'files_count'
  | 'info_hash'
  | 'leechers'
  | 'name'
  | 'published_at'
  | 'relevance'
  | 'seeders'
  | 'size'
  | 'updated_at';

export type TorrentContentOrderByInput = {
  descending?: boolean | null | undefined;
  field: TorrentContentOrderByField;
};

export type TorrentContentSearchQueryInput = {
  aggregationBudget?: number | null | undefined;
  cached?: boolean | null | undefined;
  /**
   * duplicatesOf, when set, returns the torrents recorded as duplicates of the given info hash
   * instead of the default search results (which only ever show the canonical side of each group).
   */
  duplicatesOf?: string | null | undefined;
  facets?: TorrentContentFacetsInput | null | undefined;
  /** hasNextPage if true, the search result will include the hasNextPage field, indicating if there are more results to fetch */
  hasNextPage?: boolean | null | undefined;
  infoHashes?: Array<string> | null | undefined;
  limit?: number | null | undefined;
  offset?: number | null | undefined;
  orderBy?: Array<TorrentContentOrderByInput> | null | undefined;
  page?: number | null | undefined;
  queryString?: string | null | undefined;
  sizeMax?: number | null | undefined;
  sizeMin?: number | null | undefined;
  totalCount?: boolean | null | undefined;
};

export type TorrentFileTypeFacetInput = {
  aggregate?: boolean | null | undefined;
  filter?: Array<FileType> | null | undefined;
  logic?: FacetLogic | null | undefined;
};

export type TorrentFilesOrderByField =
  | 'extension'
  | 'index'
  | 'path'
  | 'size';

export type TorrentFilesOrderByInput = {
  descending?: boolean | null | undefined;
  field: TorrentFilesOrderByField;
};

export type TorrentFilesQueryInput = {
  cached?: boolean | null | undefined;
  hasNextPage?: boolean | null | undefined;
  infoHashes?: Array<string> | null | undefined;
  limit?: number | null | undefined;
  offset?: number | null | undefined;
  orderBy?: Array<TorrentFilesOrderByInput> | null | undefined;
  page?: number | null | undefined;
  totalCount?: boolean | null | undefined;
};

export type TorrentMetricsQueryInput = {
  bucketDuration: MetricsBucketDuration;
  endTime?: string | null | undefined;
  sources?: Array<string> | null | undefined;
  startTime?: string | null | undefined;
};

export type TorrentSourceFacetInput = {
  aggregate?: boolean | null | undefined;
  filter?: Array<string> | null | undefined;
  logic?: FacetLogic | null | undefined;
};

export type TorrentTagFacetInput = {
  aggregate?: boolean | null | undefined;
  filter?: Array<string> | null | undefined;
  logic?: FacetLogic | null | undefined;
};

export type UpdateIntegrationInput = {
  apiKey?: string | null | undefined;
  enabled?: boolean | null | undefined;
  name?: string | null | undefined;
  password?: string | null | undefined;
  url?: string | null | undefined;
  username?: string | null | undefined;
};

export type Video3D =
  | 'V3D'
  | 'V3DOU'
  | 'V3DSBS';

export type VideoCodec =
  | 'DivX'
  | 'H264'
  | 'MPEG2'
  | 'MPEG4'
  | 'XviD'
  | 'x264'
  | 'x265';

export type VideoModifier =
  | 'BRDISK'
  | 'RAWHD'
  | 'REGIONAL'
  | 'REMUX'
  | 'SCREENER';

export type VideoResolution =
  | 'V360p'
  | 'V480p'
  | 'V540p'
  | 'V576p'
  | 'V720p'
  | 'V1080p'
  | 'V1440p'
  | 'V2160p'
  | 'V4320p';

export type VideoResolutionFacetInput = {
  aggregate?: boolean | null | undefined;
  filter?: Array<VideoResolution | null | undefined> | null | undefined;
};

export type VideoSource =
  | 'BluRay'
  | 'CAM'
  | 'DVD'
  | 'TELECINE'
  | 'TELESYNC'
  | 'TV'
  | 'WEBDL'
  | 'WEBRip'
  | 'WORKPRINT';

export type VideoSourceFacetInput = {
  aggregate?: boolean | null | undefined;
  filter?: Array<VideoSource | null | undefined> | null | undefined;
};

export type ContentFragment = { type: ContentType, source: string, id: string, title: string, releaseDate: string | null, releaseYear: number | null, overview: string | null, runtime: number | null, voteAverage: number | null, voteCount: number | null, createdAt: string, updatedAt: string, metadataSource: { key: string, name: string }, originalLanguage: { id: string, name: string } | null, attributes: Array<{ source: string, key: string, value: string, createdAt: string, updatedAt: string, metadataSource: { key: string, name: string } }>, collections: Array<{ type: string, source: string, id: string, name: string, createdAt: string, updatedAt: string, metadataSource: { key: string, name: string } }>, externalLinks: Array<{ url: string, metadataSource: { key: string, name: string } }> };

export type IntegrationFragment = { id: string, type: IntegrationType, name: string, enabled: boolean, url: string, username: string | null, createdAt: string, updatedAt: string };

export type QueueJobFragment = { id: string, queue: string, status: QueueJobStatus, payload: string, priority: number, retries: number, maxRetries: number, runAfter: string, ranAt: string | null, error: string | null, createdAt: string };

export type QueueJobsQueryResultFragment = { totalCount: number, hasNextPage: boolean | null, items: Array<{ id: string, queue: string, status: QueueJobStatus, payload: string, priority: number, retries: number, maxRetries: number, runAfter: string, ranAt: string | null, error: string | null, createdAt: string }>, aggregations: { queue: Array<{ value: string, label: string, count: number }> | null, status: Array<{ value: QueueJobStatus, label: string, count: number }> | null } };

export type TorrentFragment = { infoHash: string, name: string, size: number, filesStatus: FilesStatus, filesCount: number | null, hasFilesInfo: boolean, singleFile: boolean | null, fileType: FileType | null, seeders: number | null, leechers: number | null, tagNames: Array<string>, magnetUri: string, createdAt: string, updatedAt: string, sources: Array<{ key: string, name: string }> };

export type TorrentContentFragment = { id: string, infoHash: string, contentType: ContentType | null, title: string, video3d: Video3D | null, videoCodec: VideoCodec | null, videoModifier: VideoModifier | null, videoResolution: VideoResolution | null, videoSource: VideoSource | null, seeders: number | null, leechers: number | null, publishedAt: string, createdAt: string, updatedAt: string, duplicatesCount: number, torrent: { infoHash: string, name: string, size: number, filesStatus: FilesStatus, filesCount: number | null, hasFilesInfo: boolean, singleFile: boolean | null, fileType: FileType | null, seeders: number | null, leechers: number | null, tagNames: Array<string>, magnetUri: string, createdAt: string, updatedAt: string, sources: Array<{ key: string, name: string }> }, content: { type: ContentType, source: string, id: string, title: string, releaseDate: string | null, releaseYear: number | null, overview: string | null, runtime: number | null, voteAverage: number | null, voteCount: number | null, createdAt: string, updatedAt: string, metadataSource: { key: string, name: string }, originalLanguage: { id: string, name: string } | null, attributes: Array<{ source: string, key: string, value: string, createdAt: string, updatedAt: string, metadataSource: { key: string, name: string } }>, collections: Array<{ type: string, source: string, id: string, name: string, createdAt: string, updatedAt: string, metadataSource: { key: string, name: string } }>, externalLinks: Array<{ url: string, metadataSource: { key: string, name: string } }> } | null, languages: Array<{ id: string, name: string }> | null, episodes: { label: string, seasons: Array<{ season: number, episodes: Array<number> | null }> } | null };

export type TorrentContentSearchResultFragment = { totalCount: number, totalCountIsEstimate: boolean, hasNextPage: boolean | null, items: Array<{ id: string, infoHash: string, contentType: ContentType | null, title: string, video3d: Video3D | null, videoCodec: VideoCodec | null, videoModifier: VideoModifier | null, videoResolution: VideoResolution | null, videoSource: VideoSource | null, seeders: number | null, leechers: number | null, publishedAt: string, createdAt: string, updatedAt: string, duplicatesCount: number, torrent: { infoHash: string, name: string, size: number, filesStatus: FilesStatus, filesCount: number | null, hasFilesInfo: boolean, singleFile: boolean | null, fileType: FileType | null, seeders: number | null, leechers: number | null, tagNames: Array<string>, magnetUri: string, createdAt: string, updatedAt: string, sources: Array<{ key: string, name: string }> }, content: { type: ContentType, source: string, id: string, title: string, releaseDate: string | null, releaseYear: number | null, overview: string | null, runtime: number | null, voteAverage: number | null, voteCount: number | null, createdAt: string, updatedAt: string, metadataSource: { key: string, name: string }, originalLanguage: { id: string, name: string } | null, attributes: Array<{ source: string, key: string, value: string, createdAt: string, updatedAt: string, metadataSource: { key: string, name: string } }>, collections: Array<{ type: string, source: string, id: string, name: string, createdAt: string, updatedAt: string, metadataSource: { key: string, name: string } }>, externalLinks: Array<{ url: string, metadataSource: { key: string, name: string } }> } | null, languages: Array<{ id: string, name: string }> | null, episodes: { label: string, seasons: Array<{ season: number, episodes: Array<number> | null }> } | null }>, aggregations: { contentType: Array<{ value: ContentType | null, label: string, count: number, isEstimate: boolean }> | null, torrentSource: Array<{ value: string, label: string, count: number, isEstimate: boolean }> | null, torrentTag: Array<{ value: string, label: string, count: number, isEstimate: boolean }> | null, torrentFileType: Array<{ value: FileType, label: string, count: number, isEstimate: boolean }> | null, language: Array<{ value: Language, label: string, count: number, isEstimate: boolean }> | null, genre: Array<{ value: string, label: string, count: number, isEstimate: boolean }> | null, releaseYear: Array<{ value: number | null, label: string, count: number, isEstimate: boolean }> | null, videoResolution: Array<{ value: VideoResolution | null, label: string, count: number, isEstimate: boolean }> | null, videoSource: Array<{ value: VideoSource | null, label: string, count: number, isEstimate: boolean }> | null } };

export type TorrentFileFragment = { infoHash: string, index: number, path: string, size: number, fileType: FileType | null, createdAt: string, updatedAt: string };

export type TorrentFilesQueryResultFragment = { totalCount: number, hasNextPage: boolean | null, items: Array<{ infoHash: string, index: number, path: string, size: number, fileType: FileType | null, createdAt: string, updatedAt: string }> };

export type CreateIntegrationMutationVariables = Exact<{
  input: CreateIntegrationInput;
}>;


export type CreateIntegrationMutation = { integrations: { create: { id: string, type: IntegrationType, name: string, enabled: boolean, url: string, username: string | null, createdAt: string, updatedAt: string } } };

export type DeleteIntegrationMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteIntegrationMutation = { integrations: { delete: void | null } };

export type QueueEnqueueReprocessTorrentsBatchMutationVariables = Exact<{
  input: QueueEnqueueReprocessTorrentsBatchInput;
}>;


export type QueueEnqueueReprocessTorrentsBatchMutation = { queue: { enqueueReprocessTorrentsBatch: void | null } };

export type QueuePurgeJobsMutationVariables = Exact<{
  input: QueuePurgeJobsInput;
}>;


export type QueuePurgeJobsMutation = { queue: { purgeJobs: void | null } };

export type SendTorrentsToIntegrationMutationVariables = Exact<{
  integrationId: string | number;
  infoHashes: Array<string> | string;
}>;


export type SendTorrentsToIntegrationMutation = { integrations: { sendTorrents: void | null } };

export type TestIntegrationMutationVariables = Exact<{
  input: TestIntegrationInput;
}>;


export type TestIntegrationMutation = { integrations: { test: boolean } };

export type TestSavedIntegrationMutationVariables = Exact<{
  id: string | number;
}>;


export type TestSavedIntegrationMutation = { integrations: { testSaved: boolean } };

export type UpdateIntegrationMutationVariables = Exact<{
  id: string | number;
  input: UpdateIntegrationInput;
}>;


export type UpdateIntegrationMutation = { integrations: { update: { id: string, type: IntegrationType, name: string, enabled: boolean, url: string, username: string | null, createdAt: string, updatedAt: string } } };

export type HealthCheckQueryVariables = Exact<{ [key: string]: never; }>;


export type HealthCheckQuery = { health: { status: HealthStatus, checks: Array<{ key: string, status: HealthStatus, timestamp: string, error: string | null }> }, workers: { listAll: { workers: Array<{ key: string, started: boolean }> } } };

export type IntegrationsQueryVariables = Exact<{ [key: string]: never; }>;


export type IntegrationsQuery = { integrations: Array<{ id: string, type: IntegrationType, name: string, enabled: boolean, url: string, username: string | null, createdAt: string, updatedAt: string }> };

export type QueueJobsQueryVariables = Exact<{
  input: QueueJobsQueryInput;
}>;


export type QueueJobsQuery = { queue: { jobs: { totalCount: number, hasNextPage: boolean | null, items: Array<{ id: string, queue: string, status: QueueJobStatus, payload: string, priority: number, retries: number, maxRetries: number, runAfter: string, ranAt: string | null, error: string | null, createdAt: string }>, aggregations: { queue: Array<{ value: string, label: string, count: number }> | null, status: Array<{ value: QueueJobStatus, label: string, count: number }> | null } } } };

export type QueueMetricsQueryVariables = Exact<{
  input: QueueMetricsQueryInput;
}>;


export type QueueMetricsQuery = { queue: { metrics: { buckets: Array<{ queue: string, status: QueueJobStatus, createdAtBucket: string, ranAtBucket: string | null, count: number, latency: string | null }> } } };

export type TorrentContentSearchQueryVariables = Exact<{
  input: TorrentContentSearchQueryInput;
}>;


export type TorrentContentSearchQuery = { torrentContent: { search: { totalCount: number, totalCountIsEstimate: boolean, hasNextPage: boolean | null, items: Array<{ id: string, infoHash: string, contentType: ContentType | null, title: string, video3d: Video3D | null, videoCodec: VideoCodec | null, videoModifier: VideoModifier | null, videoResolution: VideoResolution | null, videoSource: VideoSource | null, seeders: number | null, leechers: number | null, publishedAt: string, createdAt: string, updatedAt: string, duplicatesCount: number, torrent: { infoHash: string, name: string, size: number, filesStatus: FilesStatus, filesCount: number | null, hasFilesInfo: boolean, singleFile: boolean | null, fileType: FileType | null, seeders: number | null, leechers: number | null, tagNames: Array<string>, magnetUri: string, createdAt: string, updatedAt: string, sources: Array<{ key: string, name: string }> }, content: { type: ContentType, source: string, id: string, title: string, releaseDate: string | null, releaseYear: number | null, overview: string | null, runtime: number | null, voteAverage: number | null, voteCount: number | null, createdAt: string, updatedAt: string, metadataSource: { key: string, name: string }, originalLanguage: { id: string, name: string } | null, attributes: Array<{ source: string, key: string, value: string, createdAt: string, updatedAt: string, metadataSource: { key: string, name: string } }>, collections: Array<{ type: string, source: string, id: string, name: string, createdAt: string, updatedAt: string, metadataSource: { key: string, name: string } }>, externalLinks: Array<{ url: string, metadataSource: { key: string, name: string } }> } | null, languages: Array<{ id: string, name: string }> | null, episodes: { label: string, seasons: Array<{ season: number, episodes: Array<number> | null }> } | null }>, aggregations: { contentType: Array<{ value: ContentType | null, label: string, count: number, isEstimate: boolean }> | null, torrentSource: Array<{ value: string, label: string, count: number, isEstimate: boolean }> | null, torrentTag: Array<{ value: string, label: string, count: number, isEstimate: boolean }> | null, torrentFileType: Array<{ value: FileType, label: string, count: number, isEstimate: boolean }> | null, language: Array<{ value: Language, label: string, count: number, isEstimate: boolean }> | null, genre: Array<{ value: string, label: string, count: number, isEstimate: boolean }> | null, releaseYear: Array<{ value: number | null, label: string, count: number, isEstimate: boolean }> | null, videoResolution: Array<{ value: VideoResolution | null, label: string, count: number, isEstimate: boolean }> | null, videoSource: Array<{ value: VideoSource | null, label: string, count: number, isEstimate: boolean }> | null } } } };

export type TorrentFilesQueryVariables = Exact<{
  input: TorrentFilesQueryInput;
}>;


export type TorrentFilesQuery = { torrent: { files: { totalCount: number, hasNextPage: boolean | null, items: Array<{ infoHash: string, index: number, path: string, size: number, fileType: FileType | null, createdAt: string, updatedAt: string }> } } };

export type TorrentMetricsQueryVariables = Exact<{
  input: TorrentMetricsQueryInput;
}>;


export type TorrentMetricsQuery = { torrent: { metrics: { buckets: Array<{ source: string, updated: boolean, bucket: string, count: number }> }, listSources: { sources: Array<{ key: string, name: string }> } } };

export type VersionQueryVariables = Exact<{ [key: string]: never; }>;


export type VersionQuery = { version: string };

export const IntegrationFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"Integration"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Integration"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<IntegrationFragment, unknown>;
export const QueueJobFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"QueueJob"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"QueueJob"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"queue"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"retries"}},{"kind":"Field","name":{"kind":"Name","value":"maxRetries"}},{"kind":"Field","name":{"kind":"Name","value":"runAfter"}},{"kind":"Field","name":{"kind":"Name","value":"ranAt"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<QueueJobFragment, unknown>;
export const QueueJobsQueryResultFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"QueueJobsQueryResult"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"QueueJobsQueryResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"QueueJob"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"aggregations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"queue"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}},{"kind":"Field","name":{"kind":"Name","value":"status"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"QueueJob"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"QueueJob"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"queue"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"retries"}},{"kind":"Field","name":{"kind":"Name","value":"maxRetries"}},{"kind":"Field","name":{"kind":"Name","value":"runAfter"}},{"kind":"Field","name":{"kind":"Name","value":"ranAt"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<QueueJobsQueryResultFragment, unknown>;
export const TorrentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"Torrent"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Torrent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"infoHash"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"filesStatus"}},{"kind":"Field","name":{"kind":"Name","value":"filesCount"}},{"kind":"Field","name":{"kind":"Name","value":"hasFilesInfo"}},{"kind":"Field","name":{"kind":"Name","value":"singleFile"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"sources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"seeders"}},{"kind":"Field","name":{"kind":"Name","value":"leechers"}},{"kind":"Field","name":{"kind":"Name","value":"tagNames"}},{"kind":"Field","name":{"kind":"Name","value":"magnetUri"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<TorrentFragment, unknown>;
export const ContentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"Content"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Content"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"metadataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"releaseDate"}},{"kind":"Field","name":{"kind":"Name","value":"releaseYear"}},{"kind":"Field","name":{"kind":"Name","value":"overview"}},{"kind":"Field","name":{"kind":"Name","value":"runtime"}},{"kind":"Field","name":{"kind":"Name","value":"voteAverage"}},{"kind":"Field","name":{"kind":"Name","value":"voteCount"}},{"kind":"Field","name":{"kind":"Name","value":"originalLanguage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"attributes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"metadataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"collections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"metadataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"externalLinks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"metadataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<ContentFragment, unknown>;
export const TorrentContentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TorrentContent"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TorrentContent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"infoHash"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"torrent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"Torrent"}}]}},{"kind":"Field","name":{"kind":"Name","value":"content"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"Content"}}]}},{"kind":"Field","name":{"kind":"Name","value":"languages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"episodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"seasons"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"season"}},{"kind":"Field","name":{"kind":"Name","value":"episodes"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"video3d"}},{"kind":"Field","name":{"kind":"Name","value":"videoCodec"}},{"kind":"Field","name":{"kind":"Name","value":"videoModifier"}},{"kind":"Field","name":{"kind":"Name","value":"videoResolution"}},{"kind":"Field","name":{"kind":"Name","value":"videoSource"}},{"kind":"Field","name":{"kind":"Name","value":"seeders"}},{"kind":"Field","name":{"kind":"Name","value":"leechers"}},{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"duplicatesCount"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"Torrent"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Torrent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"infoHash"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"filesStatus"}},{"kind":"Field","name":{"kind":"Name","value":"filesCount"}},{"kind":"Field","name":{"kind":"Name","value":"hasFilesInfo"}},{"kind":"Field","name":{"kind":"Name","value":"singleFile"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"sources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"seeders"}},{"kind":"Field","name":{"kind":"Name","value":"leechers"}},{"kind":"Field","name":{"kind":"Name","value":"tagNames"}},{"kind":"Field","name":{"kind":"Name","value":"magnetUri"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"Content"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Content"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"metadataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"releaseDate"}},{"kind":"Field","name":{"kind":"Name","value":"releaseYear"}},{"kind":"Field","name":{"kind":"Name","value":"overview"}},{"kind":"Field","name":{"kind":"Name","value":"runtime"}},{"kind":"Field","name":{"kind":"Name","value":"voteAverage"}},{"kind":"Field","name":{"kind":"Name","value":"voteCount"}},{"kind":"Field","name":{"kind":"Name","value":"originalLanguage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"attributes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"metadataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"collections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"metadataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"externalLinks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"metadataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<TorrentContentFragment, unknown>;
export const TorrentContentSearchResultFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TorrentContentSearchResult"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TorrentContentSearchResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TorrentContent"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"totalCountIsEstimate"}},{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"aggregations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"contentType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"isEstimate"}}]}},{"kind":"Field","name":{"kind":"Name","value":"torrentSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"isEstimate"}}]}},{"kind":"Field","name":{"kind":"Name","value":"torrentTag"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"isEstimate"}}]}},{"kind":"Field","name":{"kind":"Name","value":"torrentFileType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"isEstimate"}}]}},{"kind":"Field","name":{"kind":"Name","value":"language"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"isEstimate"}}]}},{"kind":"Field","name":{"kind":"Name","value":"genre"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"isEstimate"}}]}},{"kind":"Field","name":{"kind":"Name","value":"releaseYear"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"isEstimate"}}]}},{"kind":"Field","name":{"kind":"Name","value":"videoResolution"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"isEstimate"}}]}},{"kind":"Field","name":{"kind":"Name","value":"videoSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"isEstimate"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"Torrent"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Torrent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"infoHash"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"filesStatus"}},{"kind":"Field","name":{"kind":"Name","value":"filesCount"}},{"kind":"Field","name":{"kind":"Name","value":"hasFilesInfo"}},{"kind":"Field","name":{"kind":"Name","value":"singleFile"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"sources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"seeders"}},{"kind":"Field","name":{"kind":"Name","value":"leechers"}},{"kind":"Field","name":{"kind":"Name","value":"tagNames"}},{"kind":"Field","name":{"kind":"Name","value":"magnetUri"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"Content"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Content"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"metadataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"releaseDate"}},{"kind":"Field","name":{"kind":"Name","value":"releaseYear"}},{"kind":"Field","name":{"kind":"Name","value":"overview"}},{"kind":"Field","name":{"kind":"Name","value":"runtime"}},{"kind":"Field","name":{"kind":"Name","value":"voteAverage"}},{"kind":"Field","name":{"kind":"Name","value":"voteCount"}},{"kind":"Field","name":{"kind":"Name","value":"originalLanguage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"attributes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"metadataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"collections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"metadataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"externalLinks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"metadataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TorrentContent"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TorrentContent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"infoHash"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"torrent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"Torrent"}}]}},{"kind":"Field","name":{"kind":"Name","value":"content"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"Content"}}]}},{"kind":"Field","name":{"kind":"Name","value":"languages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"episodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"seasons"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"season"}},{"kind":"Field","name":{"kind":"Name","value":"episodes"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"video3d"}},{"kind":"Field","name":{"kind":"Name","value":"videoCodec"}},{"kind":"Field","name":{"kind":"Name","value":"videoModifier"}},{"kind":"Field","name":{"kind":"Name","value":"videoResolution"}},{"kind":"Field","name":{"kind":"Name","value":"videoSource"}},{"kind":"Field","name":{"kind":"Name","value":"seeders"}},{"kind":"Field","name":{"kind":"Name","value":"leechers"}},{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"duplicatesCount"}}]}}]} as unknown as DocumentNode<TorrentContentSearchResultFragment, unknown>;
export const TorrentFileFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TorrentFile"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TorrentFile"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"infoHash"}},{"kind":"Field","name":{"kind":"Name","value":"index"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<TorrentFileFragment, unknown>;
export const TorrentFilesQueryResultFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TorrentFilesQueryResult"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TorrentFilesQueryResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TorrentFile"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TorrentFile"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TorrentFile"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"infoHash"}},{"kind":"Field","name":{"kind":"Name","value":"index"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<TorrentFilesQueryResultFragment, unknown>;
export const CreateIntegrationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateIntegration"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateIntegrationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"integrations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"Integration"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"Integration"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Integration"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CreateIntegrationMutation, CreateIntegrationMutationVariables>;
export const DeleteIntegrationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteIntegration"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"integrations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"delete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]}}]} as unknown as DocumentNode<DeleteIntegrationMutation, DeleteIntegrationMutationVariables>;
export const QueueEnqueueReprocessTorrentsBatchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"QueueEnqueueReprocessTorrentsBatch"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"QueueEnqueueReprocessTorrentsBatchInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"queue"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"enqueueReprocessTorrentsBatch"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]} as unknown as DocumentNode<QueueEnqueueReprocessTorrentsBatchMutation, QueueEnqueueReprocessTorrentsBatchMutationVariables>;
export const QueuePurgeJobsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"QueuePurgeJobs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"QueuePurgeJobsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"queue"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"purgeJobs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]} as unknown as DocumentNode<QueuePurgeJobsMutation, QueuePurgeJobsMutationVariables>;
export const SendTorrentsToIntegrationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SendTorrentsToIntegration"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"integrationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"infoHashes"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Hash20"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"integrations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sendTorrents"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"integrationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"integrationId"}}},{"kind":"Argument","name":{"kind":"Name","value":"infoHashes"},"value":{"kind":"Variable","name":{"kind":"Name","value":"infoHashes"}}}]}]}}]}}]} as unknown as DocumentNode<SendTorrentsToIntegrationMutation, SendTorrentsToIntegrationMutationVariables>;
export const TestIntegrationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TestIntegration"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TestIntegrationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"integrations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"test"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]} as unknown as DocumentNode<TestIntegrationMutation, TestIntegrationMutationVariables>;
export const TestSavedIntegrationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TestSavedIntegration"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"integrations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"testSaved"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]}}]} as unknown as DocumentNode<TestSavedIntegrationMutation, TestSavedIntegrationMutationVariables>;
export const UpdateIntegrationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateIntegration"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateIntegrationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"integrations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"update"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"Integration"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"Integration"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Integration"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UpdateIntegrationMutation, UpdateIntegrationMutationVariables>;
export const HealthCheckDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"HealthCheck"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"health"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"checks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"workers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"listAll"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"started"}}]}}]}}]}}]}}]} as unknown as DocumentNode<HealthCheckQuery, HealthCheckQueryVariables>;
export const IntegrationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Integrations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"integrations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"Integration"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"Integration"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Integration"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"username"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<IntegrationsQuery, IntegrationsQueryVariables>;
export const QueueJobsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QueueJobs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"QueueJobsQueryInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"queue"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jobs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"QueueJobsQueryResult"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"QueueJob"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"QueueJob"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"queue"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"payload"}},{"kind":"Field","name":{"kind":"Name","value":"priority"}},{"kind":"Field","name":{"kind":"Name","value":"retries"}},{"kind":"Field","name":{"kind":"Name","value":"maxRetries"}},{"kind":"Field","name":{"kind":"Name","value":"runAfter"}},{"kind":"Field","name":{"kind":"Name","value":"ranAt"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"QueueJobsQueryResult"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"QueueJobsQueryResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"QueueJob"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"aggregations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"queue"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}},{"kind":"Field","name":{"kind":"Name","value":"status"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}}]}}]} as unknown as DocumentNode<QueueJobsQuery, QueueJobsQueryVariables>;
export const QueueMetricsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"QueueMetrics"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"QueueMetricsQueryInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"queue"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"metrics"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"buckets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"queue"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAtBucket"}},{"kind":"Field","name":{"kind":"Name","value":"ranAtBucket"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"latency"}}]}}]}}]}}]}}]} as unknown as DocumentNode<QueueMetricsQuery, QueueMetricsQueryVariables>;
export const TorrentContentSearchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TorrentContentSearch"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TorrentContentSearchQueryInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"torrentContent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"search"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TorrentContentSearchResult"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"Torrent"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Torrent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"infoHash"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"filesStatus"}},{"kind":"Field","name":{"kind":"Name","value":"filesCount"}},{"kind":"Field","name":{"kind":"Name","value":"hasFilesInfo"}},{"kind":"Field","name":{"kind":"Name","value":"singleFile"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"sources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"seeders"}},{"kind":"Field","name":{"kind":"Name","value":"leechers"}},{"kind":"Field","name":{"kind":"Name","value":"tagNames"}},{"kind":"Field","name":{"kind":"Name","value":"magnetUri"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"Content"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Content"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"metadataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"releaseDate"}},{"kind":"Field","name":{"kind":"Name","value":"releaseYear"}},{"kind":"Field","name":{"kind":"Name","value":"overview"}},{"kind":"Field","name":{"kind":"Name","value":"runtime"}},{"kind":"Field","name":{"kind":"Name","value":"voteAverage"}},{"kind":"Field","name":{"kind":"Name","value":"voteCount"}},{"kind":"Field","name":{"kind":"Name","value":"originalLanguage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"attributes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"metadataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"collections"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"metadataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"externalLinks"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"metadataSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"url"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TorrentContent"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TorrentContent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"infoHash"}},{"kind":"Field","name":{"kind":"Name","value":"contentType"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"torrent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"Torrent"}}]}},{"kind":"Field","name":{"kind":"Name","value":"content"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"Content"}}]}},{"kind":"Field","name":{"kind":"Name","value":"languages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"episodes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"seasons"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"season"}},{"kind":"Field","name":{"kind":"Name","value":"episodes"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"video3d"}},{"kind":"Field","name":{"kind":"Name","value":"videoCodec"}},{"kind":"Field","name":{"kind":"Name","value":"videoModifier"}},{"kind":"Field","name":{"kind":"Name","value":"videoResolution"}},{"kind":"Field","name":{"kind":"Name","value":"videoSource"}},{"kind":"Field","name":{"kind":"Name","value":"seeders"}},{"kind":"Field","name":{"kind":"Name","value":"leechers"}},{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"duplicatesCount"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TorrentContentSearchResult"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TorrentContentSearchResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TorrentContent"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"totalCountIsEstimate"}},{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"aggregations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"contentType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"isEstimate"}}]}},{"kind":"Field","name":{"kind":"Name","value":"torrentSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"isEstimate"}}]}},{"kind":"Field","name":{"kind":"Name","value":"torrentTag"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"isEstimate"}}]}},{"kind":"Field","name":{"kind":"Name","value":"torrentFileType"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"isEstimate"}}]}},{"kind":"Field","name":{"kind":"Name","value":"language"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"isEstimate"}}]}},{"kind":"Field","name":{"kind":"Name","value":"genre"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"isEstimate"}}]}},{"kind":"Field","name":{"kind":"Name","value":"releaseYear"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"isEstimate"}}]}},{"kind":"Field","name":{"kind":"Name","value":"videoResolution"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"isEstimate"}}]}},{"kind":"Field","name":{"kind":"Name","value":"videoSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"isEstimate"}}]}}]}}]}}]} as unknown as DocumentNode<TorrentContentSearchQuery, TorrentContentSearchQueryVariables>;
export const TorrentFilesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TorrentFiles"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TorrentFilesQueryInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"torrent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"files"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TorrentFilesQueryResult"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TorrentFile"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TorrentFile"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"infoHash"}},{"kind":"Field","name":{"kind":"Name","value":"index"}},{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"fileType"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TorrentFilesQueryResult"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TorrentFilesQueryResult"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TorrentFile"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}}]}}]} as unknown as DocumentNode<TorrentFilesQuery, TorrentFilesQueryVariables>;
export const TorrentMetricsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"TorrentMetrics"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TorrentMetricsQueryInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"torrent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"metrics"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"buckets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"updated"}},{"kind":"Field","name":{"kind":"Name","value":"bucket"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"listSources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<TorrentMetricsQuery, TorrentMetricsQueryVariables>;
export const VersionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Version"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"}}]}}]} as unknown as DocumentNode<VersionQuery, VersionQueryVariables>;