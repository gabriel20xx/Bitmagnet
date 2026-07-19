import { formatDistanceToNow } from 'date-fns'
import { resolveDateLocale } from './locales'

export function formatTimeAgo(date: string | number | Date, locale: string): string {
  return formatDistanceToNow(date, { addSuffix: true, locale: resolveDateLocale(locale) })
}
