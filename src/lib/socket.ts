import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(token: string): Socket {
  if (socket && socket.connected) return socket

  socket = io(import.meta.env.VITE_API_URL ?? 'http://localhost:3000', {
    namespace: '/messaging',
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
  })

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
