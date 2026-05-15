import { useState } from 'react'
import { supabase } from '@/shared/lib/supabase'
import type { MatchWithTeams } from '@/shared/types'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Pencil, Minus, Plus, Check, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  match: MatchWithTeams
  matchNumber: number
  maxScore: number
  onUpdate: () => void
}

export default function MatchCard({ match, matchNumber, maxScore, onUpdate }: Props) {
  const [open, setOpen] = useState(false)
  const [homeScore, setHomeScore] = useState(match.home_score ?? 0)
  const [awayScore, setAwayScore] = useState(match.away_score ?? 0)
  const [saving, setSaving] = useState(false)

  function openDialog() {
    setHomeScore(match.home_score ?? 0); setAwayScore(match.away_score ?? 0); setOpen(true)
  }

  async function saveResult() {
    setSaving(true)
    await supabase.from('matches').update({ home_score: homeScore, away_score: awayScore, status: 'completed' }).eq('id', match.id)
    setSaving(false); setOpen(false); onUpdate()
    toast.success('Result saved')
  }

  async function resetResult() {
    setSaving(true)
    await supabase.from('matches').update({ home_score: null, away_score: null, status: 'scheduled' }).eq('id', match.id)
    setSaving(false); setOpen(false); onUpdate()
    toast.success('Result reset')
  }

  const isCompleted = match.status === 'completed'

  return (
    <>
      <div
        className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 cursor-pointer hover:border-zinc-700 hover:bg-zinc-800/60 transition-colors"
        onClick={openDialog}
      >
        <span className="flex-1 text-right font-medium text-sm text-zinc-200 truncate">{match.home_team.name}</span>
        {isCompleted ? (
          <Badge variant="outline" className="font-mono text-base px-4 py-1 shrink-0">
            {match.home_score} – {match.away_score}
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-xs shrink-0 px-3">vs</Badge>
        )}
        <span className="flex-1 font-medium text-sm text-zinc-200 truncate">{match.away_team.name}</span>
        <span className="text-[10px] text-zinc-700 shrink-0 font-medium">#{matchNumber}</span>
        <Pencil className="h-3.5 w-3.5 text-zinc-700 shrink-0" />
      </div>

      <Dialog open={open} onOpenChange={v => !v && setOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Enter result</DialogTitle></DialogHeader>
          <div className="flex items-center justify-center gap-6 py-4">
            <ScoreControl label={match.home_team.name} value={homeScore} onChange={setHomeScore} max={maxScore} />
            <span className="text-2xl font-bold text-zinc-700">–</span>
            <ScoreControl label={match.away_team.name} value={awayScore} onChange={setAwayScore} max={maxScore} />
          </div>
          <div className="flex gap-2">
            <Button onClick={saveResult} disabled={saving} variant="blue" className="flex-1">
              <Check className="h-4 w-4 mr-1" />
              {saving ? 'Saving…' : 'Confirm'}
            </Button>
            {match.status === 'completed' && (
              <Button onClick={resetResult} disabled={saving} variant="outline" size="icon" title="Reset match">
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
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
