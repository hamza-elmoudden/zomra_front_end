import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { manageParticipant } from '@/api/events.api'
import { getUserById } from '@/api/users.api'
import { createConversation } from '@/api/messaging.api'
import { useAuthStore } from '@/store/authStore'
import { Check, X, MessageCircle, UserCircle } from 'lucide-react'
import type { EventParticipant } from '@/types/event.types'

const AVATAR_COLORS = ['#6c5ce7','#fd79a8','#00cec9','#0984e3','#e17055','#a29bfe','#fdcb6e']

interface ParticipantListProps {
  eventId: string
  hostId: string
  participants: EventParticipant[]
}

// ── Mini component: resolves a userId to display name ─────────
function ParticipantRow({
  participant,
  isHost,
  isSelf,
  color,
  onAccept,
  onReject,
  onMessage,
  onViewProfile,
  accepting,
  rejecting,
}: {
  participant: EventParticipant
  isHost: boolean
  isSelf: boolean
  color: string
  onAccept?: () => void
  onReject?: () => void
  onMessage: () => void
  onViewProfile: () => void
  accepting: boolean
  rejecting: boolean
}) {
  const { data: user } = useQuery({
    queryKey: ['user', participant.user_id],
    queryFn: () => getUserById(participant.user_id),
    staleTime: 5 * 60_000,
  })

  const displayName = isSelf
    ? 'You'
    : user?.full_name ?? user?.username ?? participant.user_id.slice(0, 8) + '…'

  const avatarInitials = isSelf
    ? 'Me'
    : (user?.full_name ?? user?.username ?? participant.user_id)
        .split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)

  if (participant.status === 'pending' && isHost) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'rgba(255,234,167,0.07)',
        border: '1px solid rgba(255,234,167,0.14)',
        borderRadius: 10, padding: '10px 14px',
      }}>
        {/* Avatar */}
        <div
          onClick={onViewProfile}
          style={{ width: 36, height: 36, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0, cursor: 'pointer', overflow: 'hidden' }}
        >
          {user?.avatar_url
            ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : avatarInitials}
        </div>

        {/* Name + username */}
        <div
          onClick={onViewProfile}
          role="button"
          style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--z-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName}
          </div>
          {user?.username && !isSelf && (
            <div style={{ fontSize: 11, color: 'var(--z-muted)' }}>@{user.username}</div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            onClick={onMessage}
            style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(108,92,231,0.15)', border: '1px solid rgba(108,92,231,0.3)', color: 'var(--z-accent2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Message"
          >
            <MessageCircle size={12} />
          </button>
          <button
            onClick={onAccept}
            disabled={accepting}
            style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,206,201,0.15)', border: '1px solid rgba(0,206,201,0.3)', color: 'var(--z-mint)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Accept"
          >
            <Check size={13} />
          </button>
          <button
            onClick={onReject}
            disabled={rejecting}
            style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.25)', color: 'var(--z-coral)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Reject"
          >
            <X size={13} />
          </button>
        </div>
      </div>
    )
  }

  // Accepted pill (shown in the grid)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }} onClick={onViewProfile}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', overflow: 'hidden', border: isSelf ? '2px solid var(--z-accent2)' : '2px solid transparent' }}>
          {user?.avatar_url
            ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : avatarInitials}
        </div>
        {!isSelf && (
          <button
            onClick={(e) => { e.stopPropagation(); onMessage() }}
            style={{ position: 'absolute', bottom: -2, right: -4, width: 18, height: 18, borderRadius: '50%', background: 'var(--z-accent2)', border: '1.5px solid var(--z-bg)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
            title={`Message ${displayName}`}
          >
            <MessageCircle size={9} />
          </button>
        )}
      </div>
      <span style={{ fontSize: 10, color: 'var(--z-muted)', maxWidth: 52, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {displayName}
      </span>
    </div>
  )
}

export default function ParticipantList({ eventId, hostId, participants }: ParticipantListProps) {
  const userId = useAuthStore((s) => s.user?.id)
  const isHost = userId === hostId
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['event', eventId, 'participants'] })
    queryClient.invalidateQueries({ queryKey: ['event', eventId] })
  }

  const acceptMutation = useMutation({ mutationFn: (uid: string) => manageParticipant(eventId, uid, 'accept'), onSuccess: invalidate })
  const rejectMutation = useMutation({ mutationFn: (uid: string) => manageParticipant(eventId, uid, 'reject'), onSuccess: invalidate })

  const convMutation = useMutation({
    mutationFn: (recipientId: string) => createConversation({ recipientId }),
    onSuccess: (conv) => navigate(`/messages?conv=${conv.id}`),
  })

  const accepted = participants.filter((p) => p.status === 'accepted')
  const pending  = participants.filter((p) => p.status === 'pending')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Accepted grid */}
      {accepted.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {accepted.map((p, i) => (
            <ParticipantRow
              key={p.id}
              participant={p}
              isHost={isHost}
              isSelf={p.user_id === userId}
              color={AVATAR_COLORS[i % AVATAR_COLORS.length]}
              onMessage={() => convMutation.mutate(p.user_id)}
              onViewProfile={() => navigate(`/users/${p.user_id}`)}
              accepting={false}
              rejecting={false}
            />
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 13, color: 'var(--z-muted)' }}>No participants yet.</p>
      )}

      {/* Pending requests (host only) */}
      {isHost && pending.length > 0 && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#ffeaa7', marginBottom: 10 }}>
            Pending Requests ({pending.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pending.map((p, i) => (
              <ParticipantRow
                key={p.id}
                participant={p}
                isHost={isHost}
                isSelf={p.user_id === userId}
                color={AVATAR_COLORS[i % AVATAR_COLORS.length]}
                onMessage={() => convMutation.mutate(p.user_id)}
                onViewProfile={() => navigate(`/users/${p.user_id}`)}
                onAccept={() => acceptMutation.mutate(p.user_id)}
                onReject={() => rejectMutation.mutate(p.user_id)}
                accepting={acceptMutation.isPending && acceptMutation.variables === p.user_id}
                rejecting={rejectMutation.isPending && rejectMutation.variables === p.user_id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
