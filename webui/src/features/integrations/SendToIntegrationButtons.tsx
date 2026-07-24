import { useTranslation } from 'react-i18next'
import { Check, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useIntegrations } from './useIntegrations'
import { useSendToIntegration } from './useSendToIntegration'

// Renders one "Send to <name>" button per enabled integration - nothing at all if none are
// configured. Used in the torrents bulk actions bar, ahead of the copy/download buttons.
export function SendToIntegrationButtons({ infoHashes }: { infoHashes: string[] }) {
  const { t } = useTranslation()
  const { enabledIntegrations } = useIntegrations()
  const { send, sentId } = useSendToIntegration()

  const hasSelection = infoHashes.length > 0

  return (
    <>
      {enabledIntegrations.map((integration) => (
        <Button
          key={integration.id}
          type="button"
          variant="outline"
          disabled={!hasSelection}
          onClick={() => send(integration.id, infoHashes)}
        >
          {sentId === integration.id ? <Check className="size-4" /> : <Send className="size-4" />}
          {t('torrents.send_to_integration', { name: integration.name })}
        </Button>
      ))}
    </>
  )
}
