import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getSocket, disconnectSocket } from '@/lib/socket'
import { useAuthStore } from '@/store/authStore'
import type { Message, GroupMessage } from '@/types/message.types'
import type { Notification } from '@/api/notifications.api'

/**
 * Connects to the /messaging WebSocket namespace and wires all server-emitted
 * events into the React Query cache so every subscriber re-renders automatically.
 *
 * Events handled:
 *  - newMessage             → appends to ['messages', conversationId]
 *  - newGroupMessage        → appends to ['groupMessages', eventId]
 *  - messageDeleted         → removes from ['messages', conversationId]
 *  - eventJoinRequest       → invalidates ['events', 'participants']
 *  - participantStatusUpdate → invalidates ['events'] + appends a notification
 *
 * Call once at the top of the authenticated layout (AppLayout).
 */
export function useSocket() {
  const qc = useQueryClient()
  const accessToken = useAuthStore((s) => s.accessToken)
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null)

  useEffect(() => {
    if (!accessToken) return

    const sock = getSocket(accessToken)
    socketRef.current = sock

    // ── newMessage ──────────────────────────────────────────────
    sock.on('newMessage', (message: Message) => {
      qc.setQueryData<Message[]>(
        ['messages', message.conversation_id],
        (prev = []) => {
          if (prev.some((m) => m.id === message.id)) return prev
          return [...prev, message]
        },
      )
      // Bubble the conversation list to the top
      qc.invalidateQueries({ queryKey: ['conversations'] })
    })

    // ── newGroupMessage ─────────────────────────────────────────
    sock.on('newGroupMessage', (message: GroupMessage) => {
      qc.setQueryData<GroupMessage[]>(
        ['groupMessages', message.event_id],
        (prev = []) => {
          if (prev.some((m) => m.id === message.id)) return prev
          return [...prev, message]
        },
      )
    })

    // ── messageDeleted ──────────────────────────────────────────
    sock.on('messageDeleted', ({ messageId }: { messageId: string }) => {
      // Mark is_deleted on every conversation messages cache that has it
      qc.getQueriesData<Message[]>({ queryKey: ['messages'] }).forEach(([key, msgs]) => {
        if (!msgs) return
        qc.setQueryData<Message[]>(key, msgs.map((m) =>
          m.id === messageId ? { ...m, is_deleted: true, content: '🚫 Message deleted' } : m,
        ))
      })
    })

    // ── eventJoinRequest ────────────────────────────────────────
    sock.on(
      'eventJoinRequest',
      (data: { eventId: string; userId: string; userName: string; eventTitle: string }) => {
        qc.invalidateQueries({ queryKey: ['events', data.eventId, 'participants'] })
        // Inject a transient notification into the notifications cache
        qc.setQueryData<Notification[]>(['notifications'], (prev = []) => [
          {
            id: `join-${data.userId}-${Date.now()}`,
            user_id: data.userId,
            title: 'New join request',
            body: `${data.userName} wants to join "${data.eventTitle}"`,
            is_read: false,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ])
      },
    )

    // ── participantStatusUpdate ─────────────────────────────────
    sock.on(
      'participantStatusUpdate',
      (data: { eventId: string; eventTitle: string; status: string }) => {
        qc.invalidateQueries({ queryKey: ['events', data.eventId] })
        qc.invalidateQueries({ queryKey: ['events', 'my'] })
        qc.setQueryData<Notification[]>(['notifications'], (prev = []) => [
          {
            id: `status-${data.eventId}-${Date.now()}`,
            user_id: '',
            title: 'Participation update',
            body: `Your request for "${data.eventTitle}" was ${data.status}`,
            is_read: false,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ])
      },
    )

    return () => {
      sock.off('newMessage')
      sock.off('newGroupMessage')
      sock.off('messageDeleted')
      sock.off('eventJoinRequest')
      sock.off('participantStatusUpdate')
    }
  }, [accessToken, qc])

  // Disconnect on logout (token gone)
  useEffect(() => {
    if (!accessToken) disconnectSocket()
  }, [accessToken])

  return socketRef
}
