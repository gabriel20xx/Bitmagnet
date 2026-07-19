import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { SimpleTooltip } from '@/components/ui/tooltip'
import { languages } from '@/lib/i18n/languages'
import { setStoredLanguage } from '@/lib/i18n'

export function LanguageMenu() {
  const { t, i18n } = useTranslation()

  return (
    <DropdownMenu>
      <SimpleTooltip label={t('layout.translate')}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={t('layout.translate')}>
            <Languages className="size-5" />
          </Button>
        </DropdownMenuTrigger>
      </SimpleTooltip>
      <DropdownMenuContent>
        {languages.map((l) => (
          <DropdownMenuItem
            key={l.id}
            active={l.id === i18n.language}
            onSelect={() => {
              setStoredLanguage(l.id)
              void i18n.changeLanguage(l.id)
            }}
          >
            {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
