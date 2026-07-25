import type { VideoResolution, VideoSource } from '@/lib/graphql/generated'

export const videoResolutionOptions: VideoResolution[] = [
  'V360p',
  'V480p',
  'V540p',
  'V576p',
  'V720p',
  'V1080p',
  'V1440p',
  'V2160p',
  'V4320p',
]

export const videoSourceOptions: VideoSource[] = [
  'CAM',
  'TELESYNC',
  'TELECINE',
  'WORKPRINT',
  'TV',
  'DVD',
  'WEBRip',
  'WEBDL',
  'BluRay',
]

export function videoResolutionLabel(value: VideoResolution): string {
  return value.slice(1)
}
