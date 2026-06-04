import { useQuery } from '@tanstack/react-query'
import { listStaffUsers, getReports } from '@/api/admin.api'
import { listEvents } from '@/api/events.api'
import { Users, Calendar, Flag, Shield } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export default function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user)

  const { data: staff } = useQuery({ queryKey: ['admin-staff'], queryFn: listStaffUsers, enabled: user?.role === 'admin' })
  const { data: reports } = useQuery({ queryKey: ['admin-reports'], queryFn: getReports })
  const { data: events } = useQuery({ queryKey: ['admin-events'], queryFn: () => listEvents({ limit: 100 }) })

  const openReports = reports?.filter((r) => r.status === 'pending').length ?? 0
  const activeEvents = events?.filter((e) => e.status === 'open' || e.status === 'ongoing').length ?? 0

  const cards = [
    { label: 'Staff Members', value: staff?.length ?? '—', icon: Users, color: '#6c5ce7', bg: 'rgba(108,92,231,0.12)', show: user?.role === 'admin' },
    { label: 'Active Events', value: activeEvents, icon: Calendar, color: '#00cec9', bg: 'rgba(0,206,201,0.12)', show: true },
    { label: 'Open Reports', value: openReports, icon: Flag, color: '#ff6b6b', bg: 'rgba(255,107,107,0.12)', show: true },
    { label: 'Your Role', value: user?.role?.toUpperCase() ?? '—', icon: Shield, color: '#a29bfe', bg: 'rgba(162,155,254,0.12)', show: true },
  ].filter((c) => c.show)

  return (
    <div>
      <h1 className="font-display" style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Dashboard</h1>
      <p style={{ color: 'var(--z-muted)', fontSize: 14, marginBottom: 28 }}>
        Welcome back, {user?.full_name || user?.username}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="z-card" style={{ padding: 20 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
            }}>
              <Icon size={18} color={color} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--z-muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Recent Reports */}
        <div className="z-card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Flag size={15} color="var(--z-coral)" /> Recent Reports
          </h2>
          {reports?.slice(0, 5).map((r) => (
            <div key={r.id} style={{
              padding: '10px 0', borderBottom: '1px solid var(--z-border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{r.reason}</div>
                <div style={{ fontSize: 11, color: 'var(--z-muted)' }}>{r.target_type} · {new Date(r.created_at).toLocaleDateString()}</div>
              </div>
              <span style={{
                fontSize: 11, padding: '3px 8px', borderRadius: 100,
                background: r.status === 'pending' ? 'rgba(255,107,107,0.15)' : 'rgba(0,206,201,0.15)',
                color: r.status === 'pending' ? 'var(--z-coral)' : 'var(--z-mint)',
              }}>{r.status}</span>
            </div>
          )) ?? <p style={{ color: 'var(--z-muted)', fontSize: 13 }}>No reports found.</p>}
        </div>

        {/* Recent Events */}
        <div className="z-card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={15} color="var(--z-mint)" /> Recent Events
          </h2>
          {events?.slice(0, 5).map((e) => (
            <div key={e.id} style={{
              padding: '10px 0', borderBottom: '1px solid var(--z-border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{e.title}</div>
                <div style={{ fontSize: 11, color: 'var(--z-muted)' }}>{e.city} · {e.current_count}/{e.max_participants}</div>
              </div>
              <span className={`status-${e.status}`} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 100 }}>
                {e.status}
              </span>
            </div>
          )) ?? <p style={{ color: 'var(--z-muted)', fontSize: 13 }}>No events found.</p>}
        </div>
      </div>
    </div>
  )
}
