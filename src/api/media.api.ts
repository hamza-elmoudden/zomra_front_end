import api from './axios'

export interface Media {
  id: string
  event_id: string
  uploader_id: string
  file_name: string
  url: string
  media_type: 'photo' | 'video'
  created_at: string
}

/**
 * Ensures a media URL is absolute. The backend may return a relative path
 * like "uploads/filename.jpg" — we prefix it with VITE_API_BASE_URL so
 * <img src={m.url}> and <video src={m.url}> work correctly.
 */
function resolveMediaUrl(url: string): string {
  if (!url) return url
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const base = (import.meta.env.VITE_API_BASE_URL as string).replace(/\/$/, '')
  return `${base}/${url.replace(/^\//, '')}`
}

function normalizeMedia(m: Media): Media {
  return { ...m, url: resolveMediaUrl(m.url) }
}

export function getEventMedia(eventId: string): Promise<Media[]> {
  return api
    .get<Media[]>(`/events/${eventId}/media`)
    .then((r) => r.data.map(normalizeMedia))
}

export function uploadEventMedia(eventId: string, file: File, mediaType: 'photo' | 'video' = 'photo'): Promise<Media> {
  const form = new FormData()
  form.append('file', file)
  form.append('mediaType', mediaType)
  return api.post<Media>(`/events/${eventId}/media`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => normalizeMedia(r.data))
}

export function deleteMedia(mediaId: string): Promise<void> {
  return api.delete(`/media/${mediaId}`)
}