import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { useLazyQuery } from '@apollo/client/react'
import { TorrentSuggestTagsDocument } from '@/lib/graphql/generated'
import { normalizeTagInput } from '@/lib/utils/normalizeTagInput'

export function TagInput({
  tags,
  onAdd,
  onRename,
  onDelete,
}: {
  tags: string[]
  onAdd: (tag: string) => void
  onRename: (from: string, to: string) => void
  onDelete: (tag: string) => void
}) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [fetchSuggestions] = useLazyQuery(TorrentSuggestTagsDocument)

  useEffect(() => {
    const prefix = value || undefined
    fetchSuggestions({ variables: { input: { prefix, exclusions: tags } } })
      .then((res) => setSuggestions(res.data?.torrent.suggestTags.suggestions.map((s) => s.name) ?? []))
      .catch(() => setSuggestions([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const commit = (raw: string) => {
    const tag = normalizeTagInput(raw)
    if (tag) onAdd(tag)
    setValue('')
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((tagName) =>
          editing === tagName ? (
            <input
              key={tagName}
              autoFocus
              defaultValue={tagName}
              className="w-28 rounded-full border border-primary bg-bg px-2 py-0.5 text-xs outline-none"
              onBlur={(e) => {
                onRename(tagName, normalizeTagInput(e.target.value) || tagName)
                setEditing(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur()
                if (e.key === 'Escape') setEditing(null)
              }}
            />
          ) : (
            <span
              key={tagName}
              onClick={() => setEditing(tagName)}
              className="inline-flex cursor-text items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary"
            >
              {tagName}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(tagName)
                }}
                className="hover:opacity-70"
              >
                <X className="size-3" />
              </button>
            </span>
          ),
        )}
        <input
          value={value}
          onChange={(e) => setValue(normalizeTagInput(e.target.value))}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ',') && value) {
              e.preventDefault()
              commit(value)
            }
          }}
          placeholder={t('torrents.new_tag')}
          autoCapitalize="none"
          className="min-w-32 flex-1 bg-transparent px-1 py-0.5 text-sm outline-none"
        />
      </div>
      {suggestions.length > 0 && value && (
        <ul className="mt-2 flex flex-wrap gap-1 border-t border-border pt-2">
          {suggestions.map((s) => (
            <li key={s}>
              <button
                onClick={() => commit(s)}
                className="rounded-full border border-border px-2 py-0.5 text-xs hover:bg-surface-hover"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
