import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase'
import type { Tournament, Team, Leg, MatchWithTeams, TournamentRules, ParticipantType, TournamentDay } from '@/shared/types'
import { DEFAULT_RULES } from '@/shared/types'
import { generateRoundRobin } from '@/shared/lib/roundRobin'
import TeamManager from '@/features/admin/components/TeamManager'
import LegManager from '@/features/admin/components/LegManager'
import MatchCard from '@/features/admin/components/MatchCard'
import QRCodeModal from '@/features/admin/components/QRCodeModal'
import RulesEditor from '@/features/admin/components/RulesEditor'
import SmartScheduler from '@/features/admin/components/SmartScheduler'
import StandingsTable from '@/features/viewer/components/StandingsTable'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs'
import { Button } from '@/shared/ui/button'
import Logo from '@/shared/ui/logo'
import Footer from '@/shared/ui/footer'
import { useRealtimeTournament } from '@/features/viewer/hooks/useRealtimeTournament'
import { ArrowLeft, QrCode } from 'lucide-react'

export default function TournamentAdmin() {
  const { id } = useParams<{ id: string }>()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [legs, setLegs] = useState<Leg[]>([])
  const [matches, setMatches] = useState<MatchWithTeams[]>([])
  const [activeLeg, setActiveLeg] = useState<string>('all')
  const [days, setDays] = useState<TournamentDay[]>([])
  const [activeTab, setActiveTab] = useState('teams')
  const [showQR, setShowQR] = useState(false)

  const fetchAllCb = useCallback(() => { if (id) fetchAll(id) }, [id])

  useEffect(() => { if (id) fetchAll(id) }, [id])

  useRealtimeTournament({
    tournamentId: id ?? '',
    legIds: legs.map(l => l.id),
    onUpdate: fetchAllCb,
  })

  async function fetchAll(tid: string) {
    const [{ data: t }, { data: te }, { data: l }, { data: d }] = await Promise.all([
      supabase.from('tournaments').select('*').eq('id', tid).single(),
      supabase.from('teams').select('*').eq('tournament_id', tid).order('created_at'),
      supabase.from('legs').select('*').eq('tournament_id', tid).order('leg_number'),
      supabase.from('tournament_days').select('*').eq('tournament_id', tid).order('day_number'),
    ])
    if (t) setTournament(t)
    if (te) setTeams(te)
    if (l) setLegs(l)
    if (d) setDays(d)
    if (l && l.length > 0) fetchMatches(l.map((x: Leg) => x.id))
  }

  async function fetchMatches(legIds: string[]) {
    const { data } = await supabase
      .from('matches')
      .select('*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)')
      .in('leg_id', legIds)
      .order('id')
    if (data) setMatches(data as MatchWithTeams[])
  }

  async function addLeg() {
    if (!id) return
    const legNumber = legs.length + 1
    const { data: leg } = await supabase
      .from('legs').insert({ tournament_id: id, leg_number: legNumber, name: `Leg ${legNumber}` })
      .select().single()
    if (!leg) return
    const schedule = generateRoundRobin(teams.map(t => t.id), legNumber % 2 === 0)
    const rows = schedule.map(m => ({
      leg_id: leg.id, home_team_id: m.homeTeamId, away_team_id: m.awayTeamId,
      round_number: m.round, status: 'scheduled',
    }))
    await supabase.from('matches').insert(rows)
    fetchAll(id)
  }

  async function resetMatches() {
    if (!id) return
    const legIds = legs.map(l => l.id)
    if (legIds.length === 0) return
    await supabase.from('matches')
      .update({ home_score: null, away_score: null, status: 'scheduled' })
      .in('leg_id', legIds)
    fetchAll(id)
  }

  async function saveRules(rules: TournamentRules, participantType: ParticipantType) {
    if (!id) return
    await supabase.from('tournaments').update({ rules, participant_type: participantType }).eq('id', id)
    setTournament(t => t ? { ...t, rules, participant_type: participantType } : t)
    setActiveTab('standings')
  }

  const rules: TournamentRules = tournament?.rules ?? DEFAULT_RULES
  const publicUrl = `${window.location.origin}/t/${id}`
  const displayedMatches = activeLeg === 'all' ? matches : matches.filter(m => m.leg_id === activeLeg)

  if (!tournament) return <div className="p-8 text-zinc-500">Loading…</div>

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="bg-zinc-900 border-b border-zinc-800 px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/admin" className="text-zinc-500 hover:text-zinc-200 transition-colors shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="min-w-0">
              <Logo color="blue" />
              <h1 className="font-semibold text-zinc-300 text-xs mt-0.5 truncate">{tournament.name}</h1>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowQR(true)} className="shrink-0 ml-3">
            <QrCode className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Share QR</span>
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 overflow-x-auto no-scrollbar flex-nowrap">
            {(['teams', 'schedule', 'standings', 'rules'] as const).map(tab => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="data-[state=active]:bg-blue-900/50 data-[state=active]:text-blue-300 capitalize"
              >
                {tab === 'schedule' ? 'Schedule' : tab === 'teams' ? 'Participants' : tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="teams">
            <TeamManager
              tournamentId={id!}
              teams={teams}
              legs={legs}
              participantType={tournament.participant_type ?? 'team'}
              hasPlayedMatches={matches.some(m => m.status === 'completed')}
              onTeamsChange={() => fetchAll(id!)}
              onAddLeg={addLeg}
              onResetMatches={resetMatches}
            />
          </TabsContent>

          <TabsContent value="schedule">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-semibold text-zinc-200">Tournament schedule</h3>
                <p className="text-xs text-zinc-600 mt-0.5">
                  {days.length > 0 ? `${days.length} day${days.length !== 1 ? 's' : ''} set up` : 'No days set up yet'}
                </p>
              </div>
              <SmartScheduler tournamentId={id!} days={days} matches={displayedMatches} onUpdate={() => fetchAll(id!)} />
            </div>
            <LegManager legs={legs} activeLeg={activeLeg} onSelectLeg={setActiveLeg} />
            <div className="space-y-8 mt-4">
              {(() => {
                const sortedLegs = [...legs]
                  .filter(l => activeLeg === 'all' || l.id === activeLeg)
                  .sort((a, b) => a.leg_number - b.leg_number)
                const globalOffset = activeLeg === 'all' ? 0 :
                  matches.filter(m => {
                    const mLeg = legs.find(l => l.id === m.leg_id)
                    const selectedLeg = legs.find(l => l.id === activeLeg)
                    return mLeg && selectedLeg && mLeg.leg_number < selectedLeg.leg_number
                  }).length
                let counter = globalOffset
                return sortedLegs.map(leg => {
                  const legMatches = displayedMatches
                    .filter(m => m.leg_id === leg.id)
                  if (legMatches.length === 0) return null
                  return (
                    <div key={leg.id}>
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-blue-400">
                          {leg.name ?? `Leg ${leg.leg_number}`}
                        </h3>
                        <div className="flex-1 h-px bg-zinc-800" />
                      </div>
                      <div className="space-y-4">
                        {days.length > 0 ? (() => {
                          const sortedDays = [...days].sort((a, b) => a.day_number - b.day_number)
                          const byDay = sortedDays.map(day => ({
                            day,
                            dayMatches: legMatches.filter(m => m.day_id === day.id),
                          }))
                          const unscheduled = legMatches.filter(m => !m.day_id)
                          return (
                            <>
                              {byDay.map(({ day, dayMatches }) => {
                                if (dayMatches.length === 0) return null
                                return (
                                  <div key={day.id}>
                                    <p className="text-[11px] font-semibold text-blue-400/70 uppercase tracking-widest mb-2">
                                      {day.label ?? `Day ${day.day_number}`}
                                    </p>
                                    <div className="space-y-2">
                                      {dayMatches.map(m => { counter++; return <MatchCard key={m.id} match={m} matchNumber={counter} maxScore={rules.max_score} days={days} onUpdate={() => fetchAll(id!)} /> })}
                                    </div>
                                  </div>
                                )
                              })}
                              {unscheduled.length > 0 && (
                                <div>
                                  <p className="text-[11px] font-semibold text-zinc-600 uppercase tracking-widest mb-2">Unscheduled</p>
                                  <div className="space-y-2">
                                    {unscheduled.map(m => { counter++; return <MatchCard key={m.id} match={m} matchNumber={counter} maxScore={rules.max_score} days={days} onUpdate={() => fetchAll(id!)} /> })}
                                  </div>
                                </div>
                              )}
                            </>
                          )
                        })() : (
                          legMatches.map(m => { counter++; return <MatchCard key={m.id} match={m} matchNumber={counter} maxScore={rules.max_score} days={days} onUpdate={() => fetchAll(id!)} /> })
                        )}
                      </div>
                    </div>
                  )
                })
              })()}
              {displayedMatches.length === 0 && (
                <p className="text-sm text-zinc-600 text-center py-8">
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
            <RulesEditor
              rules={rules}
              participantType={tournament.participant_type ?? 'team'}
              onSave={saveRules}
            />
          </TabsContent>
        </Tabs>
      </main>

      <Footer color="blue" />
      {showQR && <QRCodeModal url={publicUrl} onClose={() => setShowQR(false)} />}
    </div>
  )
}
