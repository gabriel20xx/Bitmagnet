import { useTranslation } from 'react-i18next'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SimpleTooltip } from '@/components/ui/tooltip'
import { useTheme } from '@/lib/theme/ThemeProvider'

export function ThemeToggle() {
  const { t } = useTranslation()
  const { isDark, toggleTheme } = useTheme()

  return (
    <SimpleTooltip label={t('layout.change_theme')}>
      <Button variant="ghost" size="icon" aria-label={t('layout.change_theme')} onClick={toggleTheme}>
        {isDark ? <Moon className="size-5" /> : <Sun className="size-5" />}
      </Button>
    </SimpleTooltip>
  )
}
