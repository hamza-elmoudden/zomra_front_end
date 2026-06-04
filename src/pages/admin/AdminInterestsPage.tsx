import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAllInterests } from '@/api/interests.api'
import { addInterestAdmin } from '@/api/admin.api'
import { Tag, Plus } from 'lucide-react'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 10,
  background: 'var(--z-surface2)', border: '1px solid var(--z-border)',
  color: 'var(--z-text)', fontSize: 13, outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box',
}

export default function AdminInterestsPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', icon: '', colorHex: '' })
  const [error, setError] = useState('')

  const { data: interests, isLoading } = useQuery({
    queryKey: ['interests'],
    queryFn: getAllInterests,
  })

  const addMutation = useMutation({
    mutationFn: () => addInterestAdmin(form.name, form.icon || undefined, form.colorHex || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['interests'] })
      setShowForm(false)
      setForm({ name: '', icon: '', colorHex: '' })
      setError('')
    },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'Failed to add interest'),
  })

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Interests</h1>
          <p style={{ color: 'var(--z-muted)', fontSize: 13 }}>Manage event categories and interests</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
            color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <Plus size={15} /> Add Interest
        </button>
      </div>

      {showForm && (
        <div className="z-card" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>New Interest</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--z-muted)', display: 'block', marginBottom: 5 }}>Name *</label>
              <input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Photography" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--z-muted)', display: 'block', marginBottom: 5 }}>Icon (emoji)</label>
              <input style={inputStyle} value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="📷" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--z-muted)', display: 'block', marginBottom: 5 }}>Color Hex</label>
              <input style={inputStyle} value={form.colorHex} onChange={(e) => setForm({ ...form, colorHex: e.target.value })} placeholder="#6c5ce7" />
            </div>
          </div>
          {error && <p style={{ color: 'var(--z-coral)', fontSize: 12, marginTop: 8 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button
              onClick={() => addMutation.mutate()}
              disabled={!form.name || addMutation.isPending}
              style={{
                padding: '8px 16px', borderRadius: 10, border: 'none',
                background: 'var(--z-accent)', color: 'white', fontSize: 13,
                fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {addMutation.isPending ? 'Adding…' : 'Add'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                padding: '8px 16px', borderRadius: 10,
                border: '1px solid var(--z-border)', background: 'transparent',
                color: 'var(--z-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          {interests?.map((interest: any) => (
            <div key={interest.id} className="z-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: interest.color_hex ? `${interest.color_hex}20` : 'var(--z-surface2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>
                {interest.icon ?? <Tag size={16} color="var(--z-muted)" />}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{interest.name}</div>
                {interest.color_hex && (
                  <div style={{ fontSize: 11, color: 'var(--z-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: interest.color_hex, display: 'inline-block' }} />
                    {interest.color_hex}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && !interests?.length && (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Tag size={40} color="var(--z-muted)" style={{ marginBottom: 12 }} />
          <p style={{ color: 'var(--z-muted)' }}>No interests yet.</p>
        </div>
      )}
    </div>
  )
}
