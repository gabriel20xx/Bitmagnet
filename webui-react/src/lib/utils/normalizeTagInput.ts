export function normalizeTagInput(value: string): string {
  return value
    .toLowerCase()
    .replaceAll(/[^a-z0-9-]/g, '-')
    .replace(/^-+/, '')
    .replaceAll(/-+/g, '-')
}
