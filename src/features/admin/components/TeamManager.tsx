import { useState } from 'react'
import { supabase } from '@/shared/lib/supabase'
import type { Team, Leg, ParticipantType } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Plus, Trash2, Shuffle, Pencil, Check, X, AlertTriangle, Info, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

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
  const isDoubles = participantType === 'doubles'
  const label = participantType === 'singles' ? 'player' : isDoubles ? 'pair' : 'team'
  const labelPlural = participantType === 'singles' ? 'players' : isDoubles ? 'pairs' : 'teams'
  const [newName, setNewName] = useState('')
  const [player1, setPlayer1] = useState('')
  const [player2, setPlayer2] = useState('')
  const [adding, setAdding] = useState(false)
  const [generatingLeg, setGeneratingLeg] = useState(false)
  const [deletingLegId, setDeletingLegId] = useState<string | null>(null)
  const [confirmLeg, setConfirmLeg] = useState<{ id: string; name: string } | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editP1, setEditP1] = useState('')
  const [editP2, setEditP2] = useState('')

  async function addTeam(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    if (isDoubles) {
      if (!player1.trim() || !player2.trim()) { setAdding(false); return }
      await supabase.from('teams').insert({ tournament_id: tournamentId, name: `${player1.trim()} / ${player2.trim()}` })
      setPlayer1(''); setPlayer2('')
    } else {
      if (!newName.trim()) { setAdding(false); return }
      const names = newName.split(',').map(n => n.trim()).filter(Boolean)
      const rows = names.map(name => ({ tournament_id: tournamentId, name }))
      await supabase.from('teams').insert(rows)
      setNewName('')
    }
    setAdding(false); onTeamsChange()
    const count = isDoubles ? 1 : newName.split(',').filter(n => n.trim()).length
    toast.success(count > 1 ? `${count} ${labelPlural} added` : `${label.charAt(0).toUpperCase() + label.slice(1)} added`)
  }

  async function removeTeam(id: string) {
    await supabase.from('teams').delete().eq('id', id)
    onTeamsChange()
    toast.success(`${label.charAt(0).toUpperCase() + label.slice(1)} removed`)
  }

  function startEdit(team: Team) {
    setEditingId(team.id)
    if (isDoubles && team.name.includes(' / ')) {
      const [p1, p2] = team.name.split(' / ')
      setEditP1(p1.trim()); setEditP2(p2.trim()); setEditName('')
    } else {
      setEditName(team.name); setEditP1(''); setEditP2('')
    }
  }
  function cancelEdit() { setEditingId(null); setEditName(''); setEditP1(''); setEditP2('') }

  async function saveEdit(id: string) {
    let name = ''
    if (isDoubles) {
      if (!editP1.trim() || !editP2.trim()) return
      name = `${editP1.trim()} / ${editP2.trim()}`
    } else {
      if (!editName.trim()) return
      name = editName.trim()
    }
    await supabase.from('teams').update({ name }).eq('id', id)
    setEditingId(null); onTeamsChange()
    toast.success('Name updated')
  }

  async function deleteLeg(id: string) {
    setDeletingLegId(id)
    await supabase.from('legs').delete().eq('id', id)
    setDeletingLegId(null)
    onTeamsChange()
    toast.success('Leg deleted')
  }

  async function handleAddLeg() {
    if (teams.length < 2) return
    setGeneratingLeg(true); await onAddLeg(); setGeneratingLeg(false)
    toast.success('Leg generated')
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
                    toast.success('All results reset')
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
        {!isDoubles && (
          <div className="flex items-start gap-3 rounded-xl border border-blue-900/50 bg-blue-950/20 px-4 py-3">
            <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-300">
              Add one at a time or multiple using comma-separated names —{' '}
              <span className="text-blue-500">e.g. Arsenal, Chelsea, Liverpool</span>
            </p>
          </div>
        )}
        {isDoubles ? (
          <form onSubmit={addTeam} className="space-y-2">
            <div className="flex gap-2">
              <Input value={player1} onChange={e => setPlayer1(e.target.value)} placeholder="Player 1 name" className="flex-1" required />
              <Input value={player2} onChange={e => setPlayer2(e.target.value)} placeholder="Player 2 name" className="flex-1" required />
            </div>
            {player1.trim() && player2.trim() && (
              <p className="text-xs text-zinc-600">Pair name: <span className="text-zinc-400">{player1.trim()} / {player2.trim()}</span></p>
            )}
            <Button type="submit" variant="blue" disabled={adding || !player1.trim() || !player2.trim()} className="w-full">
              <Plus className="h-4 w-4 mr-1" /> Add pair
            </Button>
          </form>
        ) : (
          <form onSubmit={addTeam} className="flex gap-2">
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder={`${label === 'team' ? 'Team' : 'Player'} name, or comma separated`} className="flex-1" />
            <Button type="submit" variant="blue" disabled={adding || !newName.trim()}>
              <Plus className="h-4 w-4 mr-1" /> Add {newName.split(',').filter(n => n.trim()).length > 1 ? labelPlural : label}
            </Button>
          </form>
        )}
        </div>
      )}

      {teams.length === 0 ? (
        <p className="text-sm text-zinc-600 text-center py-6">No {labelPlural} yet.</p>
      ) : (
        <ul className="space-y-2">
          {teams.map(t => (
            <li key={t.id} className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5">
              {editingId === t.id ? (
                isDoubles ? (
                  <div className="flex flex-1 items-center gap-2">
                    <Input value={editP1} onChange={e => setEditP1(e.target.value)} placeholder="Player 1" className="flex-1 h-8" autoFocus />
                    <span className="text-zinc-600 text-xs shrink-0">/</span>
                    <Input value={editP2} onChange={e => setEditP2(e.target.value)} placeholder="Player 2" className="flex-1 h-8"
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(t.id); if (e.key === 'Escape') cancelEdit() }} />
                    <Button size="icon" variant="blue" className="h-8 w-8 shrink-0" onClick={() => saveEdit(t.id)}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={cancelEdit}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
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
                )
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
          <div className="mt-3 space-y-1.5">
            {legs.map(l => (
              <div key={l.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
                <span className="text-sm font-medium text-blue-400">{l.name ?? `Leg ${l.leg_number}`}</span>
                {legs.length > 1 && (
                  <button
                    onClick={() => setConfirmLeg({ id: l.id, name: l.name ?? `Leg ${l.leg_number}` })}
                    disabled={deletingLegId === l.id}
                    className="text-zinc-700 hover:text-red-400 transition-colors"
                  >
                    {deletingLegId === l.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!confirmLeg} onOpenChange={v => !v && setConfirmLeg(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete {confirmLeg?.name}?</DialogTitle></DialogHeader>
          <p className="text-sm text-zinc-500">All matches in this leg will be permanently deleted.</p>
          <div className="flex gap-2 pt-1">
            <Button variant="destructive" className="flex-1" onClick={() => {
              if (confirmLeg) { deleteLeg(confirmLeg.id); setConfirmLeg(null) }
            }}>Delete</Button>
            <Button variant="outline" className="flex-1" onClick={() => setConfirmLeg(null)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
