import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { useQuery } from '@apollo/client/react'
import { QueueJobsDocument, type QueueJobsQueryResultFragment } from '@/lib/graphql/generated'
import { addError } from '@/lib/toast/store'
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue'
import {
  controlsToParams,
  controlsToQueryVariables,
  paramsToControls,
  type QueueJobsControls,
} from './queueJobsControls'

// Port of webui/src/app/dashboard/queue/queue-jobs.controller.ts + queue-jobs.datasource.ts, adapted
// to this app's URL-synced controls + Apollo hook conventions (src/features/torrents/useTorrentSearch.ts).

export const emptyResult: QueueJobsQueryResultFragment = {
  items: [],
  hasNextPage: false,
  totalCount: 0,
  aggregations: { queue: [], status: [] },
}

export function useQueueJobsControls(): [QueueJobsControls, (fn: (c: QueueJobsControls) => QueueJobsControls) => void] {
  const [searchParams, setSearchParams] = useSearchParams()

  const controls = useMemo(() => paramsToControls(searchParams), [searchParams])

  const update = useCallback(
    (fn: (c: QueueJobsControls) => QueueJobsControls) => {
      setSearchParams(controlsToParams(fn(paramsToControls(searchParams))), { replace: true })
    },
    [searchParams, setSearchParams],
  )

  return [controls, update]
}

export function useQueueJobs(controls: QueueJobsControls) {
  const variables = useMemo(() => controlsToQueryVariables(controls), [controls])
  const debouncedVariables = useDebouncedValue(variables, 100)

  const { data, loading, error, refetch } = useQuery(QueueJobsDocument, {
    variables: debouncedVariables,
    fetchPolicy: 'no-cache',
  })

  useEffect(() => {
    if (error) addError(`Error loading item results: ${error.message}`)
  }, [error])

  const result = data?.queue.jobs ?? emptyResult
  const refresh = useCallback(() => void refetch(), [refetch])

  return { result, loading, refresh }
}
