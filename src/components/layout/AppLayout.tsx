import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Home, Compass, PlusCircle, MessageCircle, User, Bell, Plus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

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
  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() ?? 'ME'

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
        <span
          className="font-display text-xl font-bold gradient-text"
          style={{ letterSpacing: '-0.5px' }}
        >
          Zomra
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/events/new')}
            style={{
              width: 36, height: 36,
              borderRadius: 10,
              border: '1px solid var(--z-border)',
              background: 'var(--z-surface2)',
              color: 'var(--z-muted)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            title="Create event"
          >
            <Plus size={16} />
          </button>
          <button
            style={{
              width: 36, height: 36,
              borderRadius: 10,
              border: '1px solid var(--z-border)',
              background: 'var(--z-surface2)',
              color: 'var(--z-muted)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            title="Notifications"
          >
            <Bell size={16} />
          </button>
          <button
            onClick={() => navigate('/profile')}
            style={{
              width: 34, height: 34,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: 'white',
              cursor: 'pointer',
              border: '2px solid rgba(162,155,254,0.3)',
              fontFamily: '"Sora", sans-serif',
              flexShrink: 0,
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
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.3px',
              textDecoration: 'none',
            })}
          >
            {({ isActive }) =>
              isCreate ? (
                <>
                  <div
                    style={{
                      width: 32, height: 32,
                      borderRadius: 10,
                      background: isActive ? 'var(--z-accent)' : 'var(--z-pill-bg)',
                      border: `1px solid ${isActive ? 'var(--z-accent)' : 'var(--z-accent2)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--z-accent2)',
                      transition: 'all 0.15s',
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <span style={{ fontSize: 10, color: isActive ? 'var(--z-accent2)' : 'var(--z-muted)' }}>
                    {label}
                  </span>
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
