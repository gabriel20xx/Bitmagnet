import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation } from '@apollo/client/react'
import { addError } from '@/lib/toast/store'
import {
  TestIntegrationDocument,
  TestSavedIntegrationDocument,
  type TestIntegrationInput,
} from '@/lib/graphql/generated'

export type TestStatus = 'idle' | 'testing' | 'success' | 'error'

export function useTestConnection(durationMs = 3000) {
  const [testMutation] = useMutation(TestIntegrationDocument)
  const [testSavedMutation] = useMutation(TestSavedIntegrationDocument)
  const [status, setStatus] = useState<TestStatus>('idle')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  const settle = useCallback(
    (promise: Promise<unknown>) => {
      setStatus('testing')
      clearTimeout(timeoutRef.current)
      promise
        .then(() => setStatus('success'))
        .catch((err: Error) => {
          setStatus('error')
          addError(err.message)
        })
        .finally(() => {
          timeoutRef.current = setTimeout(() => setStatus('idle'), durationMs)
        })
    },
    [durationMs],
  )

  const test = useCallback(
    (input: TestIntegrationInput) => settle(testMutation({ variables: { input } })),
    [testMutation, settle],
  )

  const testSaved = useCallback((id: string) => settle(testSavedMutation({ variables: { id } })), [
    testSavedMutation,
    settle,
  ])

  return { status, test, testSaved }
}
