import { useState } from 'react'
import type { Team, Leg, MatchWithTeams, TournamentRules } from '@/types'
import { DEFAULT_RULES } from '@/types'
import { computeStandings } from '@/utils/standings'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Props {
  teams: Team[]
  legs: Leg[]
  matches: MatchWithTeams[]
  rules?: TournamentRules
}

const MEDAL = [
  { color: '#FFD700', label: '1st' },
  { color: '#C0C0C0', label: '2nd' },
  { color: '#CD7F32', label: '3rd' },
]

export default function StandingsTable({ teams, legs, matches, rules = DEFAULT_RULES }: Props) {
  const [activeLeg, setActiveLeg] = useState<string>('all')

  const filteredMatches = activeLeg === 'all' ? matches : matches.filter(m => m.leg_id === activeLeg)
  const standings = computeStandings(teams, filteredMatches, rules)

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
              <th className="text-center px-3 py-3 font-semibold text-green-400">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {standings.map((s, i) => {
              const medal = MEDAL[i]
              return (
                <tr key={s.team.id} className="bg-zinc-900 hover:bg-zinc-800/40 transition-colors">
                  <td className="relative px-4 py-3.5 text-zinc-600 text-xs overflow-hidden">
                    {medal && (
                      <span
                        aria-label={medal.label}
                        style={{
                          position: 'absolute', top: 0, left: 0,
                          width: 0, height: 0,
                          borderTop: `18px solid ${medal.color}`,
                          borderRight: '18px solid transparent',
                        }}
                      />
                    )}
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
                  <td className="px-3 py-3.5 text-center font-bold text-green-400" style={{ fontFamily: 'Sora, sans-serif' }}>
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
