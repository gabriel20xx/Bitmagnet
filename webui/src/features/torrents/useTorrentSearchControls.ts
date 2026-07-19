import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { controlsToParams, paramsToControls, type TorrentSearchControls } from './searchControls'

export function useTorrentSearchControls(): [
  TorrentSearchControls,
  (fn: (c: TorrentSearchControls) => TorrentSearchControls) => void,
] {
  const [searchParams, setSearchParams] = useSearchParams()

  const controls = useMemo(() => paramsToControls(searchParams), [searchParams])

  const update = useCallback(
    (fn: (c: TorrentSearchControls) => TorrentSearchControls) => {
      setSearchParams(controlsToParams(fn(paramsToControls(searchParams))), { replace: true })
    },
    [searchParams, setSearchParams],
  )

  return [controls, update]
}
