import { useState } from 'react'
import { supabase } from '@/shared/lib/supabase'
import type { MatchWithTeams } from '@/shared/types'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import DateTimePicker from '@/shared/ui/date-time-picker'
import DayTimePicker from '@/shared/ui/day-time-picker'
import type { TournamentDay } from '@/shared/types'
import { Pencil, Minus, Plus, Check, RotateCcw, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Props {
  match: MatchWithTeams
  matchNumber: number
  maxScore: number
  days: TournamentDay[]
  onUpdate: () => void
}

export default function MatchCard({ match, matchNumber, maxScore, days, onUpdate }: Props) {
  const [scoreOpen, setScoreOpen] = useState(false)
  const [timeOpen, setTimeOpen] = useState(false)
  const [homeScore, setHomeScore] = useState(match.home_score ?? 0)
  const [awayScore, setAwayScore] = useState(match.away_score ?? 0)
  const [scheduledAt, setScheduledAt] = useState(match.scheduled_at ?? '')
  const [saving, setSaving] = useState(false)

  function openScore() {
    setHomeScore(match.home_score ?? 0)
    setAwayScore(match.away_score ?? 0)
    setScoreOpen(true)
  }

  async function saveResult() {
    setSaving(true)
    await supabase.from('matches').update({
      home_score: homeScore,
      away_score: awayScore,
      status: 'completed',
    }).eq('id', match.id)
    setSaving(false); setScoreOpen(false); onUpdate()
    toast.success('Result saved')
  }

  async function saveTime(dayId: string | null, iso: string | null) {
    setScheduledAt(iso ?? '')
    await supabase.from('matches').update({ scheduled_at: iso || null, day_id: dayId || null }).eq('id', match.id)
    onUpdate()
    toast.success(iso ? 'Time scheduled' : 'Schedule cleared')
  }

  async function saveDateTimeOnly(iso: string) {
    setScheduledAt(iso)
    await supabase.from('matches').update({ scheduled_at: iso || null }).eq('id', match.id)
    onUpdate()
    toast.success(iso ? 'Time scheduled' : 'Schedule cleared')
  }

  async function resetResult() {
    setSaving(true)
    await supabase.from('matches').update({ home_score: null, away_score: null, status: 'scheduled' }).eq('id', match.id)
    setSaving(false); setScoreOpen(false); onUpdate()
    toast.success('Result reset')
  }

  const isCompleted = match.status === 'completed'
  const scheduled = match.scheduled_at ? format(new Date(match.scheduled_at), 'MMM d · HH:mm') : null

  return (
    <>
      <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 hover:border-zinc-700 hover:bg-zinc-800/60 transition-colors">

        {/* Main match info — clickable for score */}
        <div className="flex flex-col flex-1 min-w-0 cursor-pointer" onClick={openScore}>
          <div className="flex items-center gap-3">
            <span className="flex-1 text-right font-medium text-sm text-zinc-200 truncate">{match.home_team.name}</span>
            {isCompleted ? (
              <Badge variant="outline" className="font-mono text-base px-4 py-1 shrink-0">
                {match.home_score} – {match.away_score}
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs px-3 shrink-0">vs</Badge>
            )}
            <span className="flex-1 font-medium text-sm text-zinc-200 truncate">{match.away_team.name}</span>
          </div>
          {scheduled && !isCompleted && (
            <p className="text-[10px] text-zinc-400 flex items-center justify-center gap-1 mt-1.5">
              <Clock className="h-2.5 w-2.5" />{scheduled}
            </p>
          )}
        </div>

        {/* Actions */}
        <span className="text-[10px] text-zinc-700 font-medium shrink-0">#{matchNumber}</span>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setTimeOpen(true)} title="Set time">
          <Clock className="h-3.5 w-3.5 text-zinc-500" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={openScore} title="Enter score">
          <Pencil className="h-3.5 w-3.5 text-zinc-600" />
        </Button>
      </div>

      {/* Score dialog */}
      <Dialog open={scoreOpen} onOpenChange={v => !v && setScoreOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Match #{matchNumber}</DialogTitle></DialogHeader>
          <div className="flex items-center justify-center gap-6 py-4">
            <ScoreControl label={match.home_team.name} value={homeScore} onChange={setHomeScore} max={maxScore} />
            <span className="text-2xl font-bold text-zinc-700">–</span>
            <ScoreControl label={match.away_team.name} value={awayScore} onChange={setAwayScore} max={maxScore} />
          </div>
          <div className="flex gap-2">
            <Button onClick={saveResult} disabled={saving} variant="blue" className="flex-1">
              <Check className="h-4 w-4 mr-1" />
              {saving ? 'Saving…' : 'Confirm result'}
            </Button>
            {isCompleted && (
              <Button onClick={resetResult} disabled={saving} variant="outline" size="icon" title="Reset">
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Time dialog */}
      <Dialog open={timeOpen} onOpenChange={v => !v && setTimeOpen(false)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Schedule match #{matchNumber}</DialogTitle>
          </DialogHeader>
          {days.length > 0 ? (
            <DayTimePicker
              days={days}
              value={match.day_id && match.scheduled_at ? { dayId: match.day_id, scheduledAt: match.scheduled_at } : null}
              onChange={(dayId, iso) => { saveTime(dayId, iso); setTimeOpen(false) }}
            />
          ) : (
            <DateTimePicker value={scheduledAt} onChange={v => { saveDateTimeOnly(v); setTimeOpen(false) }} />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function ScoreControl({ label, value, onChange, max }: {
  label: string; value: number; onChange: (v: number) => void; max: number
}) {
  return (
    <div className="flex flex-col items-center gap-2 min-w-0">
      <p className="text-xs font-medium text-zinc-500 text-center truncate w-24">{label}</p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => onChange(Math.max(0, value - 1))} className="h-9 w-9">
          <Minus className="h-4 w-4" />
        </Button>
        <span className="text-3xl font-bold w-10 text-center tabular-nums text-zinc-100" style={{ fontFamily: 'Sora, sans-serif' }}>{value}</span>
        <Button variant="outline" size="icon" onClick={() => onChange(Math.min(max, value + 1))} className="h-9 w-9">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
