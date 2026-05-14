import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { MatchWithTeams } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Pencil, Minus, Plus, Check } from 'lucide-react'

interface Props {
  match: MatchWithTeams
  maxScore: number
  onUpdate: () => void
}

export default function MatchCard({ match, maxScore, onUpdate }: Props) {
  const [open, setOpen] = useState(false)
  const [homeScore, setHomeScore] = useState(match.home_score ?? 0)
  const [awayScore, setAwayScore] = useState(match.away_score ?? 0)
  const [saving, setSaving] = useState(false)

  function openDialog() {
    setHomeScore(match.home_score ?? 0)
    setAwayScore(match.away_score ?? 0)
    setOpen(true)
  }

  async function saveResult() {
    setSaving(true)
    await supabase.from('matches').update({
      home_score: homeScore,
      away_score: awayScore,
      status: 'completed',
    }).eq('id', match.id)
    setSaving(false)
    setOpen(false)
    onUpdate()
  }

  const isCompleted = match.status === 'completed'

  return (
    <>
      <div
        className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 cursor-pointer hover:border-slate-300 transition-colors"
        onClick={openDialog}
      >
        <span className="flex-1 text-right font-medium text-sm truncate">{match.home_team.name}</span>

        {isCompleted ? (
          <Badge variant="outline" className="font-mono text-base px-4 py-1 shrink-0">
            {match.home_score} – {match.away_score}
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-xs shrink-0 px-3">vs</Badge>
        )}

        <span className="flex-1 font-medium text-sm truncate">{match.away_team.name}</span>

        <Pencil className="h-3.5 w-3.5 text-slate-300 shrink-0" />
      </div>

      <Dialog open={open} onOpenChange={v => !v && setOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Enter result</DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-center gap-6 py-4">
            <ScoreControl
              label={match.home_team.name}
              value={homeScore}
              onChange={setHomeScore}
              max={maxScore}
            />

            <span className="text-2xl font-bold text-slate-300">–</span>

            <ScoreControl
              label={match.away_team.name}
              value={awayScore}
              onChange={setAwayScore}
              max={maxScore}
            />
          </div>

          <Button onClick={saveResult} disabled={saving} className="w-full">
            <Check className="h-4 w-4 mr-1" />
            {saving ? 'Saving…' : 'Confirm result'}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ScoreControl({ label, value, onChange, max }: {
  label: string
  value: number
  onChange: (v: number) => void
  max: number
}) {
  return (
    <div className="flex flex-col items-center gap-2 min-w-0">
      <p className="text-xs font-medium text-slate-500 text-center truncate w-24">{label}</p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="h-9 w-9"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="text-3xl font-bold w-10 text-center tabular-nums">{value}</span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="h-9 w-9"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
