import { useTranslation } from 'react-i18next'
import { useQuery } from '@apollo/client/react'
import { TechStackDocument, VersionDocument } from '@/lib/graphql/generated'

// Real installed frontend dependency versions, injected at build time by vite.config.ts's
// `define` (resolved from node_modules, not the package.json semver range) so this can't
// drift from what's actually bundled.
const FRONTEND_TECH_STACK = __FRONTEND_TECH_STACK__

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1 text-sm">
      <span className="text-muted-fg">{label}</span>
      <span className="font-mono text-xs">{value}</span>
    </div>
  )
}

export function TechStackSection() {
  const { t } = useTranslation()
  const { data: versionData } = useQuery(VersionDocument)
  const { data: techStackData, loading, error } = useQuery(TechStackDocument)

  const techStack = techStackData?.techStack

  return (
    <div className="mt-4 rounded-lg border border-border bg-surface p-4">
      <h3 className="mb-2 text-sm font-medium">{t('dashboard.queues.tech_stack')}</h3>
      {versionData?.version && <InfoRow label={t('dashboard.queues.app_version')} value={versionData.version} />}

      {loading && <p className="text-sm text-muted-fg">{t('dashboard.queues.tech_stack_loading')}</p>}
      {error && <p className="text-sm text-danger">{error.message}</p>}

      {techStack && (
        <div className="mt-3 grid gap-6 sm:grid-cols-2">
          <div>
            <h4 className="mb-1 text-xs font-medium uppercase text-muted-fg">{t('dashboard.queues.backend')}</h4>
            <InfoRow label="Go" value={techStack.goVersion} />
            <InfoRow label={t('dashboard.queues.platform')} value={`${techStack.os}/${techStack.arch}`} />
            {techStack.dependencies.map((dep) => (
              <InfoRow key={dep.name} label={dep.name} value={dep.version} />
            ))}
          </div>
          <div>
            <h4 className="mb-1 text-xs font-medium uppercase text-muted-fg">{t('dashboard.queues.frontend')}</h4>
            {FRONTEND_TECH_STACK.map((dep) => (
              <InfoRow key={dep.name} label={dep.name} value={dep.version} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
