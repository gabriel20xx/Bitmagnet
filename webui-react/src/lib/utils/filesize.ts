import { filesize as filesizeLib } from 'filesize'

export function formatFilesize(value: number, locale: string, base: 2 | 10 = 2): string {
  return filesizeLib(value, { locale, base }) as string
}
