import { useState } from 'react'
import { supabase } from '@/shared/lib/supabase'
import type { Team, Leg, ParticipantType } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Badge } from '@/shared/ui/badge'
import { Plus, Trash2, Shuffle, Pencil, Check, X, AlertTriangle, Info } from 'lucide-react'

interface Props {
  tournamentId: string
  teams: Team[]
  legs: Leg[]
  participantType: ParticipantType
  hasPlayedMatches: boolean
  onTeamsChange: () => void
  onAddLeg: () => Promise<void>
  onResetMatches: () => Promise<void>
}

export default function TeamManager({ tournamentId, teams, legs, participantType, hasPlayedMatches, onTeamsChange, onAddLeg, onResetMatches }: Props) {
  const label = participantType === 'player' ? 'player' : 'team'
  const labelPlural = participantType === 'player' ? 'players' : 'teams'
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [generatingLeg, setGeneratingLeg] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  async function addTeam(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    const names = newName.split(',').map(n => n.trim()).filter(Boolean)
    const rows = names.map(name => ({ tournament_id: tournamentId, name }))
    await supabase.from('teams').insert(rows)
    setNewName(''); setAdding(false); onTeamsChange()
  }

  async function removeTeam(id: string) {
    await supabase.from('teams').delete().eq('id', id)
    onTeamsChange()
  }

  function startEdit(team: Team) { setEditingId(team.id); setEditName(team.name) }
  function cancelEdit() { setEditingId(null); setEditName('') }

  async function saveEdit(id: string) {
    if (!editName.trim()) return
    await supabase.from('teams').update({ name: editName.trim() }).eq('id', id)
    setEditingId(null); onTeamsChange()
  }

  async function handleAddLeg() {
    if (teams.length < 2) return
    setGeneratingLeg(true); await onAddLeg(); setGeneratingLeg(false)
  }

  return (
    <div className="space-y-6">
      {hasPlayedMatches ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-900/50 bg-amber-950/20 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-400">Cannot add more {labelPlural}</p>
            <p className="text-xs text-amber-700 mt-0.5 mb-3">Matches already exist for this tournament. To add new {labelPlural}, you will need to reset all results first.</p>
            {confirmReset ? (
              <div className="flex items-center gap-2">
                <p className="text-xs text-red-400 font-medium">All results will be lost. Sure?</p>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={resetting}
                  onClick={async () => {
                    setResetting(true)
                    await onResetMatches()
                    setConfirmReset(false)
                    setResetting(false)
                  }}
                >
                  {resetting ? 'Resetting…' : 'Yes, reset all'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmReset(false)}>Cancel</Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setConfirmReset(true)}>
                Reset all results
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
        <div className="flex items-start gap-3 rounded-xl border border-blue-900/50 bg-blue-950/20 px-4 py-3">
          <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-300">
            Add one at a time or multiple using comma-separated names —{' '}
            <span className="text-blue-500">e.g. Arsenal, Chelsea, Liverpool</span>
          </p>
        </div>
        <form onSubmit={addTeam} className="flex gap-2">
          <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder={`${label === 'team' ? 'Team' : 'Player'} name, or comma separated`} className="flex-1" />
          <Button type="submit" variant="blue" disabled={adding || !newName.trim()}>
            <Plus className="h-4 w-4 mr-1" /> Add {newName.split(',').filter(n => n.trim()).length > 1 ? labelPlural : label}
          </Button>
        </form>
        </div>
      )}

      {teams.length === 0 ? (
        <p className="text-sm text-zinc-600 text-center py-6">No {labelPlural} yet.</p>
      ) : (
        <ul className="space-y-2">
          {teams.map(t => (
            <li key={t.id} className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5">
              {editingId === t.id ? (
                <>
                  <Input value={editName} onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(t.id); if (e.key === 'Escape') cancelEdit() }}
                    className="flex-1 h-8" autoFocus />
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
            <p className="text-xs text-zinc-600">{legs.length} leg{legs.length !== 1 ? 's' : ''} · {teams.length} {teams.length !== 1 ? labelPlural : label}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleAddLeg}
            disabled={teams.length < 2 || generatingLeg}
            title={teams.length < 2 ? `Add at least 2 ${labelPlural} first` : ''}>
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
