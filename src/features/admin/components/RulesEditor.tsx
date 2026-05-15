import { useState } from 'react'
import { toast } from 'sonner'
import type { TournamentRules, ParticipantType } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Check } from 'lucide-react'

interface Props {
  rules: TournamentRules
  participantType: ParticipantType
  onSave: (rules: TournamentRules, participantType: ParticipantType) => Promise<void>
}

export default function RulesEditor({ rules, participantType, onSave }: Props) {
  const [local, setLocal] = useState<TournamentRules>(rules)
  const [localParticipant, setLocalParticipant] = useState<ParticipantType>(participantType)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function set(key: keyof TournamentRules, value: string) {
    const n = parseInt(value)
    if (!isNaN(n) && n >= 0) setLocal(r => ({ ...r, [key]: n }))
  }

  function setText(key: keyof TournamentRules, value: string) {
    setLocal(r => ({ ...r, [key]: value }))
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
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Participants</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {(['team', 'player'] as ParticipantType[]).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setLocalParticipant(p)}
                className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                  localParticipant === p
                    ? 'border-blue-500/60 bg-blue-900/20 text-blue-300'
                    : 'border-zinc-700 bg-zinc-800/40 text-zinc-400 hover:border-zinc-600'
                }`}
              >
                {p === 'team' ? 'Teams' : 'Players'}
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
              <Input type="number" min={0} value={local[f.key] as number} onChange={e => set(f.key, e.target.value)} className="w-20 text-center" />
            </div>
          ))}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-200">Score unit</p>
              <p className="text-xs text-zinc-600">Singular form, e.g. point, goal, run</p>
            </div>
            <Input type="text" value={local.score_unit} onChange={e => setText('score_unit', e.target.value)} className="w-28 text-center" placeholder="point" />
          </div>
          <Button onClick={handleSave} disabled={saving} variant="blue" className="w-full">
            {saved ? <><Check className="h-4 w-4 mr-1" /> Saved</> : saving ? 'Saving…' : 'Save rules'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
