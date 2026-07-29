import { createContext } from 'react'
import type {
  AuthStatusQuery,
  CreateInitialUserInput,
  LoginInput,
  UpdateCredentialsInput,
} from '@/lib/graphql/generated'

export type AuthStatus = AuthStatusQuery['auth']['status'] | undefined

export interface AuthContextValue {
  status: AuthStatus
  loading: boolean
  error: Error | undefined
  createInitialUser: (input: CreateInitialUserInput) => Promise<void>
  login: (input: LoginInput) => Promise<void>
  logout: () => Promise<void>
  updateCredentials: (input: UpdateCredentialsInput) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
