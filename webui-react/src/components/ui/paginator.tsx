import { useTranslation } from 'react-i18next'
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { SimpleTooltip } from './tooltip'
import { formatIntEstimate } from '@/lib/utils/intEstimate'

export interface PageEvent {
  page: number
  pageSize: number
}

export interface PaginatorProps {
  page: number
  pageSize: number
  pageSizes?: number[]
  pageLength?: number
  totalLength?: number | null
  totalIsEstimate?: boolean
  hasNextPage?: boolean | null
  showLastPage?: boolean
  onPaging: (event: PageEvent) => void
}

export function Paginator({
  page,
  pageSize,
  pageSizes = [10, 20, 50, 100],
  pageLength = 0,
  totalLength = null,
  totalIsEstimate = false,
  hasNextPage = null,
  showLastPage = false,
  onPaging,
}: PaginatorProps) {
  const { t, i18n } = useTranslation()

  const hasTotalLength = typeof totalLength === 'number'
  const firstItemIndex = (page - 1) * pageSize + 1
  const lastItemIndex = (page - 1) * pageSize + pageLength
  const hasPreviousPage = page > 1
  const pageCount = hasTotalLength ? Math.ceil(totalLength / pageSize) : null
  const actuallyHasNextPage =
    typeof hasNextPage === 'boolean' ? hasNextPage : hasTotalLength ? page * pageSize < totalLength : false

  return (
    <div className="flex flex-wrap items-center justify-end gap-4 px-2 py-3 text-sm">
      <Select value={String(pageSize)} onValueChange={(value) => onPaging({ page: 1, pageSize: Number(value) })}>
        <SelectTrigger className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {pageSizes.map((size) => (
            <SelectItem key={size} value={String(size)}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-muted-fg">
        {hasTotalLength
          ? t('paginator.x_to_y_of_z', {
              x: firstItemIndex.toLocaleString(i18n.language),
              y: lastItemIndex.toLocaleString(i18n.language),
              z: formatIntEstimate(totalLength ?? 0, i18n.language, totalIsEstimate),
            })
          : t('paginator.x_to_y', {
              x: firstItemIndex.toLocaleString(i18n.language),
              y: lastItemIndex.toLocaleString(i18n.language),
            })}
      </p>
      <div className="flex items-center gap-1">
        <SimpleTooltip label={t('paginator.first_page')}>
          <Button
            variant="ghost"
            size="icon"
            disabled={!hasPreviousPage}
            onClick={() => onPaging({ page: 1, pageSize })}
          >
            <ChevronFirst className="size-4" />
          </Button>
        </SimpleTooltip>
        <SimpleTooltip label={t('paginator.previous_page')}>
          <Button
            variant="ghost"
            size="icon"
            disabled={!hasPreviousPage}
            onClick={() => onPaging({ page: page - 1, pageSize })}
          >
            <ChevronLeft className="size-4" />
          </Button>
        </SimpleTooltip>
        <SimpleTooltip label={t('paginator.next_page')}>
          <Button
            variant="ghost"
            size="icon"
            disabled={!actuallyHasNextPage}
            onClick={() => onPaging({ page: page + 1, pageSize })}
          >
            <ChevronRight className="size-4" />
          </Button>
        </SimpleTooltip>
        {showLastPage && (
          <SimpleTooltip label={t('paginator.last_page')}>
            <Button
              variant="ghost"
              size="icon"
              disabled={pageCount == null || page === pageCount}
              onClick={() => onPaging({ page: pageCount ?? 1, pageSize })}
            >
              <ChevronLast className="size-4" />
            </Button>
          </SimpleTooltip>
        )}
      </div>
    </div>
  )
}
