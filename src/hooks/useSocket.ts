import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getSocket, disconnectSocket } from '@/lib/socket'
import { useAuthStore } from '@/store/authStore'
import { getUserById } from '@/api/users.api'
import type { Message, GroupMessage } from '@/types/message.types'
import type { Notification } from '@/api/notifications.api'

export function useSocket() {
  const qc = useQueryClient()
  const accessToken = useAuthStore((s) => s.accessToken)

  useEffect(() => {
    if (!accessToken) return

    const sock = getSocket(accessToken)

    // ── Define named handlers so we can remove exactly these ──

    function onNewMessage(message: Message) {
      qc.setQueryData<Message[]>(
        ['messages', message.conversation_id],
        (prev = []) => {
          if (prev.some((m) => m.id === message.id)) return prev
          return [...prev, message]
        },
      )
      qc.invalidateQueries({ queryKey: ['conversations'] })
    }

    function onNewGroupMessage(message: GroupMessage) {
      qc.setQueryData<GroupMessage[]>(
        ['groupMessages', message.event_id],
        (prev = []) => {
          if (prev.some((m) => m.id === message.id)) return prev
          return [...prev, message]
        },
      )
    }

    function onMessageDeleted({ messageId }: { messageId: string }) {
      qc.getQueriesData<Message[]>({ queryKey: ['messages'] }).forEach(([key, msgs]) => {
        if (!msgs) return
        qc.setQueryData<Message[]>(
          key,
          msgs.map((m) =>
            m.id === messageId
              ? { ...m, is_deleted: true, content: '🚫 Message deleted' }
              : m,
          ),
        )
      })
    }

    async function onEventJoinRequest(data: {
      eventId: string
      userId: string
      userName: string
      eventTitle: string
    }) {
      qc.invalidateQueries({ queryKey: ['event', data.eventId, 'participants'] })

      let displayName = data.userName
      try {
        const cached = qc.getQueryData<{ full_name?: string; username?: string }>(['user', data.userId])
        if (cached) {
          displayName = cached.full_name ?? cached.username ?? data.userName
        } else {
          const fetched = await getUserById(data.userId)
          displayName = fetched.full_name ?? fetched.username ?? data.userName
          qc.setQueryData(['user', data.userId], fetched)
        }
      } catch { /* fallback to data.userName */ }

      qc.setQueryData<Notification[]>(['notifications'], (prev = []) => [
        {
          id: `join-${data.userId}-${Date.now()}`,
          user_id: data.userId,
          title: '📬 New join request',
          body: `${displayName} wants to join "${data.eventTitle}"`,
          is_read: false,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ])
    }

    function onParticipantStatusUpdate(data: {
      eventId: string
      eventTitle: string
      status: string
    }) {
      qc.invalidateQueries({ queryKey: ['event', data.eventId] })
      qc.invalidateQueries({ queryKey: ['event', data.eventId, 'participants'] })
      qc.invalidateQueries({ queryKey: ['events', 'my'] })

      // If accepted → join the event group chat room automatically
      if (data.status === 'accepted') {
        const sock = getSocket(accessToken!)
        const joinRoom = () => sock.emit('joinEventRoom', { eventId: data.eventId })
        if (sock.connected) { joinRoom() } else { sock.once('connect', joinRoom) }
      }

      qc.setQueryData<Notification[]>(['notifications'], (prev = []) => [
        {
          id: `status-${data.eventId}-${Date.now()}`,
          user_id: '',
          title: data.status === 'accepted' ? '✅ Request accepted' : '❌ Request declined',
          body: `Your request for "${data.eventTitle}" was ${data.status}`,
          is_read: false,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ])
    }

    // ── Register ───────────────────────────────────────────────
    sock.on('newMessage', onNewMessage)
    sock.on('newGroupMessage', onNewGroupMessage)
    sock.on('messageDeleted', onMessageDeleted)
    sock.on('eventJoinRequest', onEventJoinRequest)
    sock.on('participantStatusUpdate', onParticipantStatusUpdate)

    // ── Cleanup: remove ONLY our named handlers ────────────────
    return () => {
      sock.off('newMessage', onNewMessage)
      sock.off('newGroupMessage', onNewGroupMessage)
      sock.off('messageDeleted', onMessageDeleted)
      sock.off('eventJoinRequest', onEventJoinRequest)
      sock.off('participantStatusUpdate', onParticipantStatusUpdate)
    }
  }, [accessToken, qc])

  useEffect(() => {
    if (!accessToken) disconnectSocket()
  }, [accessToken])
}