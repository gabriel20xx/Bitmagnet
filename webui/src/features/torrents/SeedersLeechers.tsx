import { cn } from '@/lib/utils/cn'

export function SeedersLeechers({ seeders, leechers }: { seeders?: number | null; leechers?: number | null }) {
  return (
    <>
      <span className={cn(seeders != null && (seeders > 0 ? 'text-success' : 'text-danger'))}>{seeders ?? '?'}</span>
      {' / '}
      <span className={cn(leechers != null && 'text-success')}>{leechers ?? '?'}</span>
    </>
  )
}
