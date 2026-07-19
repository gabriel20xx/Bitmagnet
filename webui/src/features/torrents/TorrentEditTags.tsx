import { useState } from 'react'
import { useMutation } from '@apollo/client/react'
import { TorrentSetTagsDocument, type TorrentContentFragment } from '@/lib/graphql/generated'
import { addError } from '@/lib/toast/store'
import { TagInput } from './TagInput'

export function TorrentEditTags({
  torrentContent,
  onUpdated,
}: {
  torrentContent: TorrentContentFragment
  onUpdated: () => void
}) {
  const [tags, setTags] = useState(torrentContent.torrent.tagNames)
  const [setTagsMutation] = useMutation(TorrentSetTagsDocument)

  const save = (next: string[]) => {
    setTags(next)
    setTagsMutation({ variables: { infoHashes: [torrentContent.infoHash], tagNames: next } })
      .then(() => onUpdated())
      .catch((err: Error) => addError(`Error saving tags: ${err.message}`))
  }

  return (
    <TagInput
      tags={tags}
      onAdd={(tag) => save([...tags, tag])}
      onRename={(from, to) => save(tags.map((t) => (t === from ? to : t)))}
      onDelete={(tag) => save(tags.filter((t) => t !== tag))}
    />
  )
}
