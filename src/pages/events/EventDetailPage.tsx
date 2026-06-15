import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEventById, deleteEvent, getParticipants, manageParticipant } from '@/api/events.api'
import { getUserById, getUserReviews } from '@/api/users.api'
import { createConversation, getGroupMessages, sendGroupMessage } from '@/api/messaging.api'
import { useAuthStore } from '@/store/authStore'
import { getSocket } from '@/lib/socket'
import EventMap from '@/components/events/EventMap'
import JoinLeaveButton from '@/components/events/JoinLeaveButton'
import {
  Calendar, Clock, MapPin, Star, Edit3, Trash2, ArrowLeft,
  Users, MessageCircle, Hash, Send, Check, X, UserCheck,
} from 'lucide-react'
import { formatDate, formatTime, statusColor } from '@/lib/utils'
import type { GroupMessage } from '@/types/message.types'
import type { EventParticipant } from '@/types/event.types'

/* ─── helpers ──────────────────────────────────────────────── */
const CATEGORY_EMOJI: Record<string, string> = {
  Music: '🎵', Sports: '🏃', Food: '🍕', Arts: '🎭',
  Tech: '💻', Books: '📚', Nature: '🌿', Wellness: '🧘',
}
const CATEGORY_COLOR: Record<string, string> = {
  Music: 'rgba(108,92,231,0.2)', Sports: 'rgba(0,206,201,0.15)',
  Food: 'rgba(253,121,168,0.15)', Arts: 'rgba(255,107,107,0.15)',
  Tech: 'rgba(108,92,231,0.15)', Books: 'rgba(255,234,167,0.12)',
  Nature: 'rgba(0,206,201,0.12)', Wellness: 'rgba(0,206,201,0.12)',
}
const AVATAR_COLORS = ['#6c5ce7','#fd79a8','#00cec9','#0984e3','#e17055','#a29bfe','#fdcb6e']
function colorFor(id: string) {
  let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}
function initials(name?: string) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

/* ─── UserRow: resolves name for a participant ─────────────── */
function UserRow({
  participant, isSelf, isHost,
  onAccept, onReject, onMessage, onProfile,
  accepting, rejecting,
}: {
  participant: EventParticipant
  isSelf: boolean
  isHost: boolean
  onAccept?: () => void
  onReject?: () => void
  onMessage: () => void
  onProfile: () => void
  accepting: boolean
  rejecting: boolean
}) {
  const { data: user } = useQuery({
    queryKey: ['user', participant.user_id],
    queryFn: () => getUserById(participant.user_id),
    staleTime: 5 * 60_000,
  })
  const name = isSelf ? 'You' : (user?.full_name ?? user?.username ?? participant.user_id.slice(0, 8) + '…')
  const color = colorFor(participant.user_id)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 14px', borderRadius: 12,
      background: participant.status === 'pending'
        ? 'rgba(255,234,167,0.06)' : 'var(--z-surface)',
      border: `1px solid ${participant.status === 'pending'
        ? 'rgba(255,234,167,0.14)' : 'var(--z-border)'}`,
    }}>
      {/* Avatar */}
      <div
        onClick={onProfile}
        style={{ width: 38, height: 38, borderRadius: '50%', background: color, flexShrink: 0, cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', border: isSelf ? '2px solid var(--z-accent2)' : '2px solid transparent' }}
      >
        {user?.avatar_url
          ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : initials(user?.full_name ?? user?.username)}
      </div>

      {/* Name */}
      <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={onProfile}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--z-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        {user?.username && !isSelf && <div style={{ fontSize: 11, color: 'var(--z-muted)' }}>@{user.username}</div>}
      </div>

      {/* Status badge for non-pending */}
      {participant.status === 'accepted' && (
        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 100, background: 'rgba(0,206,201,0.12)', color: 'var(--z-mint)', border: '1px solid rgba(0,206,201,0.2)', fontWeight: 600 }}>
          ✓ Joined
        </span>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
        {!isSelf && (
          <button onClick={onMessage} title="Message"
            style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(108,92,231,0.15)', border: '1px solid rgba(108,92,231,0.3)', color: 'var(--z-accent2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageCircle size={12} />
          </button>
        )}
        {isHost && participant.status === 'pending' && (
          <>
            <button onClick={onAccept} disabled={accepting} title="Accept"
              style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,206,201,0.15)', border: '1px solid rgba(0,206,201,0.3)', color: 'var(--z-mint)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: accepting ? 0.5 : 1 }}>
              <Check size={13} />
            </button>
            <button onClick={onReject} disabled={rejecting} title="Reject"
              style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.25)', color: 'var(--z-coral)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: rejecting ? 0.5 : 1 }}>
              <X size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/* ─── Inline Group Chat ────────────────────────────────────── */
function GroupChat({ eventId, eventTitle }: { eventId: string; eventTitle: string }) {
  const userId = useAuthStore((s) => s.user?.id)
  const accessToken = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Fetch group messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['groupMessages', eventId],
    queryFn: () => getGroupMessages(eventId),
  })

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Join event room on mount
  useEffect(() => {
    if (!accessToken) return
    const sock = getSocket(accessToken)
    const join = () => sock.emit('joinEventRoom', { eventId })
    if (sock.connected) { join() } else { sock.once('connect', join) }
    return () => {
      sock.off('connect', join)
      sock.emit('leaveEventRoom', { eventId })
    }
  }, [eventId, accessToken])

  const sendMutation = useMutation({
    mutationFn: (content: string) => sendGroupMessage(eventId, content),
    onSuccess: (msg) => {
      qc.setQueryData<GroupMessage[]>(['groupMessages', eventId], (prev = []) =>
        prev.some(m => m.id === msg.id) ? prev : [...prev, msg]
      )
      setDraft('')
    },
  })

  function handleSend() {
    const t = draft.trim()
    if (!t || sendMutation.isPending) return
    sendMutation.mutate(t)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 420, background: 'var(--z-surface)', border: '1px solid var(--z-border)', borderRadius: 14, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--z-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#6c5ce7,#00cec9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Hash size={14} color="white" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--z-text)' }}>{eventTitle}</div>
          <div style={{ fontSize: 11, color: 'var(--z-muted)' }}>Group chat · accepted members only</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {isLoading && <p style={{ color: 'var(--z-muted)', fontSize: 13 }}>Loading…</p>}
        {!isLoading && messages.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
            <p style={{ color: 'var(--z-muted)', fontSize: 13 }}>No messages yet. Start the conversation!</p>
          </div>
        )}
        {messages.map(m => {
          const isMe = m.sender_id === userId
          return (
            <div key={m.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', gap: 7, alignItems: 'flex-end' }}>
              {!isMe && (
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: colorFor(m.sender_id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                  {m.sender_id.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div style={{ maxWidth: '72%' }}>
                {!isMe && (
                  <SenderName senderId={m.sender_id} />
                )}
                <div style={{
                  background: isMe ? 'var(--z-accent2)' : 'var(--z-surface2)',
                  color: isMe ? '#fff' : 'var(--z-text)',
                  borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  padding: '8px 12px', fontSize: 14, lineHeight: 1.45, wordBreak: 'break-word',
                }}>
                  {m.content}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--z-border)', display: 'flex', gap: 8 }}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder="Message the group…"
          style={{ flex: 1, background: 'var(--z-surface2)', border: '1px solid var(--z-border)', borderRadius: 10, padding: '9px 13px', fontSize: 14, color: 'var(--z-text)', fontFamily: 'inherit', outline: 'none' }}
        />
        <button
          onClick={handleSend}
          disabled={!draft.trim() || sendMutation.isPending}
          style={{ background: 'var(--z-accent2)', border: 'none', borderRadius: 10, padding: '9px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#fff', opacity: !draft.trim() || sendMutation.isPending ? 0.5 : 1 }}
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  )
}

function SenderName({ senderId }: { senderId: string }) {
  const { data } = useQuery({
    queryKey: ['user', senderId],
    queryFn: () => getUserById(senderId),
    staleTime: 5 * 60_000,
  })
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--z-accent2)', marginBottom: 3, paddingLeft: 2 }}>
      {data?.full_name ?? data?.username ?? senderId.slice(0, 8)}
    </div>
  )
}

/* ─── Main Page ────────────────────────────────────────────── */
export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.user?.id)
  const accessToken = useAuthStore((s) => s.accessToken)
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'info' | 'people' | 'chat'>('info')

  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getEventById(id!),
    enabled: !!id,
  })

  const { data: participants = [] } = useQuery({
    queryKey: ['event', id, 'participants'],
    queryFn: () => getParticipants(id!),
    enabled: !!id,
  })

  const { data: host } = useQuery({
    queryKey: ['user', event?.host_id],
    queryFn: () => getUserById(event!.host_id),
    enabled: !!event?.host_id,
  })

  const { data: reviews = [] } = useQuery({
    queryKey: ['user', event?.host_id, 'reviews'],
    queryFn: () => getUserReviews(event!.host_id),
    enabled: !!event?.host_id,
  })

  const isHost = userId === event?.host_id
  const myParticipation = participants.find(p => p.user_id === userId)
  const isAccepted = isHost || myParticipation?.status === 'accepted'

  // When user gets accepted → auto switch to people tab to show they're in
  useEffect(() => {
    if (isAccepted && myParticipation?.status === 'accepted') {
      // don't force-switch tab, just ensure participants list is fresh
    }
  }, [isAccepted, myParticipation?.status])

  const invalidateParticipants = () => {
    queryClient.invalidateQueries({ queryKey: ['event', id, 'participants'] })
    queryClient.invalidateQueries({ queryKey: ['event', id] })
  }

  const deleteMutation = useMutation({
    mutationFn: () => deleteEvent(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      navigate('/events', { replace: true })
    },
  })

  const convMutation = useMutation({
    mutationFn: () => createConversation({ recipientId: event!.host_id }),
    onSuccess: conv => navigate(`/messages?conv=${conv.id}`),
  })

  const acceptMutation = useMutation({
    mutationFn: (uid: string) => manageParticipant(id!, uid, 'accept'),
    onSuccess: invalidateParticipants,
  })

  const rejectMutation = useMutation({
    mutationFn: (uid: string) => manageParticipant(id!, uid, 'reject'),
    onSuccess: invalidateParticipants,
  })

  const msgMutation = useMutation({
    mutationFn: (recipientId: string) => createConversation({ recipientId }),
    onSuccess: conv => navigate(`/messages?conv=${conv.id}`),
  })

  if (isLoading) return (
    <div style={{ minHeight: '100vh', background: 'var(--z-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid var(--z-accent2)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  )

  if (error || !event) return (
    <div style={{ minHeight: '100vh', background: 'var(--z-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
      <p style={{ color: 'var(--z-coral)', marginBottom: 16, fontSize: 15 }}>Event not found.</p>
      <button onClick={() => navigate('/events')} style={{ background: 'var(--z-accent)', border: 'none', borderRadius: 12, padding: '10px 20px', color: 'white', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>
        Back to Events
      </button>
    </div>
  )

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null
  const emoji = CATEGORY_EMOJI[event.category] ?? '✦'
  const heroBg = CATEGORY_COLOR[event.category] ?? 'rgba(108,92,231,0.15)'

  const accepted = participants.filter(p => p.status === 'accepted')
  const pending  = participants.filter(p => p.status === 'pending')

  return (
    <div style={{ minHeight: '100%', background: 'var(--z-bg)' }}>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div style={{ height: 200, background: heroBg, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {event.cover_image_url
          ? <img src={event.cover_image_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 64 }}>{emoji}</span>}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, var(--z-bg) 100%)' }} />
        <button onClick={() => navigate(-1)} style={{ position: 'absolute', top: 16, left: 16, width: 36, height: 36, borderRadius: 10, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={16} />
        </button>
        {isHost && (
          <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8 }}>
            <button onClick={() => navigate(`/events/${id}/edit`)} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Edit3 size={14} />
            </button>
            <button onClick={() => { if (confirm('Delete this event?')) deleteMutation.mutate() }} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,107,107,0.2)', border: '1px solid rgba(255,107,107,0.4)', color: '#ff6b6b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* ── Body ──────────────────────────────────────────────── */}
      <div style={{ padding: '0 20px 40px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--z-accent2)' }}>{event.category}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(event.status)}`}>{event.status}</span>
        </div>

        <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: 'var(--z-text)', lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.3px' }}>
          {event.title}
        </h1>

        {/* ── Tab bar ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--z-surface2)', borderRadius: 12, padding: 4 }}>
          {([
            { key: 'info',   label: 'Info',       icon: <Calendar size={13} /> },
            { key: 'people', label: `People ${pending.length > 0 && isHost ? `(${pending.length} 🔔)` : ''}`, icon: <Users size={13} /> },
            ...(isAccepted ? [{ key: 'chat', label: 'Group Chat', icon: <Hash size={13} /> }] : []),
          ] as { key: 'info' | 'people' | 'chat'; label: string; icon: React.ReactNode }[]).map(({ key, label, icon }) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              padding: '8px 6px', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
              background: tab === key ? 'var(--z-surface)' : 'transparent',
              color: tab === key ? 'var(--z-text)' : 'var(--z-muted)',
              boxShadow: tab === key ? '0 1px 4px rgba(0,0,0,0.25)' : 'none',
              transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}>
              {icon} {label}
            </button>
          ))}
        </div>

        {/* ── Tab: Info ────────────────────────────────────────── */}
        {tab === 'info' && (
          <>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
              {[
                { val: `${event.current_count}/${event.max_participants}`, label: 'Going' },
                { val: `${event.duration_minutes}m`, label: 'Duration' },
                { val: avgRating ? `⭐ ${avgRating}` : '—', label: 'Host rating' },
              ].map(({ val, label }) => (
                <div key={label} style={{ background: 'var(--z-surface)', border: '1px solid var(--z-border)', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
                  <div className="font-display" style={{ fontSize: 16, fontWeight: 700, color: 'var(--z-text)' }}>{val}</div>
                  <div style={{ fontSize: 11, color: 'var(--z-muted)', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Meta */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20, background: 'var(--z-surface)', border: '1px solid var(--z-border)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--z-muted)' }}>
                <Calendar size={15} style={{ color: 'var(--z-accent2)', flexShrink: 0 }} />
                {formatDate(event.starts_at)} · {formatTime(event.starts_at)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--z-muted)' }}>
                <Clock size={15} style={{ color: 'var(--z-accent2)', flexShrink: 0 }} />
                {event.duration_minutes} minutes
              </div>
              {(event.address || event.city) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--z-muted)' }}>
                  <MapPin size={15} style={{ color: 'var(--z-accent2)', flexShrink: 0 }} />
                  {[event.address, event.city].filter(Boolean).join(', ')}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--z-muted)' }}>
                <Users size={15} style={{ color: 'var(--z-accent2)', flexShrink: 0 }} />
                {event.current_count} of {event.max_participants} spots filled
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div style={{ marginBottom: 20 }}>
                <h3 className="font-display" style={{ fontSize: 14, fontWeight: 600, color: 'var(--z-text)', marginBottom: 8 }}>About</h3>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--z-muted)' }}>{event.description}</p>
              </div>
            )}

            {/* Host card */}
            <div style={{ background: 'var(--z-surface)', border: '1px solid var(--z-border)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#6c5ce7,#fd79a8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: 'white', fontFamily: '"Sora",sans-serif', flexShrink: 0, overflow: 'hidden' }}>
                {host?.avatar_url
                  ? <img src={host.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initials(host?.full_name ?? host?.username)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--z-text)' }}>{host?.full_name || host?.username || 'Host'}</div>
                {avgRating && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--z-muted)', marginTop: 2 }}>
                    <Star size={12} style={{ fill: '#ffeaa7', color: '#ffeaa7' }} />
                    {avgRating} · {reviews.length} reviews
                  </div>
                )}
              </div>
              <span onClick={() => navigate(`/users/${event.host_id}`)} style={{ fontSize: 12, color: 'var(--z-accent2)', fontWeight: 500, cursor: 'pointer' }}>
                View →
              </span>
              {!isHost && (
                <button onClick={() => convMutation.mutate()} disabled={convMutation.isPending}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 9, border: '1px solid rgba(108,92,231,0.3)', background: 'rgba(108,92,231,0.1)', color: 'var(--z-accent2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <MessageCircle size={12} />
                  {convMutation.isPending ? '…' : 'Message'}
                </button>
              )}
            </div>

            {/* Map */}
            {(event.lat || event.lng) && (
              <div style={{ marginBottom: 20 }}>
                <h3 className="font-display" style={{ fontSize: 14, fontWeight: 600, color: 'var(--z-text)', marginBottom: 10 }}>Location</h3>
                <EventMap lat={event.lat} lng={event.lng} readOnly />
              </div>
            )}

            {/* Join / Leave */}
            <div style={{ marginBottom: 20 }}>
              <JoinLeaveButton
                eventId={event.id}
                hostId={event.host_id}
                currentCount={event.current_count}
                maxParticipants={event.max_participants}
                participants={participants}
              />
            </div>

            {/* Reviews */}
            {reviews.length > 0 && (
              <div style={{ background: 'var(--z-surface)', border: '1px solid var(--z-border)', borderRadius: 14, padding: '16px' }}>
                <h3 className="font-display" style={{ fontSize: 14, fontWeight: 600, color: 'var(--z-text)', marginBottom: 14 }}>
                  Reviews ({reviews.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {reviews.map(review => (
                    <div key={review.id} style={{ paddingBottom: 12, borderBottom: '1px solid var(--z-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={12} style={{ fill: i < review.rating ? '#ffeaa7' : 'transparent', color: i < review.rating ? '#ffeaa7' : 'rgba(255,255,255,0.15)' }} />
                        ))}
                        <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--z-muted)' }}>{formatDate(review.created_at)}</span>
                      </div>
                      {review.comment && <p style={{ fontSize: 13, color: 'var(--z-muted)', lineHeight: 1.5 }}>{review.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Tab: People ──────────────────────────────────────── */}
        {tab === 'people' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Join/Leave for current user */}
            {!isHost && (
              <JoinLeaveButton
                eventId={event.id}
                hostId={event.host_id}
                currentCount={event.current_count}
                maxParticipants={event.max_participants}
                participants={participants}
              />
            )}

            {/* Pending requests — host only */}
            {isHost && pending.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ffeaa7', animation: 'pulse 1.5s infinite' }} />
                  <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: '#ffeaa7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Pending Requests ({pending.length})
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pending.map(p => (
                    <UserRow
                      key={p.id}
                      participant={p}
                      isSelf={p.user_id === userId}
                      isHost={isHost}
                      onAccept={() => acceptMutation.mutate(p.user_id)}
                      onReject={() => rejectMutation.mutate(p.user_id)}
                      onMessage={() => msgMutation.mutate(p.user_id)}
                      onProfile={() => navigate(`/users/${p.user_id}`)}
                      accepting={acceptMutation.isPending && acceptMutation.variables === p.user_id}
                      rejecting={rejectMutation.isPending && rejectMutation.variables === p.user_id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Accepted members */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <UserCheck size={14} color="var(--z-mint)" />
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--z-mint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Members ({accepted.length})
                </h3>
              </div>
              {accepted.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--z-muted)' }}>No accepted members yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {accepted.map(p => (
                    <UserRow
                      key={p.id}
                      participant={p}
                      isSelf={p.user_id === userId}
                      isHost={isHost}
                      onMessage={() => msgMutation.mutate(p.user_id)}
                      onProfile={() => navigate(`/users/${p.user_id}`)}
                      accepting={false}
                      rejecting={false}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Accepted banner for current user */}
            {!isHost && isAccepted && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(0,206,201,0.08)', border: '1px solid rgba(0,206,201,0.2)', borderRadius: 12 }}>
                <UserCheck size={16} color="var(--z-mint)" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--z-mint)' }}>You're in!</div>
                  <div style={{ fontSize: 12, color: 'var(--z-muted)' }}>
                    You can now access the Group Chat tab
                  </div>
                </div>
                <button
                  onClick={() => setTab('chat')}
                  style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: 9, border: 'none', background: 'var(--z-mint)', color: '#000', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <Hash size={11} /> Open Chat
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Group Chat ───────────────────────────────────── */}
        {tab === 'chat' && isAccepted && (
          <GroupChat eventId={event.id} eventTitle={event.title} />
        )}
        {tab === 'chat' && !isAccepted && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Hash size={40} color="var(--z-muted)" style={{ opacity: 0.3, marginBottom: 12 }} />
            <p style={{ color: 'var(--z-muted)', fontSize: 14 }}>Group chat is only available to accepted participants.</p>
          </div>
        )}
      </div>
    </div>
  )
}
