import { useState, useRef, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Home, Compass, PlusCircle, MessageCircle, User, Bell, Plus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNotifications, markNotificationRead } from '@/api/notifications.api'

const navItems = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/events', icon: Compass, label: 'Explore' },
  { to: '/events/new', icon: PlusCircle, label: 'Create', isCreate: true },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function AppLayout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() ?? 'ME'

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    refetchInterval: 30_000,
  })

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const unreadCount = notifications.filter((n) => !n.is_read).length

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    if (notifOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [notifOpen])

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--z-bg)' }}>
      {/* Top Bar */}
      <header
        className="flex items-center justify-between px-5 py-3 sticky top-0 z-50"
        style={{
          background: 'rgba(13,14,18,0.9)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--z-border)',
        }}
      >
        <span className="font-display text-xl font-bold gradient-text" style={{ letterSpacing: '-0.5px' }}>
          Zomra
        </span>

        <div className="flex items-center gap-2" style={{ position: 'relative' }}>
          <button
            onClick={() => navigate('/events/new')}
            style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--z-border)', background: 'var(--z-surface2)', color: 'var(--z-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Create event"
          >
            <Plus size={16} />
          </button>

          {/* Notifications bell */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setNotifOpen((o) => !o)}
              style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--z-border)', background: 'var(--z-surface2)', color: 'var(--z-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
              title="Notifications"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--z-accent2)',
                  border: '1.5px solid var(--z-bg)',
                }} />
              )}
            </button>

            {notifOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                width: 300, maxHeight: 360, overflowY: 'auto',
                background: 'var(--z-surface)', border: '1px solid var(--z-border)',
                borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                zIndex: 100,
              }}>
                <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--z-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--z-text)' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <span style={{ fontSize: 11, color: 'var(--z-accent2)' }}>{unreadCount} unread</span>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--z-muted)', fontSize: 13 }}>
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.is_read && markReadMutation.mutate(n.id)}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--z-border)',
                        background: n.is_read ? 'transparent' : 'rgba(108,92,231,0.06)',
                        cursor: n.is_read ? 'default' : 'pointer',
                        transition: 'background 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        {!n.is_read && (
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--z-accent2)', flexShrink: 0, marginTop: 4 }} />
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: n.is_read ? 400 : 600, color: 'var(--z-text)', marginBottom: 2 }}>
                            {n.title}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--z-muted)', lineHeight: 1.4 }}>{n.body}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/profile')}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: 'white',
              cursor: 'pointer', border: '2px solid rgba(162,155,254,0.3)',
              fontFamily: '"Sora", sans-serif', flexShrink: 0,
            }}
          >
            {initials}
          </button>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 flex z-50"
        style={{
          background: 'rgba(22,24,31,0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--z-border)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {navItems.map(({ to, icon: Icon, label, isCreate }) => (
          <NavLink
            key={to}
            to={to}
            className="flex flex-col items-center justify-center gap-1 flex-1 py-2.5 transition-all"
            style={({ isActive }) => ({
              color: isActive ? 'var(--z-accent2)' : 'var(--z-muted)',
              fontSize: 10, fontWeight: 500, letterSpacing: '0.3px', textDecoration: 'none',
            })}
          >
            {({ isActive }) =>
              isCreate ? (
                <>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: isActive ? 'var(--z-accent)' : 'var(--z-pill-bg)',
                    border: `1px solid ${isActive ? 'var(--z-accent)' : 'var(--z-accent2)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--z-accent2)', transition: 'all 0.15s',
                  }}>
                    <Icon size={16} />
                  </div>
                  <span style={{ fontSize: 10, color: isActive ? 'var(--z-accent2)' : 'var(--z-muted)' }}>{label}</span>
                </>
              ) : (
                <>
                  <Icon size={20} />
                  <span>{label}</span>
                </>
              )
            }
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
