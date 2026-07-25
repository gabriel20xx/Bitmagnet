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

// Mirrors the backend's Format.IsSequential (internal/archive) - zip/7z store a trailer and
// are cheap to list; rar/tar have no such structure, so listing one means reading through
// the archive's entire contents over BitTorrent, not just a quick peek at the end of the
// file. Used to decide whether expanding an archive row needs a size-based confirmation
// first (see ConfirmArchiveScanDialog) rather than auto-expanding like zip/7z.
const SEQUENTIAL_ARCHIVE_EXTENSIONS = new Set(['rar', 'tar'])

export function isSequentialArchiveFormat(name: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase()
  return ext != null && SEQUENTIAL_ARCHIVE_EXTENSIONS.has(ext)
}

// Above this size, expanding a rar/tar archive row prompts for confirmation first rather
// than silently starting what could be a very large download.
export const SEQUENTIAL_ARCHIVE_SCAN_WARN_BYTES = 100 * 1024 * 1024

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
