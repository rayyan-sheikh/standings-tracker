import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Tournament, Team, Leg, MatchWithTeams, TournamentRules } from '@/types'
import { DEFAULT_RULES } from '@/types'
import { generateRoundRobin } from '@/lib/roundRobin'
import TeamManager from '@/components/admin/TeamManager'
import LegManager from '@/components/admin/LegManager'
import MatchCard from '@/components/admin/MatchCard'
import QRCodeModal from '@/components/admin/QRCodeModal'
import RulesEditor from '@/components/admin/RulesEditor'
import StandingsTable from '@/components/public/StandingsTable'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Trophy, ArrowLeft, QrCode } from 'lucide-react'

export default function TournamentAdmin() {
  const { id } = useParams<{ id: string }>()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [legs, setLegs] = useState<Leg[]>([])
  const [matches, setMatches] = useState<MatchWithTeams[]>([])
  const [activeLeg, setActiveLeg] = useState<string>('all')
  const [showQR, setShowQR] = useState(false)

  useEffect(() => { if (id) fetchAll(id) }, [id])

  async function fetchAll(tid: string) {
    const [{ data: t }, { data: te }, { data: l }] = await Promise.all([
      supabase.from('tournaments').select('*').eq('id', tid).single(),
      supabase.from('teams').select('*').eq('tournament_id', tid).order('created_at'),
      supabase.from('legs').select('*').eq('tournament_id', tid).order('leg_number'),
    ])
    if (t) setTournament(t)
    if (te) setTeams(te)
    if (l) setLegs(l)
    if (l && l.length > 0) fetchMatches(l.map((x: Leg) => x.id))
  }

  async function fetchMatches(legIds: string[]) {
    const { data } = await supabase
      .from('matches')
      .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
      .in('leg_id', legIds)
      .order('round_number')
    if (data) setMatches(data as MatchWithTeams[])
  }

  async function addLeg() {
    if (!id) return
    const legNumber = legs.length + 1
    const { data: leg } = await supabase
      .from('legs')
      .insert({ tournament_id: id, leg_number: legNumber, name: `Leg ${legNumber}` })
      .select()
      .single()
    if (!leg) return

    const schedule = generateRoundRobin(teams.map(t => t.id), legNumber % 2 === 0)
    const rows = schedule.map(m => ({
      leg_id: leg.id,
      home_team_id: m.homeTeamId,
      away_team_id: m.awayTeamId,
      round_number: m.round,
      status: 'scheduled',
    }))
    await supabase.from('matches').insert(rows)
    fetchAll(id)
  }

  async function saveRules(rules: TournamentRules) {
    if (!id) return
    await supabase.from('tournaments').update({ rules }).eq('id', id)
    setTournament(t => t ? { ...t, rules } : t)
  }

  const rules: TournamentRules = tournament?.rules ?? DEFAULT_RULES
  const publicUrl = `${window.location.origin}/t/${id}`
  const displayedMatches = activeLeg === 'all'
    ? matches
    : matches.filter(m => m.leg_id === activeLeg)

  const matchesByRound = displayedMatches.reduce((acc, m) => {
    const key = `${m.leg_id}-${m.round_number}`
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {} as Record<string, MatchWithTeams[]>)

  if (!tournament) return <div className="p-8 text-slate-500">Loading…</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="text-slate-500 hover:text-slate-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Trophy className="h-5 w-5" />
          <h1 className="font-semibold">{tournament.name}</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowQR(true)}>
          <QrCode className="h-4 w-4 mr-1" /> Share QR
        </Button>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <Tabs defaultValue="teams">
          <TabsList className="mb-6">
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="schedule">Schedule &amp; Results</TabsTrigger>
            <TabsTrigger value="standings">Standings</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
          </TabsList>

          <TabsContent value="teams">
            <TeamManager
              tournamentId={id!}
              teams={teams}
              legs={legs}
              onTeamsChange={() => fetchAll(id!)}
              onAddLeg={addLeg}
            />
          </TabsContent>

          <TabsContent value="schedule">
            <LegManager legs={legs} activeLeg={activeLeg} onSelectLeg={setActiveLeg} />
            <div className="space-y-6 mt-4">
              {Object.entries(matchesByRound).map(([key, roundMatches]) => {
                const legId = key.split('-')[0]
                const round = roundMatches[0].round_number
                const leg = legs.find(l => l.id === legId)
                return (
                  <div key={key}>
                    <p className="text-xs font-semibold uppercase text-slate-400 mb-2">
                      {leg?.name ?? ''} · Round {round}
                    </p>
                    <div className="space-y-2">
                      {roundMatches.map(m => (
                        <MatchCard key={m.id} match={m} maxScore={rules.max_score} onUpdate={() => fetchAll(id!)} />
                      ))}
                    </div>
                  </div>
                )
              })}
              {displayedMatches.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-8">
                  {teams.length < 2
                    ? 'Add at least 2 teams first, then add a leg to generate the schedule.'
                    : legs.length === 0
                    ? 'Add a leg in the Teams tab to generate the match schedule.'
                    : 'No matches found.'}
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="standings">
            <StandingsTable teams={teams} legs={legs} matches={matches} rules={rules} />
          </TabsContent>

          <TabsContent value="rules">
            <RulesEditor rules={rules} onSave={saveRules} />
          </TabsContent>
        </Tabs>
      </main>

      {showQR && <QRCodeModal url={publicUrl} onClose={() => setShowQR(false)} />}
    </div>
  )
}
