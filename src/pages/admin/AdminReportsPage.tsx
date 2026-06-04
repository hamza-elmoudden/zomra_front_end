import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getReports, resolveReport } from '@/api/admin.api'
import { Flag, CheckCircle, XCircle } from 'lucide-react'

export default function AdminReportsPage() {
  const qc = useQueryClient()

  const { data: reports, isLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: getReports,
  })

  const resolveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'resolved' | 'dismissed' }) =>
      resolveReport(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-reports'] }),
  })

  const pending = reports?.filter((r) => r.status === 'pending') ?? []
  const handled = reports?.filter((r) => r.status !== 'pending') ?? []

  const ReportRow = ({ r }: { r: any }) => (
    <div className="z-card" style={{ padding: 16, marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 100,
              background: 'rgba(162,155,254,0.1)', color: 'var(--z-muted)',
            }}>{r.target_type}</span>
            <span style={{ fontSize: 11, color: 'var(--z-muted)' }}>
              {new Date(r.created_at).toLocaleString()}
            </span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{r.reason}</div>
          {r.details && <div style={{ fontSize: 12, color: 'var(--z-muted)' }}>{r.details}</div>}
          <div style={{ fontSize: 11, color: 'var(--z-muted)', marginTop: 6 }}>
            Target ID: <code style={{ background: 'var(--z-surface2)', padding: '1px 5px', borderRadius: 4, fontSize: 10 }}>{r.target_id}</code>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
          {r.status === 'pending' ? (
            <>
              <button
                onClick={() => resolveMutation.mutate({ id: r.id, status: 'resolved' })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px', borderRadius: 8, border: 'none',
                  background: 'rgba(0,206,201,0.15)', color: 'var(--z-mint)',
                  cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
                }}
              >
                <CheckCircle size={13} /> Resolve
              </button>
              <button
                onClick={() => resolveMutation.mutate({ id: r.id, status: 'dismissed' })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px', borderRadius: 8, border: 'none',
                  background: 'rgba(255,107,107,0.1)', color: 'var(--z-coral)',
                  cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
                }}
              >
                <XCircle size={13} /> Dismiss
              </button>
            </>
          ) : (
            <span style={{
              fontSize: 11, padding: '4px 10px', borderRadius: 100,
              background: r.status === 'resolved' ? 'rgba(0,206,201,0.15)' : 'rgba(136,144,164,0.1)',
              color: r.status === 'resolved' ? 'var(--z-mint)' : 'var(--z-muted)',
            }}>{r.status}</span>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Reports</h1>
        <p style={{ color: 'var(--z-muted)', fontSize: 13 }}>Review and resolve user-submitted reports</p>
      </div>

      {isLoading ? (
        <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
      ) : (
        <>
          {pending.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Flag size={14} color="var(--z-coral)" />
                Pending ({pending.length})
              </h2>
              {pending.map((r) => <ReportRow key={r.id} r={r} />)}
            </div>
          )}

          {handled.length > 0 && (
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--z-muted)' }}>
                Handled ({handled.length})
              </h2>
              {handled.map((r) => <ReportRow key={r.id} r={r} />)}
            </div>
          )}

          {!reports?.length && (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <Flag size={40} color="var(--z-muted)" style={{ marginBottom: 12 }} />
              <p style={{ color: 'var(--z-muted)' }}>No reports to review.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
