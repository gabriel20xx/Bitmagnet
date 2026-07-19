import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { SimpleTooltip } from '@/components/ui/tooltip'
import { useHealth } from './useHealth'
import { HealthSummary } from './HealthSummary'

const statusColor: Record<string, string> = {
  up: 'text-success',
  degraded: 'text-warning',
  down: 'text-danger',
  error: 'text-danger',
  unknown: 'text-muted-fg',
}

export function HealthWidget() {
  const { t } = useTranslation()
  const health = useHealth()
  const [open, setOpen] = useState(false)

  const displayStatus = health.error ? 'down' : health.status

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <SimpleTooltip label={t('health.bitmagnet_is_status', { status: t(`health.statuses.${health.status}`) })}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          className={statusColor[health.status] ?? ''}
          aria-label={t('health.summary')}
        >
          <health.icon className="size-5" />
        </Button>
      </SimpleTooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('health.summary')}: {t('health.bitmagnet_is_status', { status: t(`health.statuses.${displayStatus}`) })}
          </DialogTitle>
        </DialogHeader>
        <HealthSummary health={health} />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">{t('general.dismiss')}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
