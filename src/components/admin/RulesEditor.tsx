import { useState } from 'react'
import type { TournamentRules } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'

interface Props {
  rules: TournamentRules
  onSave: (rules: TournamentRules) => Promise<void>
}

export default function RulesEditor({ rules, onSave }: Props) {
  const [local, setLocal] = useState<TournamentRules>(rules)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function set(key: keyof TournamentRules, value: string) {
    const n = parseInt(value)
    if (!isNaN(n) && n >= 0) setLocal(r => ({ ...r, [key]: n }))
  }

  async function handleSave() {
    setSaving(true)
    await onSave(local)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const fields: { key: keyof TournamentRules; label: string; description: string }[] = [
    { key: 'points_win', label: 'Points for a win', description: 'Awarded to the winning team' },
    { key: 'points_draw', label: 'Points for a draw', description: 'Awarded to both teams' },
    { key: 'points_loss', label: 'Points for a loss', description: 'Awarded to the losing team' },
    { key: 'max_score', label: 'Max score per team', description: 'Upper limit when entering a result' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Points rules</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {fields.map(f => (
          <div key={f.key} className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{f.label}</p>
              <p className="text-xs text-slate-500">{f.description}</p>
            </div>
            <Input
              type="number"
              min={0}
              value={local[f.key]}
              onChange={e => set(f.key, e.target.value)}
              className="w-20 text-center"
            />
          </div>
        ))}

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saved ? <><Check className="h-4 w-4 mr-1" /> Saved</> : saving ? 'Saving…' : 'Save rules'}
        </Button>
      </CardContent>
    </Card>
  )
}
