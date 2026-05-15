import { useState } from 'react'
import type { TournamentDay } from '@/shared/types'
import { Button } from './button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog'
import TimePicker from './time-picker'
import { Clock } from 'lucide-react'
import { format } from 'date-fns'

interface Props {
  days: TournamentDay[]
  value: { dayId: string; scheduledAt: string } | null
  onChange: (dayId: string | null, scheduledAt: string | null) => void
  label?: string
}

export default function DayTimePicker({ days, value, onChange, label }: Props) {
  const [open, setOpen] = useState(false)
  const [selectedDayId, setSelectedDayId] = useState(value?.dayId ?? '')
  const [time, setTime] = useState(() => {
    if (!value?.scheduledAt) return '12:00'
    const d = new Date(value.scheduledAt)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  })

  function apply() {
    if (!selectedDayId) { onChange(null, null); setOpen(false); return }
    const day = days.find(d => d.id === selectedDayId)
    if (!day) return
    const [h, m] = time.split(':').map(Number)
    const dt = new Date(`${day.date}T00:00:00`)
    dt.setHours(h, m, 0, 0)
    onChange(selectedDayId, dt.toISOString())
    setOpen(false)
  }

  function clear() {
    setSelectedDayId(''); onChange(null, null); setOpen(false)
  }

  const currentDay = days.find(d => d.id === value?.dayId)
  const display = currentDay && value?.scheduledAt
    ? `${currentDay.label ?? `Day ${currentDay.day_number}`} · ${format(new Date(value.scheduledAt), 'HH:mm')}`
    : 'Set day & time'

  return (
    <>
      <Button type="button" variant="outline" className="w-full justify-start gap-2 font-normal" onClick={() => setOpen(true)}>
        <Clock className="h-4 w-4 text-zinc-500" />
        <span className={value?.scheduledAt ? 'text-zinc-200' : 'text-zinc-600'}>{display}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xs text-center">
          <DialogHeader><DialogTitle>{label ?? 'Schedule match'}</DialogTitle></DialogHeader>

          <div className="space-y-1.5 text-left">
            <Select value={selectedDayId} onValueChange={setSelectedDayId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {days.map(d => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.label ?? `Day ${d.day_number}`} — {format(new Date(d.date + 'T00:00:00'), 'EEE, MMM d')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border-t border-zinc-800 pt-4">
            <p className="text-xs text-zinc-500 uppercase tracking-widest text-center mb-3">Time</p>
            <TimePicker value={time} onChange={setTime} />
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="blue" className="flex-1" onClick={apply} disabled={!selectedDayId}>Confirm</Button>
            <Button variant="outline" onClick={clear}>Clear</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
