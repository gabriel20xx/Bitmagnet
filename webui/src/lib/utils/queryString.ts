export function stringParam(params: URLSearchParams, key: string): string | undefined {
  const value = params.get(key)
  return value ? value : undefined
}

export function stringListParam(params: URLSearchParams, key: string): string[] | undefined {
  const str = stringParam(params, key)
  const list = str
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return list?.length ? Array.from(new Set(list)).sort() : undefined
}

export function intParam(params: URLSearchParams, key: string): number | undefined {
  const value = params.get(key)
  return value && /^\d+$/.test(value) ? parseInt(value, 10) : undefined
}
