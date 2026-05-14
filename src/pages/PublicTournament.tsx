import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Tournament, Team, Leg, MatchWithTeams } from '@/types'
import { DEFAULT_RULES } from '@/types'
import ScheduleView from '@/components/public/ScheduleView'
import StandingsTable from '@/components/public/StandingsTable'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Trophy } from 'lucide-react'

export default function PublicTournament() {
  const { id } = useParams<{ id: string }>()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [legs, setLegs] = useState<Leg[]>([])
  const [matches, setMatches] = useState<MatchWithTeams[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) fetchAll(id)
  }, [id])

  async function fetchAll(tid: string) {
    const [{ data: t }, { data: te }, { data: l }] = await Promise.all([
      supabase.from('tournaments').select('*').eq('id', tid).single(),
      supabase.from('teams').select('*').eq('tournament_id', tid).order('created_at'),
      supabase.from('legs').select('*').eq('tournament_id', tid).order('leg_number'),
    ])
    if (t) setTournament(t)
    if (te) setTeams(te)
    if (l) {
      setLegs(l)
      if (l.length > 0) {
        const { data: m } = await supabase
          .from('matches')
          .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
          .in('leg_id', l.map((x: Leg) => x.id))
          .order('round_number')
        if (m) setMatches(m as MatchWithTeams[])
      }
    }
    setLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-slate-500">Loading…</div>
  )
  if (!tournament) return (
    <div className="min-h-screen flex items-center justify-center text-slate-500">Tournament not found.</div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Trophy className="h-6 w-6 text-slate-700" />
          <div>
            <h1 className="text-xl font-bold">{tournament.name}</h1>
            {tournament.description && <p className="text-sm text-slate-500">{tournament.description}</p>}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <Tabs defaultValue="standings">
          <TabsList className="mb-6">
            <TabsTrigger value="standings">Standings</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="standings">
            <StandingsTable teams={teams} legs={legs} matches={matches} rules={tournament.rules ?? DEFAULT_RULES} />
          </TabsContent>

          <TabsContent value="schedule">
            <ScheduleView legs={legs} matches={matches} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
