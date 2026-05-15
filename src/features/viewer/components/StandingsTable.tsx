import { useState } from 'react'
import type { Team, Leg, MatchWithTeams, TournamentRules } from '@/shared/types'
import { DEFAULT_RULES } from '@/shared/types'
import { computeStandings } from '@/shared/utils/standings'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'

interface Props {
  teams: Team[]
  legs: Leg[]
  matches: MatchWithTeams[]
  rules?: TournamentRules
}


function getForm(teamId: string, matches: MatchWithTeams[]): ('W' | 'D' | 'L')[] {
  return matches
    .filter(m => m.status === 'completed' && m.home_score !== null && m.away_score !== null &&
      (m.home_team_id === teamId || m.away_team_id === teamId))
    .slice(-5)
    .map(m => {
      const isHome = m.home_team_id === teamId
      const scored = isHome ? m.home_score! : m.away_score!
      const conceded = isHome ? m.away_score! : m.home_score!
      return scored > conceded ? 'W' : scored < conceded ? 'L' : 'D'
    })
}

const FORM_COLOR = { W: 'bg-green-500', D: 'bg-zinc-500', L: 'bg-red-500' }

export default function StandingsTable({ teams, legs, matches, rules = DEFAULT_RULES }: Props) {
  const [activeLeg, setActiveLeg] = useState<string>('all')

  const filteredMatches = activeLeg === 'all' ? matches : matches.filter(m => m.leg_id === activeLeg)
  const standings = computeStandings(teams, filteredMatches, rules)
  const hasForm = filteredMatches.some(m => m.status === 'completed')

  if (teams.length === 0) {
    return <p className="text-sm text-zinc-600 text-center py-8">No teams in this tournament yet.</p>
  }

  return (
    <div>
      {legs.length > 1 && (
        <div className="mb-4">
          <Select value={activeLeg} onValueChange={setActiveLeg}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Combined</SelectItem>
              {legs.map(l => (
                <SelectItem key={l.id} value={l.id}>{l.name ?? `Leg ${l.leg_number}`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-800/50 border-b border-zinc-800">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-zinc-600 w-10">#</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-500">Team</th>
              <th className="text-center px-3 py-3 font-medium text-zinc-500">P</th>
              <th className="text-center px-3 py-3 font-medium text-green-600">W</th>
              <th className="text-center px-3 py-3 font-medium text-zinc-500">D</th>
              <th className="text-center px-3 py-3 font-medium text-zinc-500">L</th>
              <th className="text-center px-3 py-3 font-medium text-zinc-500">GD</th>
              {hasForm && <th className="text-center px-3 py-3 font-medium text-zinc-500">Form</th>}
              <th className="text-center px-3 py-3 font-semibold text-green-400 sticky right-0 bg-zinc-800">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {standings.map((s, i) => {
              const promotion = rules.promotion_spots > 0 && i < rules.promotion_spots
              const relegation = rules.relegation_spots > 0 && i >= standings.length - rules.relegation_spots
              return (
                <tr key={s.team.id} className={`hover:bg-zinc-800/40 transition-colors ${promotion ? 'bg-green-950/20' : relegation ? 'bg-red-950/20' : 'bg-zinc-900'}`}>
                  <td className="relative px-4 py-3.5 text-zinc-600 text-xs overflow-hidden">
                    {promotion && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-green-500" />}
                    {relegation && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500" />}
                    {i + 1}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-zinc-200 whitespace-nowrap">{s.team.name}</td>
                  <td className="px-3 py-3.5 text-center text-zinc-500">{s.played}</td>
                  <td className="px-3 py-3.5 text-center text-green-500">{s.won}</td>
                  <td className="px-3 py-3.5 text-center text-zinc-500">{s.drawn}</td>
                  <td className="px-3 py-3.5 text-center text-zinc-500">{s.lost}</td>
                  <td className={`px-3 py-3.5 text-center ${s.goal_difference > 0 ? 'text-green-500' : s.goal_difference < 0 ? 'text-red-500' : 'text-zinc-500'}`}>
                    {s.goal_difference > 0 ? `+${s.goal_difference}` : s.goal_difference}
                  </td>
                  {hasForm && (
                    <td className="px-3 py-3.5">
                      <div className="flex items-center justify-center gap-0.5">
                        {(() => {
                          const form = getForm(s.team.id, filteredMatches)
                          return form.map((r, i) => (
                            <span key={i} title={r}
                              className={`w-2 h-2 rounded-sm ${FORM_COLOR[r]}`} />
                          ))
                        })()}
                      </div>
                    </td>
                  )}
                  <td className="px-3 py-3.5 text-center font-bold text-green-400 sticky right-0 bg-zinc-900" style={{ fontFamily: 'Sora, sans-serif' }}>
                    {s.points}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
