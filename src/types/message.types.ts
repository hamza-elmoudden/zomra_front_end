export interface Conversation {
  id: string
  user_1_id: string
  user_2_id: string
  event_id?: string
  created_at: string
  last_message_at?: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  is_deleted: boolean
  sent_at: string
}

export interface GroupMessage {
  id: string
  event_id: string
  sender_id: string
  content: string
  is_deleted: boolean
  sent_at: string
}
