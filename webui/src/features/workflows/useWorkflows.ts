import { useQuery } from '@apollo/client/react'
import { WorkflowsDocument } from '@/lib/graphql/generated'

export function useWorkflows() {
  const { data, loading, error, refetch } = useQuery(WorkflowsDocument, { fetchPolicy: 'cache-and-network' })

  return {
    workflows: data?.workflows ?? [],
    loading,
    error,
    refetch,
  }
}
