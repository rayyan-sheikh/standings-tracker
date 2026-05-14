import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Team, Leg } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Shuffle, Pencil, Check, X } from 'lucide-react'

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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

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

  function startEdit(team: Team) {
    setEditingId(team.id)
    setEditName(team.name)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return
    await supabase.from('teams').update({ name: editName.trim() }).eq('id', id)
    setEditingId(null)
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
      <form onSubmit={addTeam} className="flex gap-2">
        <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Team name" className="flex-1" />
        <Button type="submit" variant="blue" disabled={adding || !newName.trim()}>
          <Plus className="h-4 w-4 mr-1" /> Add team
        </Button>
      </form>

      {teams.length === 0 ? (
        <p className="text-sm text-zinc-600 text-center py-6">No teams yet.</p>
      ) : (
        <ul className="space-y-2">
          {teams.map(t => (
            <li key={t.id} className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5">
              {editingId === t.id ? (
                <>
                  <Input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(t.id); if (e.key === 'Escape') cancelEdit() }}
                    className="flex-1 h-8"
                    autoFocus
                  />
                  <Button size="icon" variant="blue" className="h-8 w-8 shrink-0" onClick={() => saveEdit(t.id)}>
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={cancelEdit}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 font-medium text-zinc-200">{t.name}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => startEdit(t)}>
                    <Pencil className="h-3.5 w-3.5 text-zinc-600 hover:text-zinc-300" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeTeam(t.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-zinc-600 hover:text-red-400" />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-zinc-800 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-300">Legs</p>
            <p className="text-xs text-zinc-600">{legs.length} leg{legs.length !== 1 ? 's' : ''} · {teams.length} team{teams.length !== 1 ? 's' : ''}</p>
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
