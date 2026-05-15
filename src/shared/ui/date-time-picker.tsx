import { useState } from 'react'
import { Calendar } from './calendar'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Button } from './button'
import { Label } from './label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog'
import TimePicker from './time-picker'

interface Props {
  value: string // ISO string or empty
  onChange: (iso: string) => void
  label?: string
}

export default function DateTimePicker({ value, onChange, label }: Props) {
  const [open, setOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(value ? new Date(value) : undefined)
  const [time, setTime] = useState(() => {
    if (!value) return '12:00'
    const d = new Date(value)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  })

  function apply() {
    if (!selectedDay) return
    const [h, m] = time.split(':').map(Number)
    const d = new Date(selectedDay)
    d.setHours(h, m, 0, 0)
    onChange(d.toISOString())
    setOpen(false)
  }

  function clear() {
    setSelectedDay(undefined)
    setTime('12:00')
    onChange('')
    setOpen(false)
  }

  const display = value ? format(new Date(value), 'MMM d · HH:mm') : 'Set date & time'

  return (
    <>
      {label && <Label className="mb-1.5 block">{label}</Label>}
      <Button type="button" variant="outline" className="w-full justify-start gap-2 font-normal" onClick={() => setOpen(true)}>
        <CalendarIcon className="h-4 w-4 text-zinc-500" />
        <span className={value ? 'text-zinc-200' : 'text-zinc-600'}>{display}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>Pick date &amp; time</DialogTitle></DialogHeader>

          <div className="flex justify-center">
            <Calendar mode="single" selected={selectedDay} onSelect={setSelectedDay} showOutsideDays />
          </div>

          <div className="border-t border-zinc-800 pt-4">
            <p className="text-xs text-zinc-500 uppercase tracking-widest text-center mb-3">Time</p>
            <TimePicker value={time} onChange={setTime} />
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="blue" className="flex-1" onClick={apply} disabled={!selectedDay}>Confirm</Button>
            <Button variant="outline" onClick={clear}>Clear</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
