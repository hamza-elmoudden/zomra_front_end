import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  MessageCircle, Send, ArrowLeft, Trash2,
  Users, Wifi, WifiOff, Hash,
} from 'lucide-react'
import {
  getConversations,
  getMessages,
  sendMessage,
  deleteMessage,
  getGroupMessages,
  sendGroupMessage,
} from '@/api/messaging.api'
import { getUserById } from '@/api/users.api'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { getSocket } from '@/lib/socket'
import type { Message, GroupMessage } from '@/types/message.types'
import { formatDate } from '@/lib/utils'

const GRADIENTS = [
  'linear-gradient(135deg,#6c5ce7,#a29bfe)',
  'linear-gradient(135deg,#fd79a8,#e17055)',
  'linear-gradient(135deg,#00cec9,#55efc4)',
  'linear-gradient(135deg,#fdcb6e,#e17055)',
  'linear-gradient(135deg,#74b9ff,#0984e3)',
]
function colorFor(id: string) {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  return GRADIENTS[Math.abs(h) % GRADIENTS.length]
}
function getInitials(name?: string) {
  if (!name) return '?'
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function OtherUserName({ userId }: { userId: string }) {
  const { data } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUserById(userId),
    staleTime: 5 * 60_000,
  })
  return <>{data?.full_name ?? data?.username ?? userId.slice(0, 8) + '…'}</>
}

// ── Tab types ─────────────────────────────────────────────────
type ActiveThread =
  | { type: 'dm'; convId: string }
  | { type: 'group'; eventId: string; eventTitle?: string }

export default function MessagingPage() {
  const { user } = useAuth()
  const accessToken = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Support ?conv=<id> and ?event=<id> URL params
  const initialConv = searchParams.get('conv')
  const initialEvent = searchParams.get('event')
  const initialEventTitle = searchParams.get('eventTitle') ?? undefined

  const [active, setActive] = useState<ActiveThread | null>(
    initialEvent
      ? { type: 'group', eventId: initialEvent, eventTitle: initialEventTitle }
      : initialConv
      ? { type: 'dm', convId: initialConv }
      : null,
  )
  const activeRef = useRef(active)
  useEffect(() => { activeRef.current = active }, [active])

  const [draft, setDraft] = useState('')
  const [socketConnected, setSocketConnected] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // ── Socket connection indicator ───────────────────────────────
  useEffect(() => {
    if (!accessToken) return
    const sock = getSocket(accessToken)
    const onConnect = () => setSocketConnected(true)
    const onDisconnect = () => setSocketConnected(false)
    sock.on('connect', onConnect)
    sock.on('disconnect', onDisconnect)
    setSocketConnected(sock.connected)
    return () => { sock.off('connect', onConnect); sock.off('disconnect', onDisconnect) }
  }, [accessToken])

  // ── Join / leave socket rooms ─────────────────────────────────
  useEffect(() => {
    if (!active || !accessToken) return
    const sock = getSocket(accessToken)

    let joined = false
    const join = () => {
      if (active.type === 'dm') {
        sock.emit('joinConversation', { conversationId: active.convId })
      } else {
        sock.emit('joinEventRoom', { eventId: active.eventId })
      }
      joined = true
    }

    if (sock.connected) {
      join()
    } else {
      sock.once('connect', join)
    }

    return () => {
      sock.off('connect', join)
      if (joined) {
        if (active.type === 'dm') {
          sock.emit('leaveConversation', { conversationId: active.convId })
        } else {
          sock.emit('leaveEventRoom', { eventId: active.eventId })
        }
      }
    }
  }, [active, accessToken])

  // ── Data: conversations list ──────────────────────────────────
  const { data: conversations = [], isLoading: loadingConvs } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
  })

  // ── Data: DM messages ─────────────────────────────────────────
  const convId = active?.type === 'dm' ? active.convId : null
  const { data: dmMessages = [], isLoading: loadingDm } = useQuery({
    queryKey: ['messages', convId],
    queryFn: () => getMessages(convId!),
    enabled: !!convId,
  })

  // ── Data: Group messages ──────────────────────────────────────
  const eventId = active?.type === 'group' ? active.eventId : null
  const { data: groupMessages = [], isLoading: loadingGroup } = useQuery({
    queryKey: ['groupMessages', eventId],
    queryFn: () => getGroupMessages(eventId!),
    enabled: !!eventId,
  })

  const messages = active?.type === 'dm' ? dmMessages : groupMessages
  const loadingMsgs = active?.type === 'dm' ? loadingDm : loadingGroup

  // ── Active DM conversation meta ───────────────────────────────
  const activeConv = active?.type === 'dm'
    ? conversations.find((c) => c.id === active.convId)
    : null
  const otherUserId = activeConv
    ? activeConv.user_1_id === user?.id ? activeConv.user_2_id : activeConv.user_1_id
    : null
  const { data: otherUser } = useQuery({
    queryKey: ['user', otherUserId],
    queryFn: () => getUserById(otherUserId!),
    enabled: !!otherUserId,
    staleTime: 5 * 60_000,
  })

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // ── Send DM ───────────────────────────────────────────────────
  const sendDmMutation = useMutation({
    mutationFn: (content: string) => sendMessage(activeRef.current!.type === 'dm' ? (activeRef.current as any).convId : '', content),
    onSuccess: (msg) => {
      const cid = activeRef.current?.type === 'dm' ? (activeRef.current as any).convId : null
      qc.setQueryData<Message[]>(['messages', cid], (prev = []) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
      )
      qc.invalidateQueries({ queryKey: ['conversations'] })
      setDraft('')
    },
  })

  // ── Send Group Message ─────────────────────────────────────────
  const sendGroupMutation = useMutation({
    mutationFn: (content: string) => sendGroupMessage(activeRef.current?.type === 'group' ? (activeRef.current as any).eventId : '', content),
    onSuccess: (msg) => {
      const eid = activeRef.current?.type === 'group' ? (activeRef.current as any).eventId : null
      qc.setQueryData<GroupMessage[]>(['groupMessages', eid], (prev = []) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
      )
      setDraft('')
    },
  })

  // ── Delete DM ─────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: deleteMessage,
    onSuccess: (_, messageId) => {
      const cid = activeRef.current?.type === 'dm' ? (activeRef.current as any).convId : null
      qc.setQueryData<Message[]>(['messages', cid], (prev = []) =>
        prev.map((m) => m.id === messageId ? { ...m, is_deleted: true, content: '🚫 Message deleted' } : m),
      )
    },
  })

  function handleSend() {
    const t = draft.trim()
    if (!t || !active) return
    if (active.type === 'dm') sendDmMutation.mutate(t)
    else sendGroupMutation.mutate(t)
  }

  const isPending = sendDmMutation.isPending || sendGroupMutation.isPending

  function unreadCount(cid: string) {
    const msgs = qc.getQueryData<Message[]>(['messages', cid]) ?? []
    return msgs.filter((m) => !m.is_read && m.sender_id !== user?.id).length
  }

  // ── Back: go to list or navigate(-1) if came from URL param ──
  function handleBack() {
    if (initialConv || initialEvent) {
      navigate(-1)
    } else {
      setActive(null)
    }
  }

  const headerTitle = active?.type === 'group'
    ? (active.eventTitle ?? 'Group Chat')
    : otherUser?.full_name ?? otherUser?.username ?? (otherUserId ? '…' : '')

  return (
    <div style={{ minHeight: '100%', background: 'var(--z-bg)', display: 'flex', height: 'calc(100vh - 64px)' }}>

      {/* ── Conversation list ──────────────────────────────────── */}
      <div style={{
        width: active ? 0 : '100%',
        maxWidth: 420,
        borderRight: '1px solid var(--z-border)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', flexShrink: 0,
        transition: 'width 0.2s',
      }}>
        <div style={{ padding: '20px 20px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: 'var(--z-text)', letterSpacing: '-0.5px' }}>
              Messages
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: socketConnected ? 'var(--z-mint)' : 'var(--z-coral)' }}>
              {socketConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
              {socketConnected ? 'Live' : 'Offline'}
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--z-muted)' }}>
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div style={{ padding: '10px 20px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--z-surface2)', border: '1px solid var(--z-border)', borderRadius: 10, padding: '9px 12px' }}>
            <MessageCircle size={15} style={{ color: 'var(--z-muted)', flexShrink: 0 }} />
            <input placeholder="Search…" style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, color: 'var(--z-text)', fontFamily: 'inherit' }} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingConvs && <p style={{ padding: 20, color: 'var(--z-muted)', fontSize: 13 }}>Loading…</p>}
          {!loadingConvs && conversations.length === 0 && (
            <p style={{ padding: 20, color: 'var(--z-muted)', fontSize: 13 }}>No conversations yet.</p>
          )}
          {conversations.map((c) => {
            const otherId = c.user_1_id === user?.id ? c.user_2_id : c.user_1_id
            const badge = unreadCount(c.id)
            const isActive = active?.type === 'dm' && active.convId === c.id
            return (
              <div
                key={c.id}
                onClick={() => setActive({ type: 'dm', convId: c.id })}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', cursor: 'pointer', background: isActive ? 'rgba(255,255,255,0.04)' : 'transparent', transition: 'background 0.1s' }}
                onMouseOver={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.025)' }}
                onMouseOut={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 46, height: 46, borderRadius: '50%', background: colorFor(otherId), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white' }}>
                    {otherId.slice(0, 2).toUpperCase()}
                  </div>
                  {badge > 0 && (
                    <span style={{ position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16, borderRadius: 8, background: 'var(--z-accent2)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', border: '1.5px solid var(--z-bg)' }}>
                      {badge}
                    </span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: badge > 0 ? 600 : 500, color: 'var(--z-text)', marginBottom: 2 }}>
                    <OtherUserName userId={otherId} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--z-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.event_id ? '📅 Event chat' : 'Direct message'}
                    {c.last_message_at && ` · ${formatDate(c.last_message_at)}`}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Active thread ──────────────────────────────────────── */}
      {active && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid var(--z-border)', background: 'var(--z-surface)', flexShrink: 0 }}>
            <button
              onClick={handleBack}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--z-muted)', display: 'flex', borderRadius: 8, flexShrink: 0 }}
              title="Back"
            >
              <ArrowLeft size={18} />
            </button>

            {/* Avatar */}
            {active.type === 'group' ? (
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6c5ce7,#00cec9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Hash size={16} color="white" />
              </div>
            ) : otherUserId ? (
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: colorFor(otherUserId), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0, overflow: 'hidden' }}>
                {otherUser?.avatar_url
                  ? <img src={otherUser.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : getInitials(otherUser?.full_name ?? otherUser?.username)}
              </div>
            ) : null}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: 'var(--z-text)', fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {active.type === 'group'
                  ? (active.eventTitle ?? 'Group Chat')
                  : (otherUser?.full_name ?? otherUser?.username ?? (otherUserId ? <OtherUserName userId={otherUserId} /> : '…'))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--z-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                {active.type === 'group'
                  ? <><Users size={10} /> Event group chat</>
                  : <><MessageCircle size={10} /> Direct message</>}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: socketConnected ? 'var(--z-mint)' : 'var(--z-coral)', flexShrink: 0 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: socketConnected ? 'var(--z-mint)' : 'var(--z-coral)', display: 'inline-block' }} />
              {socketConnected ? 'Live' : 'Reconnecting…'}
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loadingMsgs && <p style={{ color: 'var(--z-muted)', fontSize: 13 }}>Loading…</p>}
            {!loadingMsgs && messages.length === 0 && (
              <div style={{ textAlign: 'center', marginTop: 60 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>
                  {active.type === 'group' ? '👥' : '💬'}
                </div>
                <p style={{ color: 'var(--z-muted)', fontSize: 14 }}>
                  {active.type === 'group' ? 'No group messages yet. Start the conversation!' : 'No messages yet. Say hello! 👋'}
                </p>
              </div>
            )}
            {messages.map((m) => {
              const isMe = m.sender_id === user?.id
              const deleted = (m as Message).is_deleted ?? false
              return (
                <div key={m.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', gap: 6, alignItems: 'flex-end' }}>
                  {/* Avatar for group messages from others */}
                  {active.type === 'group' && !isMe && (
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: colorFor(m.sender_id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                      {m.sender_id.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div style={{
                    maxWidth: '72%',
                    background: deleted ? 'rgba(255,255,255,0.04)' : isMe ? 'var(--z-accent2)' : 'var(--z-surface2)',
                    color: deleted ? 'var(--z-muted)' : isMe ? '#fff' : 'var(--z-text)',
                    borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    padding: '9px 13px',
                    fontSize: deleted ? 13 : 14,
                    fontStyle: deleted ? 'italic' : 'normal',
                    lineHeight: 1.45,
                    wordBreak: 'break-word',
                    border: deleted ? '1px solid var(--z-border)' : 'none',
                  }}>
                    {active.type === 'group' && !isMe && (
                      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--z-accent2)', marginBottom: 3 }}>
                        <OtherUserName userId={m.sender_id} />
                      </div>
                    )}
                    {m.content}
                  </div>
                  {active.type === 'dm' && isMe && !deleted && (
                    <button
                      onClick={() => deleteMutation.mutate(m.id)}
                      disabled={deleteMutation.isPending}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--z-muted)', padding: 2, display: 'flex', opacity: 0.45, flexShrink: 0 }}
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--z-border)', display: 'flex', gap: 8, background: 'var(--z-surface)', flexShrink: 0 }}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder={active.type === 'group' ? 'Message the group…' : 'Type a message…'}
              style={{ flex: 1, background: 'var(--z-surface2)', border: '1px solid var(--z-border)', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: 'var(--z-text)', fontFamily: 'inherit', outline: 'none' }}
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim() || isPending}
              style={{ background: 'var(--z-accent2)', border: 'none', borderRadius: 10, padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontSize: 14, fontWeight: 600, opacity: !draft.trim() || isPending ? 0.5 : 1, transition: 'opacity 0.15s' }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!active && conversations.length > 0 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--z-muted)' }}>
          <MessageCircle size={40} style={{ opacity: 0.25 }} />
          <p style={{ fontSize: 14 }}>Select a conversation to start chatting</p>
        </div>
      )}
    </div>
  )
}
