import { Archive, Database, FileText, Image, Monitor, Music, Subtitles, Video, type LucideIcon } from 'lucide-react'
import { isTextPreviewable } from '@/lib/utils/textPreview'
import type { FileType } from '@/lib/graphql/generated'

const PREVIEWABLE_FILE_TYPES: readonly FileType[] = ['image', 'audio', 'video']

// Archive contents can be listed and browsed, but an entry inside an archive is never
// itself expandable in turn - nested archives just render as an inert leaf, same as any
// other non-previewable file.
const EXPANDABLE_FILE_TYPES: readonly FileType[] = ['archive']

export function isPreviewable(fileType: FileType | null, name: string): boolean {
  return (fileType != null && PREVIEWABLE_FILE_TYPES.includes(fileType)) || isTextPreviewable(name)
}

export function isExpandableArchive(fileType: FileType | null): boolean {
  return fileType != null && EXPANDABLE_FILE_TYPES.includes(fileType)
}

export const FILE_TYPE_ICONS: Partial<Record<FileType, LucideIcon>> = {
  archive: Archive,
  audio: Music,
  data: Database,
  document: FileText,
  image: Image,
  software: Monitor,
  subtitles: Subtitles,
  video: Video,
}
