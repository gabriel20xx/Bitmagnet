import { type ReactNode } from 'react'
import { useMutation, useQuery } from '@apollo/client/react'
import {
  AuthCreateInitialUserDocument,
  AuthLoginDocument,
  AuthLogoutDocument,
  AuthStatusDocument,
  AuthUpdateCredentialsDocument,
} from '@/lib/graphql/generated'
import { AuthContext, type AuthContextValue } from './AuthContext'

function useAuthQuery() {
  const { data, loading, error, refetch } = useQuery(AuthStatusDocument, { fetchPolicy: 'network-only' })
  return {
    status: data?.auth.status,
    loading,
    error,
    refetch,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const authQuery = useAuthQuery()
  const [createInitialUser] = useMutation(AuthCreateInitialUserDocument)
  const [login] = useMutation(AuthLoginDocument)
  const [logout] = useMutation(AuthLogoutDocument)
  const [updateCredentials] = useMutation(AuthUpdateCredentialsDocument)

  const refresh = async () => {
    await authQuery.refetch()
  }

  const value: AuthContextValue = {
    status: authQuery.status,
    loading: authQuery.loading,
    error: authQuery.error,
    createInitialUser: async (input) => {
      await createInitialUser({ variables: { input } })
      await refresh()
    },
    login: async (input) => {
      await login({ variables: { input } })
      await refresh()
    },
    logout: async () => {
      await logout()
      await refresh()
    },
    updateCredentials: async (input) => {
      await updateCredentials({ variables: { input } })
      await refresh()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
