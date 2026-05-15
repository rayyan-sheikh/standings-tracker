import { useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Calendar } from './calendar'

interface Props {
  value: string // YYYY-MM-DD
  onChange: (date: string) => void
}

export default function DatePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const selected = value ? new Date(value + 'T00:00:00') : undefined

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
          <CalendarIcon className="h-3 w-3" />
          {value ? format(new Date(value + 'T00:00:00'), 'EEEE, MMM d') : 'Set date'}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="center"
          sideOffset={6}
          className="z-50 rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl shadow-black/40 outline-none"
          onOpenAutoFocus={e => e.preventDefault()}
        >
          <Calendar
            mode="single"
            selected={selected}
            onSelect={d => { if (d) { onChange(format(d, 'yyyy-MM-dd')); setOpen(false) } }}
            showOutsideDays
          />
          <Popover.Arrow className="fill-zinc-700" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
