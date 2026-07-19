import { useEffect, useMemo } from 'react'
import { useQuery } from '@apollo/client/react'
import { TorrentContentSearchDocument, type TorrentContentSearchResultFragment } from '@/lib/graphql/generated'
import { addError } from '@/lib/toast/store'
import { controlsToQueryVariables, type TorrentSearchControls } from './searchControls'

export const emptyResult: TorrentContentSearchResultFragment = {
  items: [],
  totalCount: 0,
  totalCountIsEstimate: false,
  hasNextPage: false,
  aggregations: {
    contentType: null,
    torrentSource: null,
    torrentTag: null,
    torrentFileType: null,
    language: null,
    genre: null,
    releaseYear: null,
    videoResolution: null,
    videoSource: null,
  },
}

export function useTorrentSearch(controls: TorrentSearchControls) {
  const variables = useMemo(() => {
    const v = controlsToQueryVariables(controls)
    return { input: { ...v.input, cached: true } }
  }, [controls])

  const { data, loading, error, refetch } = useQuery(TorrentContentSearchDocument, {
    variables,
    fetchPolicy: 'no-cache',
  })

  useEffect(() => {
    if (error) addError(`Error loading item results: ${error.message}`)
  }, [error])

  const result = data?.torrentContent.search ?? emptyResult

  const refresh = () => {
    void refetch({ input: { ...variables.input, cached: false } })
  }

  return { result, loading, refresh }
}
