import api from './axios'
import type { Conversation, Message, GroupMessage } from '@/types/message.types'

export interface CreateConversationDto {
  recipientId: string
  eventId?: string
}

// POST /conversations
export function createConversation(data: CreateConversationDto): Promise<Conversation> {
  return api.post<Conversation>('/conversations', data).then((r) => r.data)
}

// GET /conversations
export function getConversations(): Promise<Conversation[]> {
  return api.get<Conversation[]>('/conversations').then((r) => r.data)
}

// GET /conversations/:conversationId/messages
export function getMessages(conversationId: string): Promise<Message[]> {
  return api.get<Message[]>(`/conversations/${conversationId}/messages`).then((r) => r.data)
}

// POST /conversations/:conversationId/messages
export function sendMessage(conversationId: string, content: string): Promise<Message> {
  return api
    .post<Message>(`/conversations/${conversationId}/messages`, { content })
    .then((r) => r.data)
}

// DELETE /messages/:messageId
export function deleteMessage(messageId: string): Promise<void> {
  return api.delete(`/messages/${messageId}`)
}

// GET /events/:eventId/messages
export function getGroupMessages(eventId: string): Promise<GroupMessage[]> {
  return api.get<GroupMessage[]>(`/events/${eventId}/messages`).then((r) => r.data)
}

// POST /events/:eventId/messages
export function sendGroupMessage(eventId: string, content: string): Promise<GroupMessage> {
  return api
    .post<GroupMessage>(`/events/${eventId}/messages`, { content })
    .then((r) => r.data)
}
