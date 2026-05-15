import { useState } from 'react'
import { supabase } from '@/shared/lib/supabase'
import type { TournamentDay } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Plus, Trash2, CalendarDays } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface Props {
  tournamentId: string
  days: TournamentDay[]
  onDaysChange: () => void
}

export default function DayManager({ tournamentId, days, onDaysChange }: Props) {
  const [adding, setAdding] = useState(false)
  const [date, setDate] = useState('')
  const [label, setLabel] = useState('')
  const [saving, setSaving] = useState(false)

  async function addDay(e: React.FormEvent) {
    e.preventDefault()
    if (!date) return
    setSaving(true)
    const dayNumber = days.length + 1
    await supabase.from('tournament_days').insert({
      tournament_id: tournamentId,
      day_number: dayNumber,
      date,
      label: label.trim() || `Day ${dayNumber}`,
    })
    setDate(''); setLabel(''); setAdding(false); setSaving(false)
    onDaysChange()
    toast.success('Day added')
  }

  async function removeDay(id: string) {
    await supabase.from('tournament_days').delete().eq('id', id)
    onDaysChange()
    toast.success('Day removed')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-blue-400" />
          <p className="text-sm font-semibold text-zinc-300">Tournament days</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setAdding(v => !v)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add day
        </Button>
      </div>

      {adding && (
        <form onSubmit={addDay} className="flex items-end gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
          <div className="space-y-1 flex-1">
            <Label htmlFor="day-date">Date</Label>
            <Input id="day-date" type="date" value={date} onChange={e => setDate(e.target.value)} required className="[color-scheme:dark]" />
          </div>
          <div className="space-y-1 flex-1">
            <Label htmlFor="day-label">Label (optional)</Label>
            <Input id="day-label" value={label} onChange={e => setLabel(e.target.value)} placeholder={`Day ${days.length + 1}`} />
          </div>
          <Button type="submit" variant="blue" disabled={saving || !date}>Add</Button>
          <Button type="button" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
        </form>
      )}

      {days.length > 0 && (
        <div className="space-y-1.5">
          {days.map(d => (
            <div key={d.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider w-12">
                  {d.label ?? `Day ${d.day_number}`}
                </span>
                <span className="text-sm text-zinc-300">
                  {format(new Date(d.date + 'T00:00:00'), 'EEEE, MMM d')}
                </span>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeDay(d.id)}>
                <Trash2 className="h-3.5 w-3.5 text-zinc-600 hover:text-red-400" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {days.length === 0 && !adding && (
        <p className="text-xs text-zinc-600 text-center py-2">No days set — matches will show without date grouping.</p>
      )}
    </div>
  )
}
