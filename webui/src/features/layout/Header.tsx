import { useState } from 'react'
import { NavLink, Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  Files,
  KeyRound,
  LineChart,
  ListChecks,
  LogOut,
  Magnet,
  Plug,
  UserRound,
  Workflow,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { SimpleTooltip } from '@/components/ui/tooltip'
import { HealthWidget } from '@/features/health/HealthWidget'
import { DatabaseStatsWidget } from '@/features/dashboard/DatabaseStatsWidget'
import { ThemeToggle } from './ThemeToggle'
import { LanguageMenu } from './LanguageMenu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/features/auth/useAuth'
import { CredentialsDialog } from '@/features/auth/CredentialsDialog'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-surface-hover',
    isActive && 'bg-surface-hover text-primary',
  )

const sidebarNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-surface-hover',
    isActive && 'bg-surface-hover text-primary',
  )

interface NavItem {
  to: string
  end?: boolean
  icon: LucideIcon
  labelKey: string
}

const navItems: NavItem[] = [
  { to: '/torrents', icon: Files, labelKey: 'routes.torrents' },
  { to: '/dashboard/metrics', icon: LineChart, labelKey: 'routes.metrics' },
  { to: '/dashboard/jobs', icon: ListChecks, labelKey: 'routes.jobs' },
  { to: '/dashboard/integrations', icon: Plug, labelKey: 'routes.integrations' },
  { to: '/dashboard/workflows', icon: Workflow, labelKey: 'routes.workflows' },
  { to: '/dashboard/admin', icon: Wrench, labelKey: 'routes.settings' },
]

function AccountMenu({
  username,
  logout,
  onChangeCredentials,
  sidebar = false,
}: {
  username: string
  logout: () => Promise<void>
  onChangeCredentials: () => void
  sidebar?: boolean
}) {
  const { t } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={sidebar ? 'sm' : 'icon'}
          className={cn(sidebar && 'w-full justify-start')}
          aria-label={t('auth.account')}
        >
          <UserRound className="size-5" />
          {sidebar && username}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent {...(sidebar ? { side: 'right' as const } : {})}>
        <DropdownMenuItem onSelect={onChangeCredentials}>
          <KeyRound className="size-4" />
          {t('auth.change_credentials')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void logout()}>
          <LogOut className="size-4" />
          {t('auth.sign_out')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function Header() {
  const { t } = useTranslation()
  const { status, logout } = useAuth()
  const [credentialsOpen, setCredentialsOpen] = useState(false)

  const username = status?.user?.username ?? ''

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-bg min-[960px]:flex">
        <Link
          to="/torrents"
          className="flex shrink-0 items-center gap-2 border-b border-border px-5 py-4 font-semibold"
        >
          <Magnet className="size-5 text-primary" />
          <span>Bitmagnet</span>
        </Link>
        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={sidebarNavLinkClass}>
              <item.icon className="size-4" />
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-2 border-t border-border p-3">
          <div className="flex items-center justify-end gap-1">
            <DatabaseStatsWidget />
            <HealthWidget />
            <ThemeToggle />
            <LanguageMenu />
          </div>
          <AccountMenu
            username={username}
            logout={logout}
            onChangeCredentials={() => setCredentialsOpen(true)}
            sidebar
          />
        </div>
      </aside>

      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-bg px-3 min-[960px]:hidden">
        <Link to="/torrents" className="flex shrink-0 items-center gap-2 pr-1 font-semibold">
          <Magnet className="size-5 text-primary" />
        </Link>
        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => (
            <SimpleTooltip key={item.to} label={t(item.labelKey)}>
              <NavLink to={item.to} end={item.end} className={navLinkClass}>
                <item.icon className="size-4" />
              </NavLink>
            </SimpleTooltip>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          <DatabaseStatsWidget />
          <HealthWidget />
          <ThemeToggle />
          <LanguageMenu />
          <AccountMenu username={username} logout={logout} onChangeCredentials={() => setCredentialsOpen(true)} />
        </div>
      </header>
      <CredentialsDialog
        key={username}
        open={credentialsOpen}
        onOpenChange={setCredentialsOpen}
        currentUsername={username}
      />
    </>
  )
}
