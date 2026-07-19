import { useTranslation } from 'react-i18next'
import { Moon, Palette, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { SimpleTooltip } from '@/components/ui/tooltip'
import { useTheme } from '@/lib/theme/ThemeProvider'

export function ThemeMenu() {
  const { t } = useTranslation()
  const { themes, selectedTheme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <SimpleTooltip label={t('layout.change_theme')}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={t('layout.change_theme')}>
            <Palette className="size-5" />
          </Button>
        </DropdownMenuTrigger>
      </SimpleTooltip>
      <DropdownMenuContent>
        {themes.map((th) => (
          <DropdownMenuItem key={th.key} active={th.key === selectedTheme} onSelect={() => setTheme(th.key)}>
            {th.dark ? <Moon className="size-4" /> : <Sun className="size-4" />}
            {th.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
