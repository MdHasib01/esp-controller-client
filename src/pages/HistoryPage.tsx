import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EventFilterBar, type EventFilters } from '@/components/history/EventFilterBar'
import { EventList } from '@/components/history/EventList'
import { ConnectionList } from '@/components/history/ConnectionList'
import { TimelineList, TimelineSummaryRow } from '@/components/history/TimelineList'
import { Skeleton } from '@/components/ui/skeleton'
import { dayEndIso, dayStartIso } from '@/lib/format'
import {
  useDeviceConnectionsQuery,
  useDeviceEventsQuery,
  useDeviceTimelineQuery,
  useDevicesQuery,
} from '@/hooks/useDeviceQueries'

type HistoryTab = 'timeline' | 'events' | 'connections'
const HISTORY_TABS: HistoryTab[] = ['timeline', 'events', 'connections']

const EMPTY_FILTERS: EventFilters = { type: 'all', from: '', to: '' }
const PAGE_SIZE = 20

export function HistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const devicesQuery = useDevicesQuery()
  const deviceId = searchParams.get('deviceId') ?? devicesQuery.data?.[0]?.id
  const tabParam = searchParams.get('tab') as HistoryTab | null
  const tab: HistoryTab = tabParam && HISTORY_TABS.includes(tabParam) ? tabParam : 'timeline'

  const [filters, setFilters] = useState<EventFilters>(EMPTY_FILTERS)
  const [page, setPage] = useState(1)

  const dateRange = { from: filters.from || undefined, to: filters.to || undefined }

  const eventsQuery = useDeviceEventsQuery(tab === 'events' ? deviceId : undefined, {
    page,
    limit: PAGE_SIZE,
    type: filters.type === 'all' ? undefined : filters.type,
    ...dateRange,
  })
  const connectionsQuery = useDeviceConnectionsQuery(
    tab === 'connections' ? deviceId : undefined,
    { page, limit: PAGE_SIZE, ...dateRange }
  )
  // Whole local days, so 'To' includes that day and the totals line up with the dates shown.
  const timelineQuery = useDeviceTimelineQuery(tab === 'timeline' ? deviceId : undefined, {
    page,
    limit: PAGE_SIZE,
    from: filters.from ? dayStartIso(filters.from) : undefined,
    to: filters.to ? dayEndIso(filters.to) : undefined,
  })

  function updateFilters(next: EventFilters) {
    setFilters(next)
    setPage(1)
  }

  function changeTab(next: HistoryTab) {
    const params = new URLSearchParams(searchParams)
    if (next === 'timeline') params.delete('tab')
    else params.set('tab', next)
    setSearchParams(params, { replace: true })
    setPage(1)
  }

  const total =
    (tab === 'timeline'
      ? timelineQuery.data?.total
      : tab === 'events'
        ? eventsQuery.data?.total
        : connectionsQuery.data?.total) ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">History</h1>
        <Tabs value={tab} onValueChange={(v) => changeTab(v as HistoryTab)}>
          <TabsList>
            <TabsTrigger value="timeline">Status timeline</TabsTrigger>
            <TabsTrigger value="events">Power events</TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <EventFilterBar filters={filters} onChange={updateFilters} showType={tab === 'events'} />

      {tab === 'timeline' ? (
        <>
          {timelineQuery.data ? (
            <TimelineSummaryRow summary={timelineQuery.data.summary} />
          ) : (
            timelineQuery.isPending && <Skeleton className="h-24 rounded-xl" />
          )}
          <TimelineList
            segments={timelineQuery.data?.segments ?? []}
            isLoading={timelineQuery.isPending}
          />
        </>
      ) : tab === 'events' ? (
        <EventList events={eventsQuery.data?.events ?? []} isLoading={eventsQuery.isPending} />
      ) : (
        <ConnectionList
          connections={connectionsQuery.data?.connections ?? []}
          isLoading={connectionsQuery.isPending}
        />
      )}

      {total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} · {total} {tab === 'timeline' ? 'periods' : tab === 'events' ? 'events' : 'connections'}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
