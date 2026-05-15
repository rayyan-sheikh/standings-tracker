import { useState, useMemo, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '@/shared/lib/supabase'
import type { TournamentDay, MatchWithTeams } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import DatePicker from '@/shared/ui/date-picker'
import TimePicker from '@/shared/ui/time-picker'
import { CalendarDays, ChevronLeft, ChevronUp, ChevronDown, Plus, Trash2, Loader2 } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { toast } from 'sonner'

interface Props {
  tournamentId: string
  days: TournamentDay[]
  matches: MatchWithTeams[]
  onUpdate: () => void
}

interface DayForm {
  count: number
  startTime: string
  gapMinutes: number
}

interface DayConfig extends DayForm {
  day: TournamentDay
}

export default function SmartScheduler({ tournamentId, days, matches, onUpdate }: Props) {
  const [open, setOpen] = useState(false)
  const [applying, setApplying] = useState(false)
  const [currentDayIdx, setCurrentDayIdx] = useState(0)
  const [addingDay, setAddingDay] = useState(false)
  const prevDaysLength = useRef(days.length)

  const sortedDays = [...days].sort((a, b) => a.day_number - b.day_number)

  // Jump to newly added day as soon as days prop grows
  useEffect(() => {
    if (addingDay && sortedDays.length > prevDaysLength.current) {
      const newDay = sortedDays[sortedDays.length - 1]
      if (newDay) {
        setConfigs(c => c[newDay.id] ? c : { ...c, [newDay.id]: { count: 0, startTime: '10:00', gapMinutes: 30 } })
      }
      setCurrentDayIdx(sortedDays.length - 1)
      setAddingDay(false)
    }
    prevDaysLength.current = sortedDays.length
  }, [sortedDays.length, addingDay])
  const unscheduled = matches.filter(m => m.status !== 'completed')


  // Per-day timing configs
  const [configs, setConfigs] = useState<Record<string, DayForm>>({})

  function getConfig(day: TournamentDay, _i: number): DayForm {
    return configs[day.id] ?? { count: 0, startTime: '10:00', gapMinutes: 30 }
  }

  const activeConfigs: DayConfig[] = sortedDays.map((day, i) => ({ day, ...getConfig(day, i) }))
  const currentConfig = activeConfigs[currentDayIdx]

  // RHF for current day timing
  const { watch, setValue, reset } = useForm<DayForm>({
    defaultValues: { count: 0, startTime: '10:00', gapMinutes: 30 },
  })

  useEffect(() => {
    if (currentConfig) reset(getConfig(currentConfig.day, currentDayIdx))
  }, [currentDayIdx, sortedDays.length])

  const formValues = watch()

  // Sync form → configs on change
  useEffect(() => {
    if (!currentConfig) return
    setConfigs(c => ({ ...c, [currentConfig.day.id]: formValues }))
  }, [formValues.count, formValues.startTime, formValues.gapMinutes])

  // Preview
  const preview = useMemo(() => {
    const result: { match: MatchWithTeams; dayId: string; scheduledAt: Date }[] = []
    let idx = 0
    for (const cfg of activeConfigs) {
      const c = configs[cfg.day.id] ?? cfg
      for (let i = 0; i < c.count; i++) {
        if (idx >= unscheduled.length) break
        const [h, m] = c.startTime.split(':').map(Number)
        const dt = new Date(`${cfg.day.date}T00:00:00`)
        dt.setHours(h, m + i * c.gapMinutes, 0, 0)
        result.push({ match: unscheduled[idx], dayId: cfg.day.id, scheduledAt: dt })
        idx++
      }
    }
    return result
  }, [activeConfigs, configs, unscheduled])

  const currentDayPreview = preview.filter(p => currentConfig && p.dayId === currentConfig.day.id)
  const totalScheduled = activeConfigs.reduce((s, cfg) => s + (configs[cfg.day.id]?.count ?? cfg.count), 0)
  const unassigned = Math.max(0, unscheduled.length - Math.min(totalScheduled, unscheduled.length))
  const allAssigned = unassigned === 0 && unscheduled.length > 0

  // Auto-create a new day on + click
  async function addDay() {
    const lastDay = sortedDays[sortedDays.length - 1]
    const nextDate = lastDay
      ? format(addDays(new Date(lastDay.date + 'T00:00:00'), 1), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd')
    const dayNumber = days.length + 1
    setAddingDay(true)
    await supabase.from('tournament_days').insert({
      tournament_id: tournamentId,
      day_number: dayNumber,
      date: nextDate,
      label: `Day ${dayNumber}`,
    })
    onUpdate()
    toast.success('Day added')
  }

  // Inline edit day name/date on blur
  async function saveField(dayId: string, field: 'label' | 'date', value: string) {
    if (!value.trim()) return
    await supabase.from('tournament_days').update({ [field]: value.trim() }).eq('id', dayId)
    onUpdate()
  }

  async function removeCurrentDay() {
    if (!currentConfig) return
    await supabase.from('tournament_days').delete().eq('id', currentConfig.day.id)
    setCurrentDayIdx(i => Math.max(0, i - 1))
    onUpdate()
    toast.success('Day removed')
  }

  async function applySchedule() {
    setApplying(true)
    await Promise.all(
      preview.map(({ match, dayId, scheduledAt }) =>
        supabase.from('matches').update({ day_id: dayId, scheduled_at: scheduledAt.toISOString() }).eq('id', match.id)
      )
    )
    setApplying(false); setOpen(false); onUpdate()
    toast.success(`${preview.length} matches scheduled${unassigned > 0 ? `, ${unassigned} unscheduled` : ''}`)
  }

  const isLastDay = currentDayIdx === sortedDays.length - 1

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => { setOpen(true); setCurrentDayIdx(0) }}>
        <CalendarDays className="h-3.5 w-3.5 mr-1.5" /> Manage schedule
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm" onOpenAutoFocus={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Tournament schedule</DialogTitle>
          </DialogHeader>

          <p className="text-xs text-zinc-500">
            {unscheduled.length} matches · {unassigned > 0 ? `${unassigned} will be unscheduled` : sortedDays.length > 0 ? 'all assigned' : 'add days to schedule'}
          </p>

          {/* Day navigator */}
          <div className="flex items-center gap-2 bg-zinc-800/50 rounded-xl px-3 py-2.5">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"
              onClick={() => setCurrentDayIdx(i => Math.max(0, i - 1))}
              disabled={currentDayIdx === 0 || sortedDays.length === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {currentConfig ? (
              <Input
                key={currentConfig.day.id}
                defaultValue={currentConfig.day.label ?? `Day ${currentConfig.day.day_number}`}
                onBlur={e => saveField(currentConfig.day.id, 'label', e.target.value)}
                className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm font-bold text-blue-400 text-center px-0 h-auto placeholder:text-zinc-600"
                placeholder="Day name"
              />
            ) : (
              <p className="flex-1 text-sm text-zinc-600 text-center">No days — click + to add</p>
            )}

            {isLastDay || sortedDays.length === 0 ? (
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={addDay} disabled={addingDay || allAssigned}>
                {addingDay
                  ? <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                  : <Plus className={`h-4 w-4 ${allAssigned ? 'text-zinc-700' : 'text-blue-400'}`} />}
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"
                onClick={() => setCurrentDayIdx(i => i + 1)}>
                <ChevronLeft className="h-4 w-4 rotate-180" />
              </Button>
            )}
          </div>

          {/* Date shown outside the box */}
          {currentConfig && (
            <div className="flex justify-center">
              <DatePicker
                value={currentConfig.day.date}
                onChange={date => saveField(currentConfig.day.id, 'date', date)}
              />
            </div>
          )}

          {/* Dot indicators + delete */}
          {sortedDays.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {sortedDays.map((_, i) => (
                  <button key={i} onClick={() => setCurrentDayIdx(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentDayIdx ? 'bg-blue-400' : 'bg-zinc-700'}`} />
                ))}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={removeCurrentDay}>
                <Trash2 className="h-3.5 w-3.5 text-zinc-600 hover:text-red-400" />
              </Button>
            </div>
          )}

          {/* Per-day config via RHF */}
          {currentConfig && (
            <>
              <div className="flex items-start justify-between">

                {/* Matches this day */}
                <div className="flex flex-col items-center gap-1">
                  <p className="text-[10px] text-zinc-300 uppercase tracking-widest">Matches</p>
                  <p className="text-[10px] text-zinc-600 uppercase tracking-widest">{currentDayPreview.length} set</p>
                  <Button variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => setValue('count', formValues.count + 1)}
                    disabled={unassigned === 0}>
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <span className="text-3xl font-bold tabular-nums text-zinc-100 w-14 text-center" style={{ fontFamily: 'Sora, sans-serif' }}>
                    {formValues.count}
                  </span>
                  <Button variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => setValue('count', Math.max(0, formValues.count - 1))}>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>

                {/* Start time */}
                <div className="flex flex-col items-center gap-1">
                  <p className="text-[10px] text-zinc-300 uppercase tracking-widest mb-1">Start time</p>
                  <TimePicker value={formValues.startTime} onChange={v => setValue('startTime', v)} />
                </div>

                {/* Gap */}
                <div className="flex flex-col items-center gap-1">
                  <p className="text-[10px] text-zinc-300 uppercase tracking-widest">Gap</p>
                  <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Min</p>
                  <Button variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => setValue('gapMinutes', formValues.gapMinutes + 5)}>
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <span className="text-3xl font-bold tabular-nums text-zinc-100 w-14 text-center" style={{ fontFamily: 'Sora, sans-serif' }}>
                    {formValues.gapMinutes}
                  </span>
                  <Button variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => setValue('gapMinutes', Math.max(5, formValues.gapMinutes - 5))}>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>

              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600 mb-2">Preview</p>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800 h-[120px] overflow-y-auto no-scrollbar">
                  {currentDayPreview.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-xs text-zinc-700">No matches assigned to this day</p>
                    </div>
                  ) : currentDayPreview.map(({ match, scheduledAt }) => (
                    <div key={match.id} className="flex items-center justify-between px-3 py-2 text-xs">
                      <span className="text-zinc-400 truncate flex-1 mr-2">{match.home_team.name} vs {match.away_team.name}</span>
                      <span className="text-zinc-500 shrink-0 tabular-nums">{format(scheduledAt, 'HH:mm')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button variant="blue" className="w-full" onClick={applySchedule}
                disabled={applying || preview.length === 0}>
                {applying ? 'Scheduling…' : `Apply — schedule ${preview.length} matches`}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
