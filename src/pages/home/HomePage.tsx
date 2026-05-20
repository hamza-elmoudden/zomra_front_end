import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Navigation, SlidersHorizontal } from 'lucide-react'
import { getAllInterests } from '@/api/interests.api'
import { listEvents, getNearbyEvents } from '@/api/events.api'
import { useLocation } from '@/hooks/useLocation'
import { useAuth } from '@/hooks/useAuth'
import EventCard from '@/components/events/EventCard'
import type { Event } from '@/types/event.types'

const CATEGORY_EMOJI: Record<string, string> = {
  Music: '🎵', Sports: '🏃', Food: '🍕', Arts: '🎭',
  Tech: '💻', Books: '📚', Nature: '🌿', Wellness: '🧘',
}

export default function HomePage() {
  const { user } = useAuth()
  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [cityFilter, setCityFilter] = useState('')
  const [radius, setRadius] = useState(25)
  const [useMyLocation, setUseMyLocation] = useState(true)
  const { lat, lng, error: locationError, loading: locationLoading } = useLocation()

  const firstName = user?.full_name?.split(' ')[0] ?? user?.username ?? 'there'

  const { data: interests } = useQuery({
    queryKey: ['interests'],
    queryFn: getAllInterests,
  })

  const { data: events, isLoading, error } = useQuery({
    queryKey: ['events', 'home', searchText, selectedCategory, cityFilter, lat, lng, radius, useMyLocation],
    queryFn: async () => {
      if (useMyLocation && lat && lng) {
        return getNearbyEvents(lat, lng, radius)
      }
      return listEvents({
        city: cityFilter || undefined,
        category: selectedCategory || undefined,
      })
    },
  })

  const filteredEvents = (events ?? []).filter((event: Event) => {
    if (searchText) {
      const q = searchText.toLowerCase()
      if (!event.title.toLowerCase().includes(q) && !event.description?.toLowerCase().includes(q)) {
        return false
      }
    }
    return true
  })

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const greetEmoji = hour < 12 ? '☀️' : hour < 18 ? '👋' : '🌙'

  return (
    <div style={{ minHeight: '100%', background: 'var(--z-bg)' }}>
      {/* Hero */}
      <div className="px-5 pt-6 pb-4">
        <p style={{ fontSize: 13, color: 'var(--z-muted)', marginBottom: 4 }}>
          {greeting} {greetEmoji}
        </p>
        <h1
          className="font-display font-bold"
          style={{ fontSize: 24, color: 'var(--z-text)', lineHeight: 1.2, marginBottom: 20, letterSpacing: '-0.5px' }}
        >
          Find your next{' '}
          <span className="gradient-text">adventure</span>,{' '}
          <span style={{ color: 'var(--z-accent2)' }}>{firstName}</span>
        </h1>

        {/* Search */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--z-surface2)',
            border: '1px solid var(--z-border)',
            borderRadius: 'var(--z-radius)',
            padding: '10px 14px',
            marginBottom: 12,
          }}
        >
          <Search size={16} style={{ color: 'var(--z-muted)', flexShrink: 0 }} />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search events..."
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontSize: 14, color: 'var(--z-text)', fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Location controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--z-muted)', cursor: 'pointer' }}>
            <Navigation size={14} style={{ color: 'var(--z-mint)' }} />
            <input
              type="checkbox"
              checked={useMyLocation}
              onChange={() => setUseMyLocation(!useMyLocation)}
              disabled={locationLoading || !!locationError}
            />
            Use my location
          </label>
          {useMyLocation && lat && lng && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <SlidersHorizontal size={14} style={{ color: 'var(--z-muted)', flexShrink: 0 }} />
              <input
                type="range" min={1} max={50} value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: 12, color: 'var(--z-muted)', minWidth: 40 }}>{radius} km</span>
            </div>
          )}
          {!useMyLocation && (
            <input
              type="text" value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              placeholder="City..."
              style={{
                background: 'var(--z-surface2)', border: '1px solid var(--z-border)',
                borderRadius: 8, padding: '6px 12px', fontSize: 13, color: 'var(--z-text)',
                outline: 'none', width: 120, fontFamily: 'inherit',
              }}
            />
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 20px 16px', scrollbarWidth: 'none' }}>
        <button
          onClick={() => setSelectedCategory(null)}
          className={`z-pill ${selectedCategory === null ? 'active' : ''}`}
        >
          ✦ All
        </button>
        {(interests ?? []).map((interest) => (
          <button
            key={interest.id}
            onClick={() => setSelectedCategory(selectedCategory === interest.name ? null : interest.name)}
            className={`z-pill ${selectedCategory === interest.name ? 'active' : ''}`}
          >
            {CATEGORY_EMOJI[interest.name] ?? ''} {interest.name}
          </button>
        ))}
      </div>

      {/* Location pill */}
      {useMyLocation && lat && (
        <div style={{ padding: '0 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 7 }}>
          <div
            className="location-pulse"
            style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--z-mint)', flexShrink: 0 }}
          />
          <span style={{ fontSize: 13, color: 'var(--z-muted)' }}>
            Showing events within <strong style={{ color: 'var(--z-text)' }}>{radius}km</strong>
          </span>
        </div>
      )}

      {/* Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', marginBottom: 14 }}>
        <h2 className="font-display" style={{ fontSize: 16, fontWeight: 600, color: 'var(--z-text)' }}>
          {selectedCategory ? `${selectedCategory} events` : 'Happening soon'}
        </h2>
        <span style={{ fontSize: 12, color: 'var(--z-accent2)', fontWeight: 500, cursor: 'pointer' }}>
          See all →
        </span>
      </div>

      {/* Events Grid */}
      <div style={{ padding: '0 16px' }}>
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 220, borderRadius: 'var(--z-radius)' }} />
            ))}
          </div>
        ) : error ? (
          <div
            style={{
              background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)',
              borderRadius: 'var(--z-radius)', padding: 24, textAlign: 'center',
            }}
          >
            <p style={{ color: '#ff6b6b', fontSize: 14 }}>Failed to load events. Please try again.</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div
            style={{
              background: 'var(--z-surface)', border: '1px solid var(--z-border)',
              borderRadius: 'var(--z-radius)', padding: '40px 20px', textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <h3 className="font-display" style={{ fontSize: 16, fontWeight: 600, color: 'var(--z-text)', marginBottom: 6 }}>
              No events found
            </h3>
            <p style={{ fontSize: 13, color: 'var(--z-muted)' }}>
              Try adjusting your filters or search in a different city.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {filteredEvents.map((event: Event, i: number) => (
              <div key={event.id} className={`animate-fade-in stagger-${Math.min(i + 1, 5)}`}>
                <EventCard event={event} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
