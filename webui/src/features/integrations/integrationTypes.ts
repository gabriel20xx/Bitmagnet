import type { IntegrationType } from '@/lib/graphql/generated'

export const integrationTypeLabels: Record<IntegrationType, string> = {
  qbittorrent: 'qBittorrent',
}

export const integrationTypeList = Object.keys(integrationTypeLabels) as IntegrationType[]
