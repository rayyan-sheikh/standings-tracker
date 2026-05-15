import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase'
import type { Tournament, Team, Leg, MatchWithTeams, TournamentDay } from '@/shared/types'
import { DEFAULT_RULES } from '@/shared/types'
import ScheduleView from '@/features/viewer/components/ScheduleView'
import StandingsTable from '@/features/viewer/components/StandingsTable'
import StatsView from '@/features/viewer/components/StatsView'
import { useRealtimeTournament } from '@/features/viewer/hooks/useRealtimeTournament'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs'
import { Swords } from 'lucide-react'
import Logo from '@/shared/ui/logo'
import Footer from '@/shared/ui/footer'

export default function PublicTournament() {
  const { id } = useParams<{ id: string }>()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [legs, setLegs] = useState<Leg[]>([])
  const [matches, setMatches] = useState<MatchWithTeams[]>([])
  const [days, setDays] = useState<TournamentDay[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async (tid: string) => {
    const [{ data: t }, { data: te }, { data: l }, { data: d }] = await Promise.all([
      supabase.from('tournaments').select('*').eq('id', tid).single(),
      supabase.from('teams').select('*').eq('tournament_id', tid).order('created_at'),
      supabase.from('legs').select('*').eq('tournament_id', tid).order('leg_number'),
      supabase.from('tournament_days').select('*').eq('tournament_id', tid).order('day_number'),
    ])
    if (t) setTournament(t)
    if (te) setTeams(te)
    if (d) setDays(d)
    if (l) {
      setLegs(l)
      if (l.length > 0) {
        const { data: m } = await supabase
          .from('matches')
          .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
          .in('leg_id', l.map((x: Leg) => x.id))
          .order('id')
        if (m) setMatches(m as MatchWithTeams[])
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => { if (id) fetchAll(id) }, [id, fetchAll])

  useRealtimeTournament({
    tournamentId: id ?? '',
    legIds: legs.map(l => l.id),
    onUpdate: useCallback(() => { if (id) fetchAll(id) }, [id, fetchAll]),
  })

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-500">Loading…</div>
  )
  if (!tournament) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-500">Tournament not found.</div>
  )

  return (
    <div className="min-h-screen bg-zinc-950">
      <Tabs defaultValue="standings">
        <header className="bg-zinc-900 border-b border-zinc-800 px-4 sm:px-6 pt-4 pb-0 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <Logo color="green" />
              <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-green-500">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live
              </span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Swords className="h-4 w-4 text-green-400 shrink-0" />
              <div className="min-w-0">
                <h1 className="text-base font-bold text-zinc-300 leading-tight">{tournament.name}</h1>
                {tournament.description && (
                  <p className="text-xs text-zinc-500 mt-0.5">{tournament.description}</p>
                )}
              </div>
            </div>
            <TabsList className="bg-transparent p-0 h-auto gap-0 rounded-none w-full justify-start border-b border-zinc-800 -mb-px">
              {(['standings', 'schedule', 'stats'] as const).map(tab => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="rounded-none px-4 py-2.5 text-sm font-medium text-zinc-500 border-b-2 border-transparent data-[state=active]:border-green-400 data-[state=active]:text-green-400 data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-zinc-300 transition-colors capitalize"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <TabsContent value="standings">
            <StandingsTable teams={teams} legs={legs} matches={matches} rules={tournament.rules ?? DEFAULT_RULES} />
          </TabsContent>
          <TabsContent value="schedule">
            <ScheduleView legs={legs} days={days} matches={matches} scoreUnit={tournament.rules?.score_unit || 'points'} isDoubles={tournament.participant_type === 'doubles'} />
          </TabsContent>
          <TabsContent value="stats">
            <StatsView
              sport={tournament.sport ?? 'custom'}
              teams={teams}
              matches={matches}
              rules={tournament.rules ?? DEFAULT_RULES}
              scoreUnit={tournament.rules?.score_unit || 'point'}
            />
          </TabsContent>
        </main>

        <Footer color="green" />
      </Tabs>
    </div>
  )
}
