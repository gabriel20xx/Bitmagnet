import { useQuery } from '@apollo/client/react'
import { AlertCircle, AlertTriangle, CheckCircle2, Circle, HelpCircle, PlayCircle, type LucideIcon } from 'lucide-react'
import { HealthCheckDocument, type HealthStatus as GqlHealthStatus } from '@/lib/graphql/generated'

export type HealthStatus = GqlHealthStatus | 'started' | 'error' | 'degraded'

const icons: Record<HealthStatus, LucideIcon> = {
  error: AlertCircle,
  degraded: AlertTriangle,
  down: AlertTriangle,
  unknown: HelpCircle,
  inactive: Circle,
  up: CheckCircle2,
  started: PlayCircle,
}

export interface HealthCheckItem {
  key: string
  status: GqlHealthStatus
  error?: string | null
  icon: LucideIcon
}

export interface HealthWorkerItem {
  key: string
  started: boolean
  icon: LucideIcon
}

export interface HealthResult {
  status: HealthStatus
  checks: HealthCheckItem[]
  workers: HealthWorkerItem[]
  error?: Error
  icon: LucideIcon
}

const initialResult: HealthResult = {
  status: 'unknown',
  checks: [],
  workers: [],
  icon: icons.unknown,
}

const pollInterval = 10000

export function useHealth(): HealthResult {
  const { data, error } = useQuery(HealthCheckDocument, {
    fetchPolicy: 'no-cache',
    pollInterval,
  })

  if (error) {
    return { status: 'error', checks: [], workers: [], error, icon: icons.error }
  }

  if (!data) {
    return initialResult
  }

  const status: HealthStatus = data.health.status === 'down' ? 'degraded' : data.health.status

  return {
    status,
    checks: data.health.checks.map((c) => ({ key: c.key, status: c.status, error: c.error, icon: icons[c.status] })),
    workers: data.workers.listAll.workers.map((w) => ({
      key: w.key,
      started: w.started,
      icon: icons[w.started ? 'started' : 'inactive'],
    })),
    icon: icons[data.health.status],
  }
}
