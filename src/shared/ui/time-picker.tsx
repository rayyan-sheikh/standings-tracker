import { Button } from './button'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface Props {
  value: string // "HH:MM"
  onChange: (value: string) => void
}

export default function TimePicker({ value, onChange }: Props) {
  const [h, m] = value.split(':').map(Number)

  function setHour(next: number) {
    const hh = ((next % 24) + 24) % 24
    onChange(`${String(hh).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }

  function setMinute(next: number) {
    const mm = ((next % 60) + 60) % 60
    onChange(`${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`)
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <Spinner label="Hour" value={h} max={23} onUp={() => setHour(h + 1)} onDown={() => setHour(h - 1)} />
      <span className="text-2xl font-bold text-zinc-500 mb-1">:</span>
      <Spinner label="Min" value={m} max={59} onUp={() => setMinute(m + 5)} onDown={() => setMinute(m - 5)} />
    </div>
  )
}

function Spinner({ label, value, onUp, onDown }: {
  label: string; value: number; max: number; onUp: () => void; onDown: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-[10px] text-zinc-600 uppercase tracking-widest">{label}</p>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onUp}>
        <ChevronUp className="h-4 w-4" />
      </Button>
      <span className="text-3xl font-bold tabular-nums text-zinc-100 w-14 text-center" style={{ fontFamily: 'Sora, sans-serif' }}>
        {String(value).padStart(2, '0')}
      </span>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDown}>
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  )
}
