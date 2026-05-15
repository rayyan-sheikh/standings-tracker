import { useState, useRef } from 'react'
import { toast } from 'sonner'
import type { TournamentRules, ParticipantType, Tiebreaker } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Check, GripVertical, ChevronUp, ChevronDown, Minus, Plus } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

function Counter({ value, onChange, min = 0, max }: { value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  function handleInput(raw: string) {
    const n = parseInt(raw)
    if (raw === '' || raw === '-') return
    if (!isNaN(n)) onChange(max !== undefined ? Math.min(max, Math.max(min, n)) : Math.max(min, n))
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="icon" className="h-7 w-7"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}>
        <Minus className="h-3 w-3" />
      </Button>
      <input
        type="number"
        value={value}
        onChange={e => handleInput(e.target.value)}
        className="w-12 h-7 text-center text-sm font-bold tabular-nums text-zinc-100 bg-transparent border-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        style={{ fontFamily: 'Sora, sans-serif' }}
      />
      <Button variant="outline" size="icon" className="h-7 w-7"
        onClick={() => onChange(max !== undefined ? Math.min(max, value + 1) : value + 1)}>
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  )
}

interface Props {
  rules: TournamentRules
  participantType: ParticipantType
  totalTeams: number
  onSave: (rules: TournamentRules, participantType: ParticipantType) => Promise<void>
}

const TIEBREAKER_LABELS: Record<Tiebreaker, { label: string; description: string }> = {
  head_to_head: { label: 'Head-to-head', description: 'Mini-table among tied teams' },
  gd: { label: 'Goal difference', description: 'Goals scored minus goals conceded' },
  gf: { label: 'Goals scored', description: 'Total goals / points scored' },
  ga: { label: 'Goals conceded', description: 'Fewer goals conceded wins' },
  wins: { label: 'Most wins', description: 'Total number of wins' },
}

const ALL_TIEBREAKERS: Tiebreaker[] = ['head_to_head', 'gd', 'gf', 'ga', 'wins']

export default function RulesEditor({ rules, participantType, totalTeams, onSave }: Props) {
  const [local, setLocal] = useState<TournamentRules>({
    ...rules,
    tiebreakers: rules.tiebreakers ?? ['head_to_head', 'gd', 'gf'],
    promotion_spots: rules.promotion_spots ?? 0,
    relegation_spots: rules.relegation_spots ?? 0,
  })
  const [localParticipant, setLocalParticipant] = useState<ParticipantType>(participantType)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const dragIdx = useRef<number | null>(null)

  function set(key: keyof TournamentRules, n: number) {
    setLocal(r => {
      const updated = { ...r, [key]: n }
      if (key === 'promotion_spots' || key === 'relegation_spots') {
        const total = updated.promotion_spots + updated.relegation_spots
        if (totalTeams > 0 && total > totalTeams) {
          updated[key as 'promotion_spots' | 'relegation_spots'] = Math.max(0, n - (total - totalTeams))
        }
      }
      return updated
    })
  }

  function setText(key: keyof TournamentRules, value: string) {
    setLocal(r => ({ ...r, [key]: value }))
  }

  function moveTiebreaker(index: number, dir: -1 | 1) {
    const tbs = [...local.tiebreakers]
    const target = index + dir
    if (target < 0 || target >= tbs.length) return
    ;[tbs[index], tbs[target]] = [tbs[target], tbs[index]]
    setLocal(r => ({ ...r, tiebreakers: tbs }))
  }

  function toggleTiebreaker(tb: Tiebreaker) {
    const tbs = local.tiebreakers
    if (tbs.includes(tb)) {
      setLocal(r => ({ ...r, tiebreakers: tbs.filter(t => t !== tb) }))
    } else {
      setLocal(r => ({ ...r, tiebreakers: [...tbs, tb] }))
    }
  }

  async function handleSave() {
    setSaving(true); await onSave(local, localParticipant); setSaving(false)
    setSaved(true); setTimeout(() => setSaved(false), 2000)
    toast.success('Rules updated successfully')
  }

  const fields: { key: keyof TournamentRules; label: string; description: string }[] = [
    { key: 'points_win', label: 'Points for a win', description: 'Awarded to the winning team' },
    { key: 'points_draw', label: 'Points for a draw', description: 'Awarded to both teams' },
    { key: 'points_loss', label: 'Points for a loss', description: 'Awarded to the losing team' },
    { key: 'max_score', label: 'Max score per team', description: 'Upper limit when entering a result' },
    { key: 'promotion_spots', label: 'Promotion spots', description: 'Top N teams highlighted green (0 = off)' },
    { key: 'relegation_spots', label: 'Relegation spots', description: 'Bottom N teams highlighted red (0 = off)' },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Participants</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {([['singles', 'Singles'], ['doubles', 'Doubles'], ['team', 'Teams']] as [ParticipantType, string][]).map(([p, label]) => (
              <button key={p} type="button" onClick={() => setLocalParticipant(p)}
                className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                  localParticipant === p
                    ? 'border-blue-500/60 bg-blue-900/20 text-blue-300'
                    : 'border-zinc-700 bg-zinc-800/40 text-zinc-400 hover:border-zinc-600'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Points rules</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {fields.map(f => (
            <div key={f.key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-zinc-200">{f.label}</p>
                <p className="text-xs text-zinc-600">{f.description}</p>
              </div>
              <Counter
                value={(local[f.key] as number) ?? 0}
                onChange={n => set(f.key, n)}
                max={f.key === 'promotion_spots' || f.key === 'relegation_spots'
                  ? Math.max(0, totalTeams - (f.key === 'promotion_spots' ? local.relegation_spots : local.promotion_spots))
                  : undefined}
              />
            </div>
          ))}
          {totalTeams > 0 && local.promotion_spots + local.relegation_spots > totalTeams && (
            <p className="text-xs text-red-400">Promotion + relegation spots exceed total teams ({totalTeams})</p>
          )}

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-200">Score unit</p>
              <p className="text-xs text-zinc-600">Singular form, e.g. point, goal, run</p>
            </div>
            <Input type="text" value={local.score_unit} onChange={e => setText('score_unit', e.target.value)} className="w-28 text-center" placeholder="point" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tiebreakers</CardTitle>
          <p className="text-xs text-zinc-500 mt-1">Applied in order when teams are level on points.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Active tiebreakers — ordered */}
          <div className="space-y-1.5">
            {local.tiebreakers.map((tb, i) => (
              <div
                key={tb}
                draggable
                onDragStart={() => { dragIdx.current = i }}
                onDragOver={e => e.preventDefault()}
                onDrop={() => {
                  if (dragIdx.current === null || dragIdx.current === i) return
                  const tbs = [...local.tiebreakers]
                  const [moved] = tbs.splice(dragIdx.current, 1)
                  tbs.splice(i, 0, moved)
                  dragIdx.current = null
                  setLocal(r => ({ ...r, tiebreakers: tbs }))
                }}
                className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/40 px-3 py-2 cursor-grab active:cursor-grabbing active:opacity-50 transition-opacity"
              >
                <GripVertical className="h-4 w-4 text-zinc-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200">{TIEBREAKER_LABELS[tb].label}</p>
                  <p className="text-xs text-zinc-600">{TIEBREAKER_LABELS[tb].description}</p>
                </div>
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveTiebreaker(i, -1)} disabled={i === 0}
                    className="text-zinc-600 hover:text-zinc-300 disabled:opacity-20 transition-colors">
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => moveTiebreaker(i, 1)} disabled={i === local.tiebreakers.length - 1}
                    className="text-zinc-600 hover:text-zinc-300 disabled:opacity-20 transition-colors">
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button onClick={() => toggleTiebreaker(tb)}
                  className="text-xs text-zinc-600 hover:text-red-400 transition-colors ml-1">
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Inactive tiebreakers — can add */}
          {ALL_TIEBREAKERS.filter(tb => !local.tiebreakers.includes(tb)).length > 0 && (
            <div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1.5">Add tiebreaker</p>
              <div className="flex flex-wrap gap-2">
                {ALL_TIEBREAKERS.filter(tb => !local.tiebreakers.includes(tb)).map(tb => (
                  <button key={tb} onClick={() => toggleTiebreaker(tb)}
                    className={cn(
                      'text-xs px-2.5 py-1 rounded-full border border-zinc-700 text-zinc-500',
                      'hover:border-blue-500/60 hover:text-blue-400 transition-colors'
                    )}>
                    + {TIEBREAKER_LABELS[tb].label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-[10px] text-zinc-700">Alphabetical is always the final fallback.</p>

          <Button onClick={handleSave} disabled={saving} variant="blue" className="w-full">
            {saved ? <><Check className="h-4 w-4 mr-1" /> Saved</> : saving ? 'Saving…' : 'Save rules'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
