import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RotateCw } from 'lucide-react'
import { useMutation } from '@apollo/client/react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { TorrentReprocessDocument } from '@/lib/graphql/generated'

export function TorrentReprocess({ infoHashes, onUpdated }: { infoHashes: string[]; onUpdated: () => void }) {
  const { t } = useTranslation()
  const [classifierRematch, setClassifierRematch] = useState(false)
  const [apisDisabled, setApisDisabled] = useState(true)
  const [localSearchDisabled, setLocalSearchDisabled] = useState(true)
  const [reprocess] = useMutation(TorrentReprocessDocument)

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={!localSearchDisabled}
            onCheckedChange={(checked) => {
              setLocalSearchDisabled(!checked)
              if (checked) setApisDisabled(true)
            }}
          />
          {t('torrents.reprocess.match_content_by_local_search')}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={!apisDisabled}
            onCheckedChange={(checked) => {
              setApisDisabled(!checked)
              if (checked) setLocalSearchDisabled(false)
            }}
          />
          {t('torrents.reprocess.match_content_by_external_api_search')}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={classifierRematch} onCheckedChange={(checked) => setClassifierRematch(!!checked)} />
          {t('torrents.reprocess.force_rematch')}
        </label>
      </div>
      <div className="mt-4">
        <Button
          variant="outline"
          disabled={!infoHashes.length}
          onClick={() =>
            void reprocess({
              variables: { input: { infoHashes, classifierRematch, apisDisabled, localSearchDisabled } },
            }).then(() => onUpdated())
          }
        >
          <RotateCw className="size-4" />
          {t('torrents.reprocess.reprocess')}
        </Button>
      </div>
    </div>
  )
}
