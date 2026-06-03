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

// Admin pages
import AdminLoginPage from '@/pages/admin/AdminLoginPage'
import AdminLayout from '@/pages/admin/AdminLayout'
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import AdminEventsPage from '@/pages/admin/AdminEventsPage'
import AdminReportsPage from '@/pages/admin/AdminReportsPage'
import AdminInterestsPage from '@/pages/admin/AdminInterestsPage'

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

function AdminRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />
  if (user?.role !== 'admin' && user?.role !== 'observer') return <Navigate to="/admin/login" replace />
  return <>{children}</>
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public app routes */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/auth/success" element={<AuthSuccessPage />} />

        {/* Main app routes */}
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

        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="events" element={<AdminEventsPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="interests" element={<AdminInterestsPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
