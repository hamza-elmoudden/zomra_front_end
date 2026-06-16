import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getMe, getUserReviews, updateProfile, uploadAvatar } from '@/api/users.api'
import type { UpdateUserProfileDto } from '@/api/users.api'
import { getMyEvents, getJoinedEvents, deleteEvent } from '@/api/events.api'
import { useAuth } from '@/hooks/useAuth'
import {
  Star, Edit3, LogOut, Shield, MapPin, Calendar,
  Plus, Trash2, ImagePlus, ChevronRight, Clock,
  X, Check, Camera, Hash, Users,
} from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'

/* ── styles ─────────────────────────────────────────────────── */
const STATUS_STYLE: Record<string, React.CSSProperties> = {
  open:      { background: 'rgba(0,206,201,0.12)',   color: '#00cec9', border: '1px solid rgba(0,206,201,0.25)' },
  full:      { background: 'rgba(255,107,107,0.12)', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.25)' },
  ongoing:   { background: 'rgba(108,92,231,0.15)',  color: '#a29bfe', border: '1px solid rgba(108,92,231,0.3)' },
  draft:     { background: 'rgba(136,144,164,0.12)', color: '#8890a4', border: '1px solid rgba(136,144,164,0.2)' },
  completed: { background: 'rgba(136,144,164,0.08)', color: '#6b7280', border: '1px solid rgba(136,144,164,0.15)' },
  cancelled: { background: 'rgba(255,107,107,0.08)', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.15)' },
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', background: 'var(--z-surface2)', border: '1px solid var(--z-border)',
  borderRadius: 10, padding: '10px 12px', fontSize: 14, color: 'var(--z-text)',
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
}

/* ── Event card (shared for hosted + joined) ─────────────────── */
function EventCard({
  event,
  isJoined = false,
  onView,
  onEdit,
  onPhotos,
  onDelete,
  onGroupChat,
  deleting,
}: {
  event: any
  isJoined?: boolean
  onView: () => void
  onEdit?: () => void
  onPhotos?: () => void
  onDelete?: () => void
  onGroupChat: () => void
  deleting?: boolean
}) {
  return (
    <div className="z-card" style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Thumbnail */}
        <div
          onClick={onView}
          style={{ width: 52, height: 52, borderRadius: 10, flexShrink: 0, background: 'var(--z-surface2)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, cursor: 'pointer' }}
        >
          {event.cover_image_url
            ? <img src={event.cover_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : '✦'}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }} onClick={onView} role="button" title="Go to event">
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4, flexWrap: 'wrap', cursor: 'pointer' }}>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, fontWeight: 500, ...(STATUS_STYLE[event.status] ?? STATUS_STYLE.draft) }}>
              {event.status}
            </span>
            <span style={{ fontSize: 11, color: 'var(--z-muted)' }}>{event.category}</span>
            {isJoined && (
              <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 100, background: 'rgba(0,206,201,0.12)', color: 'var(--z-mint)', border: '1px solid rgba(0,206,201,0.2)', fontWeight: 600 }}>
                ✓ Joined
              </span>
            )}
          </div>
          <div className="font-display" style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}>
            {event.title}
          </div>
          <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--z-muted)', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={11} />{formatDate(event.starts_at)}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={11} />{formatTime(event.starts_at)}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Users size={11} />{event.current_count}/{event.max_participants}</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 7, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--z-border)' }}>
        {/* View detail */}
        <button
          onClick={onView}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px', borderRadius: 9, border: '1px solid var(--z-border)', background: 'transparent', color: 'var(--z-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <ChevronRight size={13} /> View
        </button>

        {/* Group Chat — always shown */}
        <button
          onClick={onGroupChat}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px', borderRadius: 9, border: '1px solid rgba(0,206,201,0.3)', background: 'rgba(0,206,201,0.08)', color: 'var(--z-mint)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <Hash size={13} /> Group Chat
        </button>

        {/* Host-only buttons */}
        {!isJoined && onPhotos && (
          <button
            onClick={onPhotos}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px', borderRadius: 9, border: '1px solid var(--z-border)', background: 'transparent', color: 'var(--z-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <ImagePlus size={13} /> Photos
          </button>
        )}
        {!isJoined && onEdit && (
          <button
            onClick={onEdit}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px', borderRadius: 9, border: '1px solid rgba(162,155,254,0.3)', background: 'rgba(108,92,231,0.08)', color: 'var(--z-accent2)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <Edit3 size={13} /> Edit
          </button>
        )}
        {!isJoined && onDelete && (
          <button
            onClick={onDelete}
            disabled={deleting}
            style={{ width: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 9, border: '1px solid rgba(255,107,107,0.25)', background: 'rgba(255,107,107,0.08)', color: 'var(--z-coral)', cursor: 'pointer', padding: 0 }}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Main Page ───────────────────────────────────────────────── */
export default function MyProfilePage() {
  const { user, clearUser } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<UpdateUserProfileDto>({})
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [profileTab, setProfileTab] = useState<'hosted' | 'joined'>('hosted')

  /* queries */
  const { data: profile } = useQuery({ queryKey: ['me'], queryFn: getMe, initialData: user ?? undefined })
  const { data: reviews = [] } = useQuery({ queryKey: ['user', user?.id, 'reviews'], queryFn: () => getUserReviews(user!.id), enabled: !!user?.id })
  const { data: myEvents = [], isLoading: loadingHosted } = useQuery({ queryKey: ['events', 'my'], queryFn: getMyEvents, enabled: !!user?.id })
  const { data: joinedEvents = [], isLoading: loadingJoined } = useQuery({ queryKey: ['events', 'joined'], queryFn: getJoinedEvents, enabled: !!user?.id })

  /* mutations */
  const deleteMutation = useMutation({ mutationFn: (id: string) => deleteEvent(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['events', 'my'] }) })

  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserProfileDto) => updateProfile(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['me'] }); setEditing(false) },
  })

  const avatarMutation = useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: (data) => {
      setAvatarPreview(null); setAvatarFile(null)
      setEditForm(f => ({ ...f, avatar_url: data.avatar_url }))
      qc.invalidateQueries({ queryKey: ['me'] })
    },
  })

  function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file))
  }

  function openEdit() {
    setEditForm({ full_name: profile?.full_name ?? '', bio: profile?.bio ?? '', city: profile?.city ?? '', country: profile?.country ?? '', phone: '' })
    setAvatarFile(null); setAvatarPreview(null); setEditing(true)
  }

  function handleEditSubmit() {
    const payload: UpdateUserProfileDto = {}
    if (editForm.full_name) payload.full_name = editForm.full_name
    if (editForm.bio)       payload.bio       = editForm.bio
    if (editForm.city)      payload.city      = editForm.city
    if (editForm.country)   payload.country   = editForm.country
    if (editForm.phone)     payload.phone     = editForm.phone
    updateMutation.mutate(payload)
  }

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null
  const initials = (profile?.full_name ?? profile?.username ?? 'ME').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  const handleLogout = () => { clearUser(); qc.clear(); navigate('/login', { replace: true }) }

  const eventsLoading = profileTab === 'hosted' ? loadingHosted : loadingJoined
  const eventsToShow  = profileTab === 'hosted' ? myEvents : joinedEvents

  return (
    <div style={{ minHeight: '100%', background: 'var(--z-bg)', paddingBottom: 40 }}>

      {/* ── Edit Modal ────────────────────────────────────────── */}
      {editing && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end' }}
          onClick={e => e.target === e.currentTarget && setEditing(false)}
        >
          <div style={{ width: '100%', background: 'var(--z-surface)', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 className="font-display" style={{ fontSize: 18, fontWeight: 700, color: 'var(--z-text)' }}>Edit Profile</h2>
              <button onClick={() => setEditing(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--z-muted)', display: 'flex' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Avatar */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--z-muted)', marginBottom: 8, display: 'block', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Profile Photo</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#6c5ce7,#fd79a8)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, border: '2px solid rgba(162,155,254,0.3)' }}>
                    {avatarPreview
                      ? <img src={avatarPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : profile?.avatar_url
                      ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 22, fontWeight: 700, color: 'white' }}>{initials}</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 10, background: 'var(--z-surface2)', border: '1px solid var(--z-border)', color: 'var(--z-text)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                      <Camera size={14} />
                      {avatarFile ? avatarFile.name.slice(0, 20) + '…' : 'Choose photo'}
                      <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleAvatarFileChange} style={{ display: 'none' }} />
                    </label>
                    {avatarFile && (
                      <button onClick={() => avatarMutation.mutate(avatarFile)} disabled={avatarMutation.isPending}
                        style={{ marginTop: 8, display: 'block', padding: '7px 14px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6c5ce7,#a29bfe)', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: avatarMutation.isPending ? 0.7 : 1 }}>
                        {avatarMutation.isPending ? 'Uploading…' : 'Upload photo'}
                      </button>
                    )}
                    {avatarMutation.isError && <p style={{ fontSize: 11, color: 'var(--z-coral)', marginTop: 4 }}>Upload failed, try again</p>}
                    {avatarMutation.isSuccess && <p style={{ fontSize: 11, color: 'var(--z-mint)', marginTop: 4 }}>✓ Photo updated</p>}
                  </div>
                </div>
              </div>

              {/* Fields */}
              {([
                { key: 'full_name', label: 'Full Name',  placeholder: 'Your full name' },
                { key: 'bio',       label: 'Bio',        placeholder: 'Tell people about yourself', textarea: true },
                { key: 'city',      label: 'City',       placeholder: 'Your city' },
                { key: 'country',   label: 'Country',    placeholder: 'Your country' },
                { key: 'phone',     label: 'Phone',      placeholder: '+212…' },
              ] as { key: keyof UpdateUserProfileDto; label: string; placeholder: string; textarea?: boolean }[]).map(({ key, label, placeholder, textarea }) => (
                <div key={key}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--z-muted)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</label>
                  {textarea
                    ? <textarea value={editForm[key] as string ?? ''} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} rows={3} style={{ ...INPUT_STYLE, resize: 'vertical' }} />
                    : <input type="text" value={editForm[key] as string ?? ''} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} style={INPUT_STYLE} />}
                </div>
              ))}
            </div>

            {updateMutation.isError && <p style={{ color: 'var(--z-coral)', fontSize: 13, marginTop: 12 }}>Failed to save. Try again.</p>}

            <button onClick={handleEditSubmit} disabled={updateMutation.isPending}
              style={{ marginTop: 24, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#6c5ce7,#a29bfe)', color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: updateMutation.isPending ? 0.7 : 1 }}>
              <Check size={16} />
              {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* ── Profile header ─────────────────────────────────────── */}
      <div style={{ padding: '24px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
          <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'linear-gradient(135deg, #6c5ce7, #fd79a8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700, color: 'white', fontFamily: '"Sora",sans-serif', border: '3px solid rgba(162,155,254,0.35)', flexShrink: 0, overflow: 'hidden' }}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials}
          </div>
          <div style={{ flex: 1 }}>
            <div className="font-display" style={{ fontSize: 20, fontWeight: 700, marginBottom: 3 }}>{profile?.full_name || profile?.username}</div>
            <div style={{ fontSize: 13, color: 'var(--z-muted)', marginBottom: 8 }}>@{profile?.username}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {profile?.is_verified && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 100, fontSize: 11, fontWeight: 600, background: 'rgba(0,206,201,0.12)', color: 'var(--z-mint)', border: '1px solid rgba(0,206,201,0.25)' }}>
                  <Shield size={11} /> Verified
                </span>
              )}
              {profile?.city && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 100, fontSize: 11, background: 'var(--z-surface2)', color: 'var(--z-muted)', border: '1px solid var(--z-border)' }}>
                  <MapPin size={11} /> {profile.city}
                </span>
              )}
            </div>
          </div>
          <button onClick={openEdit} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--z-surface2)', border: '1px solid var(--z-border)', color: 'var(--z-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} title="Edit profile">
            <Edit3 size={14} />
          </button>
        </div>

        {profile?.bio && <p style={{ fontSize: 14, color: 'var(--z-muted)', lineHeight: 1.6, marginBottom: 20 }}>{profile.bio}</p>}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 24 }}>
          {[
            { val: profile?.reputation_score ?? 0, label: 'Score' },
            { val: avgRating ? `⭐ ${avgRating}` : '—', label: `${reviews.length} Reviews` },
            { val: myEvents.length, label: 'Hosted' },
            { val: joinedEvents.length, label: 'Joined' },
          ].map(({ val, label }) => (
            <div key={label} style={{ background: 'var(--z-surface)', border: '1px solid var(--z-border)', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
              <div className="font-display" style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{val}</div>
              <div style={{ fontSize: 10, color: 'var(--z-muted)' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Events Section ─────────────────────────────────────── */}
      <div style={{ padding: '0 20px', marginBottom: 24 }}>

        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 className="font-display" style={{ fontSize: 15, fontWeight: 700 }}>Events</h2>
          <button
            onClick={() => navigate('/events/new')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6c5ce7,#a29bfe)', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <Plus size={13} /> New Event
          </button>
        </div>

        {/* Hosted / Joined tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--z-surface2)', borderRadius: 12, padding: 4 }}>
          {([
            { key: 'hosted', label: `Hosted (${myEvents.length})` },
            { key: 'joined', label: `Joined (${joinedEvents.length})` },
          ] as { key: 'hosted' | 'joined'; label: string }[]).map(({ key, label }) => (
            <button key={key} onClick={() => setProfileTab(key)} style={{
              flex: 1, padding: '8px', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
              background: profileTab === key ? 'var(--z-surface)' : 'transparent',
              color: profileTab === key ? 'var(--z-text)' : 'var(--z-muted)',
              boxShadow: profileTab === key ? '0 1px 4px rgba(0,0,0,0.25)' : 'none',
              transition: 'all 0.15s',
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* Event list */}
        {eventsLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: 130, borderRadius: 14 }} />)}
          </div>
        ) : eventsToShow.length === 0 ? (
          <div
            onClick={profileTab === 'hosted' ? () => navigate('/events/new') : undefined}
            style={{ background: 'var(--z-surface)', border: '2px dashed var(--z-border)', borderRadius: 14, padding: '32px 20px', textAlign: 'center', cursor: profileTab === 'hosted' ? 'pointer' : 'default' }}
          >
            <div style={{ fontSize: 32, marginBottom: 10 }}>{profileTab === 'hosted' ? '🎉' : '🔍'}</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
              {profileTab === 'hosted' ? 'No events hosted yet' : 'No events joined yet'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--z-muted)' }}>
              {profileTab === 'hosted' ? 'Tap to create your first event' : 'Browse events and join one!'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {eventsToShow.map(event => (
              <EventCard
                key={event.id}
                event={event}
                isJoined={profileTab === 'joined'}
                onView={() => navigate(`/events/${event.id}`)}
                onGroupChat={() => navigate(`/events/${event.id}`, { state: { tab: 'chat' } })}
                {...(profileTab === 'hosted' ? {
                  onEdit:   () => navigate(`/events/${event.id}/edit`),
                  onPhotos: () => navigate(`/events/${event.id}/media`),
                  onDelete: () => { if (window.confirm(`Delete "${event.title}"?`)) deleteMutation.mutate(event.id) },
                  deleting: deleteMutation.isPending,
                } : {})}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Reviews ────────────────────────────────────────────── */}
      {reviews.length > 0 && (
        <div style={{ padding: '0 20px', marginBottom: 24 }}>
          <h2 className="font-display" style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Reviews ({reviews.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {reviews.slice(0, 3).map(r => (
              <div key={r.id} style={{ background: 'var(--z-surface)', border: '1px solid var(--z-border)', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: r.comment ? 6 : 0 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={12} style={{ fill: i < r.rating ? '#ffeaa7' : 'transparent', color: i < r.rating ? '#ffeaa7' : 'rgba(255,255,255,0.15)' }} />
                  ))}
                  <span style={{ fontSize: 11, color: 'var(--z-muted)', marginLeft: 6 }}>{formatDate(r.created_at)}</span>
                </div>
                {r.comment && <p style={{ fontSize: 13, color: 'var(--z-muted)', lineHeight: 1.5 }}>{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, fontSize: 13, color: 'var(--z-muted)' }}>
          <Calendar size={14} />
          Member since {formatDate(profile?.created_at ?? new Date().toISOString())}
        </div>
        <button onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '12px', borderRadius: 12, background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', color: 'var(--z-coral)', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </div>
  )
}
