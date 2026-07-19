import { useTranslation } from 'react-i18next'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { SimpleTooltip } from '@/components/ui/tooltip'

const links = [
  { href: 'https://bitmagnet.io', label: 'bitmagnet.io' },
  { href: 'https://discord.gg/6mFNszX8qM', service: 'Discord' },
  { href: 'https://github.com/bitmagnet-io/bitmagnet', service: 'GitHub' },
  { href: 'https://opencollective.com/bitmagnet', service: 'OpenCollective' },
]

export function ExternalLinksMenu() {
  const { t } = useTranslation()

  return (
    <DropdownMenu>
      <SimpleTooltip label={t('layout.external_links')}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={t('layout.external_links')}>
            <ExternalLink className="size-5" />
          </Button>
        </DropdownMenuTrigger>
      </SimpleTooltip>
      <DropdownMenuContent>
        {links.map((link) => (
          <DropdownMenuItem key={link.href} asChild>
            <a href={link.href} target="_blank" rel="noreferrer">
              {link.label ?? t('layout.bitmagnet_on_service', { service: link.service })}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
