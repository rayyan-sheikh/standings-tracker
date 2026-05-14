import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { MatchWithTeams } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, Pencil } from 'lucide-react'

interface Props {
  match: MatchWithTeams
  onUpdate: () => void
}

export default function MatchCard({ match, onUpdate }: Props) {
  const [editing, setEditing] = useState(false)
  const [homeScore, setHomeScore] = useState(match.home_score?.toString() ?? '')
  const [awayScore, setAwayScore] = useState(match.away_score?.toString() ?? '')
  const [saving, setSaving] = useState(false)

  async function saveResult() {
    const h = parseInt(homeScore)
    const a = parseInt(awayScore)
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return
    setSaving(true)
    await supabase.from('matches').update({
      home_score: h,
      away_score: a,
      status: 'completed',
    }).eq('id', match.id)
    setSaving(false)
    setEditing(false)
    onUpdate()
  }

  const isCompleted = match.status === 'completed'

  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <span className="flex-1 text-right font-medium text-sm truncate">{match.home_team.name}</span>

      {editing ? (
        <div className="flex items-center gap-1 shrink-0">
          <Input
            type="number"
            min={0}
            value={homeScore}
            onChange={e => setHomeScore(e.target.value)}
            className="w-14 text-center"
          />
          <span className="text-slate-400 font-bold">–</span>
          <Input
            type="number"
            min={0}
            value={awayScore}
            onChange={e => setAwayScore(e.target.value)}
            className="w-14 text-center"
          />
          <Button size="icon" variant="default" onClick={saveResult} disabled={saving}>
            <Check className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 shrink-0">
          {isCompleted ? (
            <Badge variant="outline" className="font-mono text-sm px-3 py-1 cursor-pointer" onClick={() => setEditing(true)}>
              {match.home_score} – {match.away_score}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs cursor-pointer" onClick={() => setEditing(true)}>
              vs
            </Badge>
          )}
          <Button size="icon" variant="ghost" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5 text-slate-400" />
          </Button>
        </div>
      )}

      <span className="flex-1 font-medium text-sm truncate">{match.away_team.name}</span>
    </div>
  )
}
