import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Team, Leg } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Shuffle } from 'lucide-react'

interface Props {
  tournamentId: string
  teams: Team[]
  legs: Leg[]
  onTeamsChange: () => void
  onAddLeg: () => Promise<void>
}

export default function TeamManager({ tournamentId, teams, legs, onTeamsChange, onAddLeg }: Props) {
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [generatingLeg, setGeneratingLeg] = useState(false)

  async function addTeam(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    await supabase.from('teams').insert({ tournament_id: tournamentId, name: newName.trim() })
    setNewName('')
    setAdding(false)
    onTeamsChange()
  }

  async function removeTeam(id: string) {
    await supabase.from('teams').delete().eq('id', id)
    onTeamsChange()
  }

  async function handleAddLeg() {
    if (teams.length < 2) return
    setGeneratingLeg(true)
    await onAddLeg()
    setGeneratingLeg(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <form onSubmit={addTeam} className="flex gap-2">
          <Input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Team name"
            className="flex-1"
          />
          <Button type="submit" disabled={adding || !newName.trim()}>
            <Plus className="h-4 w-4 mr-1" /> Add team
          </Button>
        </form>
      </div>

      {teams.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-6">No teams yet.</p>
      ) : (
        <ul className="space-y-2">
          {teams.map(t => (
            <li key={t.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
              <span className="font-medium">{t.name}</span>
              <Button variant="ghost" size="icon" onClick={() => removeTeam(t.id)}>
                <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-slate-200 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Legs</p>
            <p className="text-xs text-slate-500">{legs.length} leg{legs.length !== 1 ? 's' : ''} · {teams.length} team{teams.length !== 1 ? 's' : ''}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddLeg}
            disabled={teams.length < 2 || generatingLeg}
            title={teams.length < 2 ? 'Add at least 2 teams first' : ''}
          >
            <Shuffle className="h-4 w-4 mr-1" />
            {generatingLeg ? 'Generating…' : `Add Leg ${legs.length + 1}`}
          </Button>
        </div>
        {legs.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {legs.map(l => (
              <Badge key={l.id} variant="secondary">{l.name ?? `Leg ${l.leg_number}`}</Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
