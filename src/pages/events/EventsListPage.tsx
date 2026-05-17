import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { getAllInterests } from '@/api/interests.api'
import { listEvents } from '@/api/events.api'
import EventCard from '@/components/events/EventCard'
import type { Event } from '@/types/event.types'

type EventStatusFilter = '' | 'open' | 'full' | 'ongoing' | 'completed' | 'cancelled'

export default function EventsListPage() {
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState('')
  const [city, setCity] = useState('')
  const [status, setStatus] = useState<EventStatusFilter>('')
  const queryClient = useQueryClient()

  const { data: interests } = useQuery({
    queryKey: ['interests'],
    queryFn: getAllInterests,
  })

  const {
    data: events,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ['events', 'list', page, category, city, status],
    queryFn: () =>
      listEvents({
        page,
        limit: 12,
        category: category || undefined,
        city: city || undefined,
        status: status || undefined,
      }),
  })

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['events', 'list'] })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Browse Events</h1>
          <p className="mt-1 text-gray-500">Discover events near you</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <div>
            <input
              type="text"
              value={city}
              onChange={(e) => {
                setCity(e.target.value)
                setPage(1)
              }}
              placeholder="City..."
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
          <div>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value)
                setPage(1)
              }}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="">All categories</option>
              {(interests ?? []).map((i) => (
                <option key={i.id} value={i.name}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as EventStatusFilter)
                setPage(1)
              }}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="full">Full</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div>
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
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
              <p className="text-red-600">Failed to load events.</p>
              <button
                type="button"
                onClick={handleRetry}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          ) : events && events.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
              <p className="text-lg font-semibold text-gray-900">No events found</p>
              <p className="mt-1 text-gray-500">Try changing your filters.</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(events ?? []).map((event: Event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={isFetching || (events ?? []).length < 12}
                  className="rounded-xl bg-primary px-8 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isFetching ? 'Loading...' : 'Load More'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
