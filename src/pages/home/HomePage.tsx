import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Navigation, SlidersHorizontal } from 'lucide-react'
import { getAllInterests } from '@/api/interests.api'
import { listEvents, getNearbyEvents } from '@/api/events.api'
import { useLocation } from '@/hooks/useLocation'
import EventCard from '@/components/events/EventCard'
import type { Event } from '@/types/event.types'

export default function HomePage() {
  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [cityFilter, setCityFilter] = useState('')
  const [radius, setRadius] = useState(25)
  const [useMyLocation, setUseMyLocation] = useState(true)
  const { lat, lng, error: locationError, loading: locationLoading } = useLocation()

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search events..."
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            {(interests ?? []).map((interest) => (
              <button
                key={interest.id}
                type="button"
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === interest.name ? null : interest.name,
                  )
                }
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  selectedCategory === interest.name
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {interest.name}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-gray-400" />
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={useMyLocation}
                  onChange={() => setUseMyLocation(!useMyLocation)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  disabled={locationLoading || !!locationError}
                />
                Use my location
              </label>
            </div>
            {useMyLocation && lat && lng && (
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-gray-400" />
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="h-2 w-24 cursor-pointer appearance-none rounded-lg bg-gray-200 accent-primary"
                />
                <span className="text-sm text-gray-500">{radius} km</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                placeholder="City..."
                className="w-32 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                disabled={useMyLocation && !!lat}
              />
            </div>
          </div>
        </div>

        <div className="mt-6">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white">
                  <div className="h-40 rounded-t-xl bg-gray-200" />
                  <div className="space-y-3 p-4">
                    <div className="h-4 w-3/4 rounded bg-gray-200" />
                    <div className="h-3 w-1/2 rounded bg-gray-200" />
                    <div className="h-3 w-1/3 rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
              <p className="text-red-600">Failed to load events. Please try again.</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
              <Search className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">No events found</h3>
              <p className="mt-1 text-gray-500">
                Try adjusting your filters or search in a different city.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
