import { useTranslation } from 'react-i18next'
import { Check, Send } from 'lucide-react'
import { SimpleTooltip } from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useIntegrations } from './useIntegrations'
import { useSendToIntegration } from './useSendToIntegration'

// Renders nothing if no integration is configured; a single icon button if exactly one is, or
// an icon that opens a picker menu if several are. Placed ahead of the magnet icon in the
// torrents list's download column, and sends just this one torrent.
export function TorrentSendIcon({ infoHash }: { infoHash: string }) {
  const { t } = useTranslation()
  const { enabledIntegrations } = useIntegrations()
  const { send, sentId } = useSendToIntegration()

  if (enabledIntegrations.length === 0) return null

  if (enabledIntegrations.length === 1) {
    const integration = enabledIntegrations[0]
    const sent = sentId === integration.id
    return (
      <SimpleTooltip label={t('torrents.send_to_integration', { name: integration.name })}>
        <button type="button" className="cursor-pointer" onClick={() => send(integration.id, [infoHash])}>
          {sent ? <Check className="size-4 text-primary" /> : <Send className="size-4 text-primary" />}
        </button>
      </SimpleTooltip>
    )
  }

  const anySent = enabledIntegrations.some((i) => i.id === sentId)

  return (
    <DropdownMenu>
      <SimpleTooltip label={t('torrents.send_to_integration_prompt')}>
        <DropdownMenuTrigger asChild>
          <button type="button" className="cursor-pointer">
            {anySent ? <Check className="size-4 text-primary" /> : <Send className="size-4 text-primary" />}
          </button>
        </DropdownMenuTrigger>
      </SimpleTooltip>
      <DropdownMenuContent>
        {enabledIntegrations.map((integration) => (
          <DropdownMenuItem key={integration.id} onSelect={() => send(integration.id, [infoHash])}>
            {integration.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
