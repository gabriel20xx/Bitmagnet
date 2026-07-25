import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatFilesize } from '@/lib/utils/filesize'

export interface PendingSequentialScan {
  name: string
  size: number
}

// rar/tar have no directory trailer the way zip/7z do, so listing one means reading through
// the archive's entire contents over BitTorrent rather than a quick peek at the end of the
// file (see internal/archive.Format.IsSequential) - this confirms that cost with the user
// before firing off what could be a very large fetch from an accidental chevron click.
export function ConfirmArchiveScanDialog({
  pending,
  onOpenChange,
  onConfirm,
}: {
  pending: PendingSequentialScan | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  const { t, i18n } = useTranslation()

  return (
    <Dialog open={pending != null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('torrents.confirm_scan_archive_title')}</DialogTitle>
        </DialogHeader>
        {pending && (
          <p className="text-sm">
            {t('torrents.confirm_scan_archive_body', {
              name: pending.name,
              size: formatFilesize(pending.size, i18n.language),
            })}
          </p>
        )}
        <DialogFooter>
          <Button
            type="button"
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            {t('torrents.scan_archive')}
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('general.dismiss')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
