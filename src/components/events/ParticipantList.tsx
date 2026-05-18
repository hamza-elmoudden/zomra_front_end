import { useMutation, useQueryClient } from '@tanstack/react-query'
import { manageParticipant } from '@/api/events.api'
import { useAuthStore } from '@/store/authStore'
import { Check, X } from 'lucide-react'
import type { EventParticipant } from '@/types/event.types'

const AVATAR_COLORS = ['#6c5ce7','#fd79a8','#00cec9','#0984e3','#e17055','#a29bfe','#fdcb6e']

interface ParticipantListProps {
  eventId: string
  hostId: string
  participants: EventParticipant[]
}

export default function ParticipantList({ eventId, hostId, participants }: ParticipantListProps) {
  const userId = useAuthStore((s) => s.user?.id)
  const isHost = userId === hostId
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['event', eventId, 'participants'] })
    queryClient.invalidateQueries({ queryKey: ['event', eventId] })
  }

  const acceptMutation = useMutation({ mutationFn: (uid: string) => manageParticipant(eventId, uid, 'accept'), onSuccess: invalidate })
  const rejectMutation = useMutation({ mutationFn: (uid: string) => manageParticipant(eventId, uid, 'reject'), onSuccess: invalidate })

  const accepted = participants.filter((p) => p.status === 'accepted')
  const pending = participants.filter((p) => p.status === 'pending')

  const initials = (uid: string) => uid === userId ? 'Me' : uid.slice(0, 2).toUpperCase()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {accepted.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {accepted.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: AVATAR_COLORS[i % AVATAR_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', fontFamily: '"Sora",sans-serif' }}>
                {initials(p.user_id)}
              </div>
              <span style={{ fontSize: 10, color: 'var(--z-muted)' }}>{p.user_id === userId ? 'You' : `User`}</span>
            </div>
          ))}
        </div>
      )}
      {accepted.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--z-muted)' }}>No participants yet.</p>
      )}

      {isHost && pending.length > 0 && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#ffeaa7', marginBottom: 10 }}>
            Pending Requests ({pending.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pending.map((p) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,234,167,0.08)', border: '1px solid rgba(255,234,167,0.15)', borderRadius: 10, padding: '10px 14px' }}>
                <span style={{ fontSize: 13, color: 'var(--z-text)' }}>{p.user_id}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => acceptMutation.mutate(p.user_id)} disabled={acceptMutation.isPending} style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,206,201,0.15)', border: '1px solid rgba(0,206,201,0.3)', color: 'var(--z-mint)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Accept">
                    <Check size={13} />
                  </button>
                  <button onClick={() => rejectMutation.mutate(p.user_id)} disabled={rejectMutation.isPending} style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.25)', color: 'var(--z-coral)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Reject">
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
