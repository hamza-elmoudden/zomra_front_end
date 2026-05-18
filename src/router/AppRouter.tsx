import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import type { ReactNode } from 'react'

import AppLayout from '@/components/layout/AppLayout'
import LoginPage from '@/pages/auth/LoginPage'
import AuthSuccessPage from '@/pages/auth/AuthSuccessPage'
import HomePage from '@/pages/home/HomePage'
import EventsListPage from '@/pages/events/EventsListPage'
import EventDetailPage from '@/pages/events/EventDetailPage'
import CreateEventPage from '@/pages/events/CreateEventPage'
import EditEventPage from '@/pages/events/EditEventPage'
import MyProfilePage from '@/pages/profile/MyProfilePage'
import UserProfilePage from '@/pages/profile/UserProfilePage'
import MessagingPage from '@/pages/messaging/MessagingPage'
import NotFoundPage from '@/pages/NotFoundPage'

function PrivateRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (isAuthenticated) return <Navigate to="/home" replace />
  return <>{children}</>
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/auth/success" element={<AuthSuccessPage />} />

        <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/events" element={<EventsListPage />} />
          <Route path="/events/new" element={<CreateEventPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/events/:id/edit" element={<EditEventPage />} />
          <Route path="/profile" element={<MyProfilePage />} />
          <Route path="/users/:id" element={<UserProfilePage />} />
          <Route path="/messages" element={<MessagingPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
