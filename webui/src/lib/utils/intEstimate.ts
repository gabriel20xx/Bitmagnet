export function formatIntEstimate(n: number, locale: string, isEstimate = true, sigFigs = 2): string {
  if (isEstimate && n > 0 && sigFigs > 0) {
    const magnitude = Math.floor(Math.log10(Math.abs(n)))
    const scale = Math.pow(10, magnitude - (sigFigs - 1))
    n = Math.round(n / scale) * scale
  }
  const str = Intl.NumberFormat(locale).format(n)
  return isEstimate ? `~${str}` : str
}
