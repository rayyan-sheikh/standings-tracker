import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase'
import type { Tournament, TournamentType, SportType, ParticipantType } from '@/shared/types'
import { DEFAULT_RULES, TOURNAMENT_TYPES, SPORTS } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import Logo from '@/shared/ui/logo'
import Footer from '@/shared/ui/footer'
import { Plus, LogOut, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminDashboard() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  type FormValues = { name: string; description: string; type: TournamentType; sport: SportType; participantType: ParticipantType }
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { name: '', description: '', type: 'league', sport: 'custom', participantType: 'team' },
  })
  const [showSignOut, setShowSignOut] = useState(false)
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null)
  const [editTournamentName, setEditTournamentName] = useState('')
  const [deletingTournament, setDeletingTournament] = useState<Tournament | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchTournaments() }, [])

  async function fetchTournaments() {
    setLoading(true)
    const { data } = await supabase.from('tournaments').select('*, teams(count)').order('created_at', { ascending: false })
    if (data) setTournaments(data)
    setLoading(false)
  }

  async function createTournament(data: { name: string; description: string; type: TournamentType; sport: SportType; participantType: ParticipantType }) {
    setCreating(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('tournaments').insert({ name: data.name, description: data.description || null, type: data.type, sport: data.sport, participant_type: data.participantType, rules: DEFAULT_RULES, user_id: user?.id })
    reset(); setShowForm(false); setCreating(false)
    fetchTournaments()
    toast.success('Tournament created')
  }

  function closeForm() { setShowForm(false); reset() }

  async function updateTournamentName() {
    if (!editingTournament || !editTournamentName.trim()) return
    setSaving(true)
    await supabase.from('tournaments').update({ name: editTournamentName.trim() }).eq('id', editingTournament.id)
    setSaving(false); setEditingTournament(null); fetchTournaments()
    toast.success('Tournament name updated')
  }

  async function deleteTournament() {
    if (!deletingTournament) return
    const name = deletingTournament.name
    await supabase.from('tournaments').delete().eq('id', deletingTournament.id)
    setDeletingTournament(null); fetchTournaments()
    toast.success(`"${name}" deleted`)
  }

  async function signOut() { await supabase.auth.signOut() }

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="bg-zinc-900 border-b border-zinc-800 px-4 sm:px-6 py-4 flex items-center justify-between">
        <Logo color="blue" />
        <Button variant="ghost" size="sm" onClick={() => setShowSignOut(true)}>
          <LogOut className="h-4 w-4 mr-1" /> Sign out
        </Button>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-zinc-100">Tournaments</h2>
          <Button size="sm" variant="blue" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" /> New tournament
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-5 animate-pulse">
                <div className="h-3.5 w-40 bg-zinc-800 rounded mb-2" />
                <div className="h-2.5 w-24 bg-zinc-800/60 rounded" />
              </div>
            ))}
          </div>
        ) : tournaments.length === 0 ? (
          <p className="text-zinc-600 text-sm text-center py-12">No tournaments yet. Create your first one!</p>
        ) : (
          <div className="flex flex-col gap-2">
            {tournaments.map(t => (
              <Card key={t.id} className="hover:border-zinc-700 transition-colors">
                <CardContent className="flex items-center justify-between py-4 gap-2">
                  <Link to={`/admin/tournament/${t.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-zinc-100">{t.name}</p>
                      {t.status === 'completed' && (
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-500 border border-amber-900/50 rounded px-1.5 py-0.5">Done</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-600 mt-0.5 capitalize">
                      {t.sport}
                      {' · '}
                      {t.participant_type === 'singles' ? 'Singles' : t.participant_type === 'doubles' ? 'Doubles' : 'Teams'}
                      {' · '}
                      {(t as unknown as { teams: { count: number }[] }).teams?.[0]?.count ?? 0}
                      {' '}
                      {t.participant_type === 'singles' ? 'players' : t.participant_type === 'doubles' ? 'pairs' : 'teams'}
                      {t.description ? ` · ${t.description}` : ''}
                    </p>
                  </Link>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingTournament(t); setEditTournamentName(t.name) }}>
                      <Pencil className="h-3.5 w-3.5 text-zinc-600" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeletingTournament(t)}>
                      <Trash2 className="h-3.5 w-3.5 text-zinc-600 hover:text-red-400" />
                    </Button>
                    <ChevronRight className="h-4 w-4 text-zinc-700 ml-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer color="blue" />

      {/* Edit tournament name */}
      <Dialog open={!!editingTournament} onOpenChange={v => !v && setEditingTournament(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit tournament name</DialogTitle></DialogHeader>
          <Input value={editTournamentName} onChange={e => setEditTournamentName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && updateTournamentName()}
            autoFocus />
          <div className="flex gap-2 pt-1">
            <Button variant="blue" className="flex-1" disabled={saving} onClick={updateTournamentName}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button variant="outline" onClick={() => setEditingTournament(null)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete tournament */}
      <Dialog open={!!deletingTournament} onOpenChange={v => !v && setDeletingTournament(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete tournament?</DialogTitle></DialogHeader>
          <p className="text-sm text-zinc-500">
            <span className="text-zinc-300 font-medium">{deletingTournament?.name}</span> and all its teams, legs and matches will be permanently deleted.
          </p>
          <div className="flex gap-2 pt-1">
            <Button variant="destructive" className="flex-1" onClick={deleteTournament}>Delete</Button>
            <Button variant="outline" className="flex-1" onClick={() => setDeletingTournament(null)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSignOut} onOpenChange={setShowSignOut}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sign out?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-500">You'll need to sign in again to manage tournaments.</p>
          <div className="flex gap-2 pt-2">
            <Button variant="destructive" className="flex-1" onClick={signOut}>Sign out</Button>
            <Button variant="outline" className="flex-1" onClick={() => setShowSignOut(false)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showForm} onOpenChange={v => !v && closeForm()}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto no-scrollbar">
          <DialogHeader>
            <DialogTitle>New tournament</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(createTournament)} className="space-y-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="t-name">Name</Label>
              <Input id="t-name" placeholder="Premier League Season 1"
                {...register('name', { required: true })}
                className={errors.name ? 'border-red-500' : ''} />
              {errors.name && <p className="text-xs text-red-400">Name is required</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="t-desc">Description <span className="text-zinc-600">(optional)</span></Label>
              <Input id="t-desc" placeholder="5-a-side tournament" {...register('description')} />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Participants</Label>
              <Controller name="participantType" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full focus:ring-blue-500/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="singles">Singles</SelectItem>
                    <SelectItem value="doubles">Doubles</SelectItem>
                    <SelectItem value="team">Teams</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Tournament type</Label>
                <Controller name="type" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full focus:ring-blue-500/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TOURNAMENT_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value} description={t.description}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Sport</Label>
                <Controller name="sport" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full focus:ring-blue-500/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SPORTS.map(s => (
                        <SelectItem key={s.value} value={s.value} description={s.description}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" variant="blue" disabled={creating} className="flex-1">
                {creating ? 'Creating…' : 'Create tournament'}
              </Button>
              <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
