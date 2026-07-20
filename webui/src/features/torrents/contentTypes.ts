import {
  BookOpen,
  Clapperboard,
  Flame,
  Gamepad2,
  HelpCircle,
  Mic,
  Monitor,
  Music,
  Tv,
  type LucideIcon,
} from 'lucide-react'
import type { ContentType } from '@/lib/graphql/generated'

interface ContentTypeInfo {
  icon: LucideIcon
}

export const contentTypeMap: Record<ContentType | 'null', ContentTypeInfo> = {
  movie: { icon: Clapperboard },
  tv_show: { icon: Tv },
  music: { icon: Music },
  ebook: { icon: BookOpen },
  comic: { icon: BookOpen },
  audiobook: { icon: Mic },
  software: { icon: Monitor },
  game: { icon: Gamepad2 },
  xxx: { icon: Flame },
  null: { icon: HelpCircle },
}

export const contentTypeList = (Object.keys(contentTypeMap) as Array<ContentType | 'null'>).map((key) => ({
  key,
  ...contentTypeMap[key],
}))

export function contentTypeInfo(key?: string | null): ContentTypeInfo | undefined {
  return key ? contentTypeMap[key as ContentType] : undefined
}
