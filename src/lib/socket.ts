import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null
let currentToken: string | null = null

export function getSocket(token: string): Socket {
  if (socket && socket.connected && currentToken === token) return socket

  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }

  currentToken = token

  // Use VITE_API_BASE_URL (same as axios) — strip trailing slash
  const baseUrl = (import.meta.env.VITE_API_BASE_URL as string ?? 'http://localhost:3000').replace(/\/$/, '')

  socket = io(`${baseUrl}/messaging`, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  })

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
    currentToken = null
  }
}
