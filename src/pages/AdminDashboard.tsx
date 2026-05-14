import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Tournament } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trophy, Plus, LogOut, ChevronRight } from 'lucide-react'

export default function AdminDashboard() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { fetchTournaments() }, [])

  async function fetchTournaments() {
    const { data } = await supabase.from('tournaments').select('*').order('created_at', { ascending: false })
    if (data) setTournaments(data)
  }

  async function createTournament(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    await supabase.from('tournaments').insert({ name, description: description || null })
    setName(''); setDescription(''); setShowForm(false); setCreating(false)
    fetchTournaments()
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6" />
          <h1 className="text-lg font-semibold">Tournament Tracker</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-1" /> Sign out
        </Button>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Tournaments</h2>
          <Button size="sm" onClick={() => setShowForm(v => !v)}>
            <Plus className="h-4 w-4 mr-1" /> New tournament
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader><CardTitle>Create tournament</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={createTournament} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="t-name">Name</Label>
                  <Input id="t-name" value={name} onChange={e => setName(e.target.value)} required placeholder="Premier League Season 1" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="t-desc">Description (optional)</Label>
                  <Input id="t-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="5-a-side tournament" />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={creating}>{creating ? 'Creating…' : 'Create'}</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {tournaments.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-12">No tournaments yet. Create your first one!</p>
        ) : (
          <div className="space-y-3">
            {tournaments.map(t => (
              <Link key={t.id} to={`/admin/tournament/${t.id}`}>
                <Card className="hover:border-slate-300 transition-colors cursor-pointer">
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">{t.name}</p>
                      {t.description && <p className="text-sm text-slate-500">{t.description}</p>}
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
