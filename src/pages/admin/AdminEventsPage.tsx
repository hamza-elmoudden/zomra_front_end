import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listEvents } from '@/api/events.api'
import { suspendEvent } from '@/api/admin.api'
import { Calendar, Search, Ban, CheckCircle } from 'lucide-react'

const EVENT_STATUSES = ['draft', 'open', 'full', 'ongoing', 'completed', 'cancelled']

export default function AdminEventsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data: events, isLoading } = useQuery({
    queryKey: ['admin-events-all'],
    queryFn: () => listEvents({ limit: 200 }),
  })

  const suspendMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => suspendEvent(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-events-all'] }),
  })

  const filtered = (events ?? []).filter((e) => {
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.city?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || e.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Events</h1>
        <p style={{ color: 'var(--z-muted)', fontSize: 13 }}>Moderate and manage all events</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--z-muted)' }} />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events…"
            style={{
              width: '100%', padding: '9px 12px 9px 34px', borderRadius: 10,
              background: 'var(--z-surface)', border: '1px solid var(--z-border)',
              color: 'var(--z-text)', fontSize: 13, outline: 'none',
              fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
        </div>
        <select
          value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '9px 12px', borderRadius: 10,
            background: 'var(--z-surface)', border: '1px solid var(--z-border)',
            color: 'var(--z-text)', fontSize: 13, outline: 'none', fontFamily: 'inherit',
          }}
        >
          <option value="">All statuses</option>
          {EVENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="skeleton" style={{ height: 300, borderRadius: 12 }} />
      ) : (
        <div className="z-card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--z-border)' }}>
                {['Event', 'City', 'Date', 'Participants', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: 'var(--z-muted)', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} style={{ borderBottom: '1px solid var(--z-border)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--z-muted)' }}>{e.category}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--z-muted)' }}>{e.city || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--z-muted)' }}>
                    {new Date(e.starts_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--z-muted)' }}>
                    {e.current_count}/{e.max_participants}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`status-${e.status}`} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 100, display: 'inline-block' }}>
                      {e.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {e.status !== 'cancelled' && (
                        <button
                          onClick={() => suspendMutation.mutate({ id: e.id, status: 'cancelled' })}
                          title="Cancel event"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            fontSize: 12, padding: '5px 10px', borderRadius: 8, border: 'none',
                            background: 'rgba(255,107,107,0.15)', color: 'var(--z-coral)',
                            cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          <Ban size={12} /> Cancel
                        </button>
                      )}
                      {e.status === 'cancelled' && (
                        <button
                          onClick={() => suspendMutation.mutate({ id: e.id, status: 'open' })}
                          title="Restore event"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            fontSize: 12, padding: '5px 10px', borderRadius: 8, border: 'none',
                            background: 'rgba(0,206,201,0.15)', color: 'var(--z-mint)',
                            cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          <CheckCircle size={12} /> Restore
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <p style={{ textAlign: 'center', padding: 30, color: 'var(--z-muted)', fontSize: 13 }}>No events found.</p>
          )}
        </div>
      )}
    </div>
  )
}
