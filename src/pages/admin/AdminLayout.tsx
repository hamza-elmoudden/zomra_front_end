import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { logout } from '@/api/auth.api'
import { LayoutDashboard, Users, Calendar, Flag, Tag, LogOut, Shield } from 'lucide-react'

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/events', icon: Calendar, label: 'Events' },
  { to: '/admin/reports', icon: Flag, label: 'Reports' },
  { to: '/admin/interests', icon: Tag, label: 'Interests' },
]

export default function AdminLayout() {
  const user = useAuthStore((s) => s.user)
  const clearUser = useAuthStore((s) => s.clearUser)
  const navigate = useNavigate()

  async function handleLogout() {
    try { await logout() } catch {}
    clearUser()
    navigate('/admin/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--z-bg)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: 'var(--z-surface)',
        borderRight: '1px solid var(--z-border)',
        display: 'flex', flexDirection: 'column',
        padding: '20px 0', position: 'sticky', top: 0, height: '100vh',
      }}>
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid var(--z-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield size={16} color="white" />
            </div>
            <div>
              <div className="font-display" style={{ fontSize: 14, fontWeight: 700 }}>Zomra Admin</div>
              <div style={{ fontSize: 11, color: 'var(--z-muted)', textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to} to={to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, marginBottom: 2,
                textDecoration: 'none', fontSize: 13, fontWeight: 500,
                color: isActive ? 'var(--z-accent2)' : 'var(--z-muted)',
                background: isActive ? 'rgba(108,92,231,0.12)' : 'transparent',
                transition: 'all 0.15s',
              })}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--z-border)' }}>
          <div style={{ padding: '8px 12px', marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--z-text)', fontWeight: 500 }}>
              {user?.full_name || user?.username}
            </div>
            <div style={{ fontSize: 11, color: 'var(--z-muted)' }}>{user?.email}</div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '10px 12px', borderRadius: 10,
              border: 'none', background: 'transparent',
              color: 'var(--z-coral)', cursor: 'pointer', fontSize: 13,
              fontFamily: 'inherit', fontWeight: 500,
            }}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflow: 'auto', padding: 28 }}>
        <Outlet />
      </main>
    </div>
  )
}
