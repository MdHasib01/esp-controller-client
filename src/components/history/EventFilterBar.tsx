import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PowerEventType } from '@/lib/types'

export interface EventFilters {
  type: PowerEventType | 'all'
  from: string
  to: string
}

const TYPE_OPTIONS: { value: EventFilters['type']; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'outage', label: 'Power Cut' },
  { value: 'device_offline', label: 'Device Unreachable' },
  { value: 'checkup', label: 'Checkup' },
]

export function EventFilterBar({
  filters,
  onChange,
}: {
  filters: EventFilters
  onChange: (filters: EventFilters) => void
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Type</Label>
        <Select
          value={filters.type}
          onValueChange={(value) => onChange({ ...filters, type: value as EventFilters['type'] })}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">From</Label>
        <Input
          type="date"
          value={filters.from}
          onChange={(e) => onChange({ ...filters, from: e.target.value })}
          className="w-40"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">To</Label>
        <Input
          type="date"
          value={filters.to}
          onChange={(e) => onChange({ ...filters, to: e.target.value })}
          className="w-40"
        />
      </div>
    </div>
  )
}
