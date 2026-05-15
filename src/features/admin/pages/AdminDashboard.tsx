import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase'
import type { Tournament, TournamentRules, TournamentType, SportType, ParticipantType } from '@/shared/types'
import { DEFAULT_RULES, TOURNAMENT_TYPES, SPORTS } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import Logo from '@/shared/ui/logo'
import Footer from '@/shared/ui/footer'
import { Plus, LogOut, ChevronRight } from 'lucide-react'

export default function AdminDashboard() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<TournamentType>('league')
  const [sport, setSport] = useState<SportType>('custom')
  const [participantType, setParticipantType] = useState<ParticipantType>('team')
  const [rules, setRules] = useState<TournamentRules>({ ...DEFAULT_RULES, max_score: 0, score_unit: '' })
  const [maxScoreInput, setMaxScoreInput] = useState('')
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showSignOut, setShowSignOut] = useState(false)

  useEffect(() => { fetchTournaments() }, [])

  async function fetchTournaments() {
    const { data } = await supabase.from('tournaments').select('*, teams(count)').order('created_at', { ascending: false })
    if (data) setTournaments(data)
  }

  async function createTournament(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    const finalRules = sport === 'custom' ? { ...rules, max_score: parseInt(maxScoreInput) } : rules
    await supabase.from('tournaments').insert({ name, description: description || null, type, sport, participant_type: participantType, rules: finalRules })
    setName(''); setDescription(''); setType('league'); setSport('custom'); setParticipantType('team')
    setRules({ ...DEFAULT_RULES, max_score: 0, score_unit: '' }); setMaxScoreInput('')
    setShowForm(false); setCreating(false)
    fetchTournaments()
  }

  function setRule(key: keyof TournamentRules, value: string) {
    const n = parseInt(value)
    if (!isNaN(n) && n >= 0) setRules(r => ({ ...r, [key]: n }))
  }

  function closeForm() {
    setShowForm(false)
    setName(''); setDescription(''); setType('league'); setSport('custom'); setParticipantType('team')
    setRules({ ...DEFAULT_RULES, max_score: 0, score_unit: '' }); setMaxScoreInput('')
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

        {tournaments.length === 0 ? (
          <p className="text-zinc-600 text-sm text-center py-12">No tournaments yet. Create your first one!</p>
        ) : (
          <div className="space-y-2">
            {tournaments.map(t => (
              <Link key={t.id} to={`/admin/tournament/${t.id}`} className="block">
                <Card className="hover:border-zinc-700 hover:bg-zinc-800/50 transition-colors cursor-pointer">
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium text-zinc-100">{t.name}</p>
                      <p className="text-xs text-zinc-600 mt-0.5 capitalize">
                        {t.sport}
                        {' · '}
                        {(t as unknown as { teams: { count: number }[] }).teams?.[0]?.count ?? 0}
                        {' '}
                        {t.participant_type === 'player' ? 'players' : 'teams'}
                        {t.description ? ` · ${t.description}` : ''}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-600" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer color="blue" />

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
          <form onSubmit={createTournament} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="t-name">Name</Label>
              <Input id="t-name" value={name} onChange={e => setName(e.target.value)} required placeholder="Premier League Season 1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-desc">Description (optional)</Label>
              <Input id="t-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="5-a-side tournament" />
            </div>

            <div className="space-y-1.5">
              <Label>Participants</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['team', 'player'] as ParticipantType[]).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setParticipantType(p)}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors capitalize ${
                      participantType === p
                        ? 'border-blue-500/60 bg-blue-900/20 text-blue-300'
                        : 'border-zinc-700 bg-zinc-800/40 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    {p === 'team' ? 'Teams' : 'Players'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tournament type</Label>
                <Select value={type} onValueChange={v => setType(v as TournamentType)}>
                  <SelectTrigger className="w-full focus:ring-blue-500/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TOURNAMENT_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value} description={t.description}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Sport</Label>
                <Select value={sport} onValueChange={v => setSport(v as SportType)}>
                  <SelectTrigger className="w-full focus:ring-blue-500/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SPORTS.map(s => (
                      <SelectItem key={s.value} value={s.value} description={s.description}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {sport === 'custom' && (
              <div className="space-y-3 rounded-xl border border-zinc-700 bg-zinc-800/30 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Scoring rules</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="pts-win">Points — Win</Label>
                    <Input id="pts-win" type="number" min={0} value={rules.points_win} onChange={e => setRule('points_win', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pts-draw">Points — Draw</Label>
                    <Input id="pts-draw" type="number" min={0} value={rules.points_draw} onChange={e => setRule('points_draw', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pts-loss">Points — Loss</Label>
                    <Input id="pts-loss" type="number" min={0} value={rules.points_loss} onChange={e => setRule('points_loss', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="max-score">Max score per team</Label>
                    <Input id="max-score" type="number" min={1} value={maxScoreInput} onChange={e => setMaxScoreInput(e.target.value)} required placeholder="e.g. 20" />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="score-unit">Score unit (singular)</Label>
                    <Input id="score-unit" type="text" value={rules.score_unit} onChange={e => setRules(r => ({ ...r, score_unit: e.target.value }))} required placeholder="e.g. goal, point, run" />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
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
