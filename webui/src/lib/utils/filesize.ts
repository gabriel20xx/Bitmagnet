import { filesize as filesizeLib } from 'filesize'

export function formatFilesize(value: number, locale: string): string {
  return filesizeLib(value, { locale, base: 10 }) as string
}
