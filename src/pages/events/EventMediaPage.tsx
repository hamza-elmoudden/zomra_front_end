import { useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEventById } from '@/api/events.api'
import { getEventMedia, uploadEventMedia, deleteMedia } from '@/api/media.api'
import { useAuthStore } from '@/store/authStore'
import { ArrowLeft, Upload, Trash2, ImagePlus, CheckCircle, X } from 'lucide-react'

export default function EventMediaPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.user?.id)
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const { data: event } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getEventById(id!),
    enabled: !!id,
  })

  const { data: media = [], isLoading } = useQuery({
    queryKey: ['event', id, 'media'],
    queryFn: () => getEventMedia(id!),
    enabled: !!id,
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadEventMedia(id!, file, file.type.startsWith('video') ? 'video' : 'photo'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event', id, 'media'] })
      setUploadError(null)
    },
    onError: (e: any) => setUploadError(e?.response?.data?.message ?? 'Upload failed. Check file size or format.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (mediaId: string) => deleteMedia(mediaId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['event', id, 'media'] }),
  })

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach((f) => uploadMutation.mutate(f))
  }

  const isHost = userId === event?.host_id

  return (
    <div style={{ minHeight: '100%', background: 'var(--z-bg)', paddingBottom: 40 }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 20px 0' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <button
            onClick={() => navigate(`/events/${id}`)}
            style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--z-surface2)', border: '1px solid var(--z-border)', color: 'var(--z-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="font-display" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px' }}>Event Photos</h1>
            {event && <p style={{ fontSize: 12, color: 'var(--z-muted)', marginTop: 1 }}>{event.title}</p>}
          </div>
        </div>

        {/* Success banner shown after create */}
        {new URLSearchParams(window.location.search).get('new') === '1' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(0,206,201,0.1)', border: '1px solid rgba(0,206,201,0.25)',
            borderRadius: 12, padding: '12px 16px', marginBottom: 20, marginTop: 16,
          }}>
            <CheckCircle size={18} color="var(--z-mint)" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--z-mint)' }}>Event created!</div>
              <div style={{ fontSize: 12, color: 'var(--z-muted)' }}>Add photos to make it stand out.</div>
            </div>
            <button
              onClick={() => navigate(`/events/${id}`)}
              style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--z-accent2)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Skip →
            </button>
          </div>
        )}

        {/* Upload zone — only for host */}
        {isHost && (
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
            style={{
              border: `2px dashed ${dragOver ? 'var(--z-accent2)' : 'var(--z-border)'}`,
              borderRadius: 14,
              padding: '32px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragOver ? 'rgba(108,92,231,0.06)' : 'var(--z-surface)',
              transition: 'all 0.15s',
              marginBottom: 20,
              marginTop: new URLSearchParams(window.location.search).get('new') === '1' ? 0 : 20,
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'rgba(108,92,231,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px',
            }}>
              <ImagePlus size={22} color="var(--z-accent2)" />
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
              {uploadMutation.isPending ? 'Uploading…' : 'Drop photos or click to upload'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--z-muted)' }}>JPG, PNG, GIF, MP4 supported</div>
            {uploadError && (
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--z-coral)' }}>{uploadError}</div>
            )}
          </div>
        )}

        {/* Media grid */}
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[1,2,3].map((i) => <div key={i} className="skeleton" style={{ aspectRatio: '1', borderRadius: 10 }} />)}
          </div>
        ) : media.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {media.map((m) => (
              <div key={m.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', background: 'var(--z-surface2)' }}>
                {m.media_type === 'video' ? (
                  <video
                    src={m.url} muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <img
                    src={m.url} alt={m.file_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
                {isHost && (
                  <button
                    onClick={() => deleteMutation.mutate(m.id)}
                    style={{
                      position: 'absolute', top: 6, right: 6,
                      width: 26, height: 26, borderRadius: 8,
                      background: 'rgba(0,0,0,0.7)', border: 'none',
                      color: 'var(--z-coral)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : !isHost ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <ImagePlus size={40} color="var(--z-muted)" style={{ marginBottom: 12 }} />
            <p style={{ color: 'var(--z-muted)', fontSize: 14 }}>No photos yet.</p>
          </div>
        ) : null}

        {/* Done button */}
        <button
          onClick={() => navigate(`/events/${id}`)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', marginTop: 24, padding: '13px',
            borderRadius: 14, background: 'var(--z-accent)', border: 'none',
            color: 'white', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <CheckCircle size={16} />
          Done — View Event
        </button>
      </div>
    </div>
  )
}
