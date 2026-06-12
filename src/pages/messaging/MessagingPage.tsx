import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageCircle, Send, ArrowLeft, Trash2, Users } from 'lucide-react'
import {
  getConversations,
  getMessages,
  sendMessage,
  deleteMessage,
} from '@/api/messaging.api'
import { getUserById } from '@/api/users.api'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { getSocket } from '@/lib/socket'
import type { Message } from '@/types/message.types'
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
function initials(name?: string) {
  if (!name) return '?'
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

// ── OtherUserName — fetches lazily ───────────────────────────
function OtherUserName({ userId }: { userId: string }) {
  const { data } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUserById(userId),
    staleTime: 5 * 60_000,
  })
  return <>{data?.full_name ?? data?.username ?? userId.slice(0, 8) + '…'}</>
}

export default function MessagingPage() {
  const { user } = useAuth()
  const accessToken = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // ── Conversations ────────────────────────────────────────────
  const { data: conversations = [], isLoading: loadingConvs } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
  })

  // ── Messages for active conversation ────────────────────────
  const { data: messages = [], isLoading: loadingMsgs } = useQuery({
    queryKey: ['messages', activeConvId],
    queryFn: () => getMessages(activeConvId!),
    enabled: !!activeConvId,
  })

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Socket room management ───────────────────────────────────
  useEffect(() => {
    if (!activeConvId || !accessToken) return
    const sock = getSocket(accessToken)

    sock.emit('joinConversation', { conversationId: activeConvId })

    return () => {
      sock.emit('leaveConversation', { conversationId: activeConvId })
    }
  }, [activeConvId, accessToken])

  // ── Active conversation meta ─────────────────────────────────
  const activeConv = conversations.find((c) => c.id === activeConvId)
  const otherUserId = activeConv
    ? activeConv.user_1_id === user?.id
      ? activeConv.user_2_id
      : activeConv.user_1_id
    : null

  const { data: otherUser } = useQuery({
    queryKey: ['user', otherUserId],
    queryFn: () => getUserById(otherUserId!),
    enabled: !!otherUserId,
  })

  // ── Send message ─────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: (content: string) => sendMessage(activeConvId!, content),
    onSuccess: (msg) => {
      // Optimistically update cache (socket will also push it)
      qc.setQueryData<Message[]>(['messages', activeConvId], (prev = []) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
      )
      qc.invalidateQueries({ queryKey: ['conversations'] })
      setDraft('')
    },
  })

  // ── Delete message ───────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: deleteMessage,
    onSuccess: (_, messageId) => {
      qc.setQueryData<Message[]>(['messages', activeConvId], (prev = []) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, is_deleted: true, content: '🚫 Message deleted' }
            : m,
        ),
      )
    },
  })

  function handleSend() {
    const t = draft.trim()
    if (!t || !activeConvId || sendMutation.isPending) return
    sendMutation.mutate(t)
  }

  // ── Unread badge per conversation ────────────────────────────
  // (backend doesn't track per-conv unread in REST; use is_read flag from messages cache)
  function unreadCount(convId: string) {
    const msgs = qc.getQueryData<Message[]>(['messages', convId]) ?? []
    return msgs.filter((m) => !m.is_read && m.sender_id !== user?.id).length
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--z-bg)', display: 'flex', height: 'calc(100vh - 64px)' }}>

      {/* ── Conversation list ──────────────────────────────────── */}
      <div style={{
        width: activeConvId ? 0 : '100%',
        maxWidth: 420,
        borderRight: '1px solid var(--z-border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
        transition: 'width 0.2s',
      }}>
        <div style={{ padding: '20px 20px 8px' }}>
          <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: 'var(--z-text)', letterSpacing: '-0.5px', marginBottom: 4 }}>
            Messages
          </h1>
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
            const isActive = activeConvId === c.id
            return (
              <div
                key={c.id}
                onClick={() => setActiveConvId(c.id)}
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
                    {c.event_id ? `📅 Event chat` : `Tap to open`}
                    {c.last_message_at && ` · ${formatDate(c.last_message_at)}`}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Message thread ─────────────────────────────────────── */}
      {activeConvId && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid var(--z-border)', background: 'var(--z-surface)' }}>
            <button onClick={() => setActiveConvId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--z-muted)', display: 'flex' }}>
              <ArrowLeft size={18} />
            </button>
            {otherUserId && (
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: colorFor(otherUserId), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0, overflow: 'hidden' }}>
                {otherUser?.avatar_url
                  ? <img src={otherUser.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initials(otherUser?.full_name)}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: 'var(--z-text)', fontSize: 15 }}>
                {otherUser?.full_name ?? otherUser?.username ?? <OtherUserName userId={otherUserId ?? ''} />}
              </div>
              {activeConv?.event_id && (
                <div style={{ fontSize: 11, color: 'var(--z-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Users size={10} /> Event chat
                </div>
              )}
            </div>
            {/* Live indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--z-mint)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--z-mint)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              Live
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loadingMsgs && <p style={{ color: 'var(--z-muted)', fontSize: 13 }}>Loading…</p>}
            {!loadingMsgs && messages.length === 0 && (
              <p style={{ color: 'var(--z-muted)', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
                No messages yet. Say hello! 👋
              </p>
            )}
            {messages.map((m) => {
              const isMe = m.sender_id === user?.id
              const deleted = m.is_deleted
              return (
                <div key={m.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', gap: 6, alignItems: 'flex-end' }}>
                  <div style={{
                    maxWidth: '72%',
                    background: deleted
                      ? 'rgba(255,255,255,0.04)'
                      : isMe
                      ? 'var(--z-accent2)'
                      : 'var(--z-surface2)',
                    color: deleted ? 'var(--z-muted)' : isMe ? '#fff' : 'var(--z-text)',
                    borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    padding: '9px 13px',
                    fontSize: deleted ? 13 : 14,
                    fontStyle: deleted ? 'italic' : 'normal',
                    lineHeight: 1.45,
                    wordBreak: 'break-word',
                    border: deleted ? '1px solid var(--z-border)' : 'none',
                  }}>
                    {m.content}
                  </div>
                  {isMe && !deleted && (
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
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--z-border)', display: 'flex', gap: 8, background: 'var(--z-surface)' }}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Type a message…"
              style={{ flex: 1, background: 'var(--z-surface2)', border: '1px solid var(--z-border)', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: 'var(--z-text)', fontFamily: 'inherit', outline: 'none' }}
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim() || sendMutation.isPending}
              style={{ background: 'var(--z-accent2)', border: 'none', borderRadius: 10, padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontSize: 14, fontWeight: 600, opacity: !draft.trim() || sendMutation.isPending ? 0.5 : 1, transition: 'opacity 0.15s' }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Wide-screen empty state */}
      {!activeConvId && conversations.length > 0 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--z-muted)' }}>
          <MessageCircle size={40} style={{ opacity: 0.25 }} />
          <p style={{ fontSize: 14 }}>Select a conversation to start chatting</p>
        </div>
      )}
    </div>
  )
}
