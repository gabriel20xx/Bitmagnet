// Extensions from FileType 'document'/'subtitles' that are actually plain text - as opposed
// to e.g. pdf/epub/docx, which share those buckets but can't be rendered as raw text. Mirrors
// internal/mediastream/service.go's textFileExtensions.
const TEXT_PREVIEW_EXTENSIONS = new Set(['txt', 'nfo', 'md', 'log', 'srt', 'vtt', 'sub'])

export function isTextPreviewable(name: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase()
  return !!ext && TEXT_PREVIEW_EXTENSIONS.has(ext)
}
