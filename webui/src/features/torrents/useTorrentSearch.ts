import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@apollo/client/react'
import { TorrentContentSearchDocument, type TorrentContentSearchResultFragment } from '@/lib/graphql/generated'
import { addError } from '@/lib/toast/store'
import { controlsToQueryVariables, type TorrentSearchControls } from './searchControls'

// Ignores each facet's `active` flag (whether its sidebar accordion is expanded) so that
// merely opening/closing a facet section - which doesn't change the result set - isn't
// mistaken for a real search change that should show the reload indicator.
function withoutFacetActiveFlags(ctrl: TorrentSearchControls) {
  const facets = Object.fromEntries(Object.entries(ctrl.facets).map(([key, input]) => [key, { filter: input.filter }]))
  return { ...ctrl, facets }
}

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

  const { data, previousData, loading, error, refetch } = useQuery(TorrentContentSearchDocument, {
    variables,
    fetchPolicy: 'no-cache',
  })

  useEffect(() => {
    if (error) addError(`Error loading item results: ${error.message}`)
  }, [error])

  const [prevControls, setPrevControls] = useState(controls)
  const [isFacetToggleOnly, setIsFacetToggleOnly] = useState(false)
  if (prevControls !== controls) {
    setPrevControls(controls)
    setIsFacetToggleOnly(
      JSON.stringify(withoutFacetActiveFlags(prevControls)) === JSON.stringify(withoutFacetActiveFlags(controls)),
    )
  }

  // With fetchPolicy 'no-cache', `data` goes undefined while a new variables set (e.g. toggling
  // a facet accordion, which flips that facet's `aggregate` flag) is in flight. Falling back to
  // previousData keeps the table/sidebar showing the last results instead of flickering empty.
  const result = data?.torrentContent.search ?? previousData?.torrentContent.search ?? emptyResult

  const refresh = () => {
    void refetch({ input: { ...variables.input, cached: false } })
  }

  return { result, loading: loading && !isFacetToggleOnly, refresh }
}
