import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listStaffUsers, createStaffUser, suspendUser } from '@/api/admin.api'
import { listEvents } from '@/api/events.api'
import { useAuthStore } from '@/store/authStore'
import { UserPlus, Shield, Eye, AlertTriangle } from 'lucide-react'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 10,
  background: 'var(--z-surface2)', border: '1px solid var(--z-border)',
  color: 'var(--z-text)', fontSize: 13, outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box',
}

export default function AdminUsersPage() {
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ username: '', email: '', password: '', fullName: '', role: 'observer' as 'admin' | 'observer' })
  const [formError, setFormError] = useState('')

  const { data: staff, isLoading } = useQuery({
    queryKey: ['admin-staff'],
    queryFn: listStaffUsers,
    enabled: user?.role === 'admin',
  })

  const createMutation = useMutation({
    mutationFn: createStaffUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-staff'] })
      setShowForm(false)
      setForm({ username: '', email: '', password: '', fullName: '', role: 'observer' })
      setFormError('')
    },
    onError: (e: any) => setFormError(e?.response?.data?.message ?? 'Failed to create staff user'),
  })

  const suspendMutation = useMutation({
    mutationFn: ({ id, suspend }: { id: string; suspend: boolean }) => suspendUser(id, suspend),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-staff'] }),
  })

  if (user?.role !== 'admin') {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <AlertTriangle size={40} color="var(--z-coral)" style={{ marginBottom: 12 }} />
        <p style={{ color: 'var(--z-coral)' }}>Admin access required for user management.</p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Staff Users</h1>
          <p style={{ color: 'var(--z-muted)', fontSize: 13 }}>Manage admin and observer accounts</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
            color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <UserPlus size={15} /> Add Staff
        </button>
      </div>

      {showForm && (
        <div className="z-card" style={{ padding: 20, marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Create Staff Account</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--z-muted)', display: 'block', marginBottom: 5 }}>Username</label>
              <input style={inputStyle} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="username" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--z-muted)', display: 'block', marginBottom: 5 }}>Full Name</label>
              <input style={inputStyle} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Full Name" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--z-muted)', display: 'block', marginBottom: 5 }}>Email</label>
              <input style={inputStyle} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--z-muted)', display: 'block', marginBottom: 5 }}>Password</label>
              <input style={inputStyle} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="min 8 chars" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--z-muted)', display: 'block', marginBottom: 5 }}>Role</label>
              <select style={{ ...inputStyle }} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as any })}>
                <option value="observer">Observer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          {formError && <p style={{ color: 'var(--z-coral)', fontSize: 12, marginTop: 8 }}>{formError}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button
              onClick={() => createMutation.mutate(form)}
              disabled={createMutation.isPending}
              style={{
                padding: '9px 18px', borderRadius: 10, border: 'none',
                background: 'var(--z-accent)', color: 'white', fontSize: 13,
                fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {createMutation.isPending ? 'Creating…' : 'Create'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                padding: '9px 18px', borderRadius: 10,
                border: '1px solid var(--z-border)', background: 'transparent',
                color: 'var(--z-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
      ) : (
        <div className="z-card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--z-border)' }}>
                {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: 'var(--z-muted)', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staff?.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--z-border)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: 8,
                        background: s.role === 'admin' ? 'rgba(108,92,231,0.2)' : 'rgba(162,155,254,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {s.role === 'admin' ? <Shield size={14} color="var(--z-accent2)" /> : <Eye size={14} color="var(--z-muted)" />}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{s.full_name || s.username}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--z-muted)' }}>{s.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: 11, padding: '3px 8px', borderRadius: 100,
                      background: s.role === 'admin' ? 'rgba(108,92,231,0.15)' : 'rgba(162,155,254,0.1)',
                      color: s.role === 'admin' ? 'var(--z-accent2)' : 'var(--z-muted)',
                    }}>{s.role}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: 11, padding: '3px 8px', borderRadius: 100,
                      background: s.is_active ? 'rgba(0,206,201,0.15)' : 'rgba(255,107,107,0.15)',
                      color: s.is_active ? 'var(--z-mint)' : 'var(--z-coral)',
                    }}>{s.is_active ? 'Active' : 'Suspended'}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--z-muted)' }}>
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => suspendMutation.mutate({ id: s.id, suspend: s.is_active })}
                      style={{
                        fontSize: 12, padding: '5px 12px', borderRadius: 8, border: 'none',
                        background: s.is_active ? 'rgba(255,107,107,0.15)' : 'rgba(0,206,201,0.15)',
                        color: s.is_active ? 'var(--z-coral)' : 'var(--z-mint)',
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      {s.is_active ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!staff?.length && (
            <p style={{ textAlign: 'center', padding: 30, color: 'var(--z-muted)', fontSize: 13 }}>No staff users found.</p>
          )}
        </div>
      )}
    </div>
  )
}
