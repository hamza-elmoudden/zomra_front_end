import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { RefreshCw, Search, SlidersHorizontal } from 'lucide-react'
import { getAllInterests } from '@/api/interests.api'
import { listEvents } from '@/api/events.api'
import EventCard from '@/components/events/EventCard'
import type { Event } from '@/types/event.types'

type EventStatusFilter = '' | 'open' | 'full' | 'ongoing' | 'completed' | 'cancelled'

const STATUS_OPTIONS: { value: EventStatusFilter; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'full', label: 'Full' },
  { value: 'ongoing', label: 'Live' },
  { value: 'completed', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function EventsListPage() {
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState('')
  const [city, setCity] = useState('')
  const [status, setStatus] = useState<EventStatusFilter>('')
  const [showFilters, setShowFilters] = useState(false)
  const queryClient = useQueryClient()

  const { data: interests } = useQuery({
    queryKey: ['interests'],
    queryFn: getAllInterests,
  })

  const { data: events, isLoading, isFetching, error } = useQuery({
    queryKey: ['events', 'list', page, category, city, status],
    queryFn: () => listEvents({ page, limit: 12, category: category || undefined, city: city || undefined, status: status || undefined }),
  })

  return (
    <div style={{ minHeight: '100%', background: 'var(--z-bg)' }}>
      <div style={{ padding: '20px 20px 8px' }}>
        <h1 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: 'var(--z-text)', marginBottom: 14, letterSpacing: '-0.5px' }}>
          Browse Events
        </h1>

        {/* Search + Filter row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--z-surface2)', border: '1px solid var(--z-border)',
            borderRadius: 10, padding: '9px 12px',
          }}>
            <Search size={15} style={{ color: 'var(--z-muted)', flexShrink: 0 }} />
            <input
              type="text" value={city} onChange={(e) => { setCity(e.target.value); setPage(1) }}
              placeholder="Search city..."
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, color: 'var(--z-text)', fontFamily: 'inherit' }}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: showFilters ? 'var(--z-pill-bg)' : 'var(--z-surface2)',
              border: `1px solid ${showFilters ? 'var(--z-accent2)' : 'var(--z-border)'}`,
              borderRadius: 10, padding: '9px 12px', cursor: 'pointer',
              fontSize: 13, color: showFilters ? 'var(--z-accent2)' : 'var(--z-muted)',
              fontFamily: 'inherit',
            }}
          >
            <SlidersHorizontal size={15} />
            Filters
          </button>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div style={{ background: 'var(--z-surface)', border: '1px solid var(--z-border)', borderRadius: 12, padding: '14px', marginBottom: 12 }} className="animate-fade-in">
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: 'var(--z-muted)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>Category</p>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1) }}
                style={{ width: '100%', background: 'var(--z-surface2)', border: '1px solid var(--z-border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--z-text)', outline: 'none', fontFamily: 'inherit' }}
              >
                <option value="">All categories</option>
                {(interests ?? []).map((i) => <option key={i.id} value={i.name}>{i.name}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Status pills */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setStatus(opt.value); setPage(1) }}
              className={`z-pill ${status === opt.value ? 'active' : ''}`}
              style={{ padding: '5px 12px', fontSize: 12 }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '8px 16px' }}>
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 220, borderRadius: 'var(--z-radius)' }} />
            ))}
          </div>
        ) : error ? (
          <div style={{ background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 'var(--z-radius)', padding: 24, textAlign: 'center' }}>
            <p style={{ color: '#ff6b6b', fontSize: 14, marginBottom: 12 }}>Failed to load events.</p>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['events', 'list'] })}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#ff6b6b', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        ) : events && events.length === 0 ? (
          <div style={{ background: 'var(--z-surface)', border: '1px solid var(--z-border)', borderRadius: 'var(--z-radius)', padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <p className="font-display" style={{ fontSize: 16, fontWeight: 600, color: 'var(--z-text)', marginBottom: 6 }}>No events found</p>
            <p style={{ fontSize: 13, color: 'var(--z-muted)' }}>Try different filters.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {(events ?? []).map((event: Event, i: number) => (
                <div key={event.id} className={`animate-fade-in stagger-${Math.min(i + 1, 5)}`}>
                  <EventCard event={event} />
                </div>
              ))}
            </div>
            {(events ?? []).length >= 12 && (
              <div style={{ textAlign: 'center', marginTop: 20, paddingBottom: 8 }}>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={isFetching}
                  style={{
                    background: 'var(--z-surface)', border: '1px solid var(--z-border)',
                    borderRadius: 10, padding: '10px 28px', fontSize: 13, color: 'var(--z-text)',
                    cursor: isFetching ? 'not-allowed' : 'pointer', opacity: isFetching ? 0.5 : 1,
                    fontFamily: 'inherit',
                  }}
                >
                  {isFetching ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
