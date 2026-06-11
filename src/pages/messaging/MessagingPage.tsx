import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageCircle, Send, ArrowLeft, Trash2 } from 'lucide-react'
import {
  getConversations,
  getMessages,
  sendMessage,
  deleteMessage,
  createConversation,
} from '@/api/messaging.api'
import { getUserById } from '@/api/users.api'
import { useAuth } from '@/hooks/useAuth'

function getInitials(name?: string): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const GRADIENT_COLORS = [
  'linear-gradient(135deg,#6c5ce7,#a29bfe)',
  'linear-gradient(135deg,#fd79a8,#e17055)',
  'linear-gradient(135deg,#00cec9,#55efc4)',
  'linear-gradient(135deg,#fdcb6e,#e17055)',
  'linear-gradient(135deg,#74b9ff,#0984e3)',
]

function colorFor(id: string): string {
  let hash = 0
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff
  return GRADIENT_COLORS[Math.abs(hash) % GRADIENT_COLORS.length]
}

export default function MessagingPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  const { data: conversations = [], isLoading: loadingConvs } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
  })

  const { data: messages = [], isLoading: loadingMsgs } = useQuery({
    queryKey: ['messages', activeConvId],
    queryFn: () => getMessages(activeConvId!),
    enabled: !!activeConvId,
  })

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

  const sendMutation = useMutation({
    mutationFn: (content: string) => sendMessage(activeConvId!, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', activeConvId] })
      setDraft('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMessage,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages', activeConvId] }),
  })

  function handleSend() {
    const trimmed = draft.trim()
    if (!trimmed || !activeConvId) return
    sendMutation.mutate(trimmed)
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--z-bg)', display: 'flex', height: 'calc(100vh - 64px)' }}>
      {/* Conversation list */}
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
            <input placeholder="Search messages…" style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, color: 'var(--z-text)', fontFamily: 'inherit' }} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingConvs && (
            <p style={{ padding: '20px', color: 'var(--z-muted)', fontSize: 13 }}>Loading…</p>
          )}
          {!loadingConvs && conversations.length === 0 && (
            <p style={{ padding: '20px', color: 'var(--z-muted)', fontSize: 13 }}>No conversations yet.</p>
          )}
          {conversations.map((c) => {
            const otherId = c.user_1_id === user?.id ? c.user_2_id : c.user_1_id
            return (
              <div
                key={c.id}
                onClick={() => setActiveConvId(c.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', cursor: 'pointer', background: activeConvId === c.id ? 'rgba(255,255,255,0.04)' : 'transparent', transition: 'background 0.1s' }}
                onMouseOver={(e) => { if (activeConvId !== c.id) e.currentTarget.style.background = 'rgba(255,255,255,0.025)' }}
                onMouseOut={(e) => { if (activeConvId !== c.id) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: colorFor(otherId), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                  {otherId.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--z-text)' }}>
                      {c.event_id ? `Event: ${c.event_id.slice(0, 8)}…` : `User ${otherId.slice(0, 8)}…`}
                    </span>
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--z-muted)' }}>Tap to open</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Message thread */}
      {activeConvId && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid var(--z-border)', background: 'var(--z-surface)' }}>
            <button onClick={() => setActiveConvId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--z-muted)', display: 'flex' }}>
              <ArrowLeft size={18} />
            </button>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: colorFor(otherUserId ?? ''), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white' }}>
              {getInitials(otherUser?.full_name)}
            </div>
            <span style={{ fontWeight: 600, color: 'var(--z-text)', fontSize: 15 }}>
              {otherUser?.full_name ?? otherUserId?.slice(0, 12) + '…'}
            </span>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loadingMsgs && <p style={{ color: 'var(--z-muted)', fontSize: 13 }}>Loading…</p>}
            {!loadingMsgs && messages.length === 0 && (
              <p style={{ color: 'var(--z-muted)', fontSize: 13 }}>No messages yet. Say hello!</p>
            )}
            {messages.map((m) => {
              const isMe = m.sender_id === user?.id
              return (
                <div key={m.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', gap: 6, alignItems: 'flex-end' }}>
                  <div style={{
                    maxWidth: '72%',
                    background: isMe ? 'var(--z-accent2)' : 'var(--z-surface2)',
                    color: isMe ? '#fff' : 'var(--z-text)',
                    borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    padding: '9px 13px',
                    fontSize: 14,
                    lineHeight: 1.4,
                    wordBreak: 'break-word',
                  }}>
                    {m.content}
                  </div>
                  {isMe && (
                    <button
                      onClick={() => deleteMutation.mutate(m.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--z-muted)', padding: 2, display: 'flex', opacity: 0.5 }}
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Input */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--z-border)', display: 'flex', gap: 8, background: 'var(--z-surface)' }}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Type a message…"
              style={{ flex: 1, background: 'var(--z-surface2)', border: '1px solid var(--z-border)', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: 'var(--z-text)', fontFamily: 'inherit', outline: 'none' }}
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim() || sendMutation.isPending}
              style={{ background: 'var(--z-accent2)', border: 'none', borderRadius: 10, padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontSize: 14, fontWeight: 600, opacity: !draft.trim() ? 0.5 : 1 }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Empty state when no convo selected on wide screens */}
      {!activeConvId && conversations.length > 0 && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--z-muted)', fontSize: 14 }}>
          Select a conversation
        </div>
      )}
    </div>
  )
}
