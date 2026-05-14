import { useState } from 'react'
import type { Team, Leg, MatchWithTeams } from '@/types'
import { computeStandings } from '@/utils/standings'
import { cn } from '@/lib/utils'

interface Props {
  teams: Team[]
  legs: Leg[]
  matches: MatchWithTeams[]
}

export default function StandingsTable({ teams, legs, matches }: Props) {
  const [activeLeg, setActiveLeg] = useState<string>('all')

  const filteredMatches = activeLeg === 'all'
    ? matches
    : matches.filter(m => m.leg_id === activeLeg)

  const standings = computeStandings(teams, filteredMatches)

  if (teams.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-8">No teams in this tournament yet.</p>
  }

  const tabs = ['all', ...legs.map(l => l.id)]

  function tabLabel(id: string) {
    if (id === 'all') return 'Combined'
    return legs.find(l => l.id === id)?.name ?? id
  }

  return (
    <div>
      {legs.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setActiveLeg(t)}
              className={cn(
                'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                activeLeg === t
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {tabLabel(t)}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-500 w-6">#</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Team</th>
              <th className="text-center px-3 py-3 font-medium text-slate-500">P</th>
              <th className="text-center px-3 py-3 font-medium text-slate-500">W</th>
              <th className="text-center px-3 py-3 font-medium text-slate-500">D</th>
              <th className="text-center px-3 py-3 font-medium text-slate-500">L</th>
              <th className="text-center px-3 py-3 font-medium text-slate-500">GF</th>
              <th className="text-center px-3 py-3 font-medium text-slate-500">GA</th>
              <th className="text-center px-3 py-3 font-medium text-slate-500">GD</th>
              <th className="text-center px-3 py-3 font-medium text-slate-900 font-semibold">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {standings.map((s, i) => (
              <tr key={s.team.id} className="bg-white hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                <td className="px-4 py-3 font-medium">{s.team.name}</td>
                <td className="px-3 py-3 text-center text-slate-600">{s.played}</td>
                <td className="px-3 py-3 text-center text-slate-600">{s.won}</td>
                <td className="px-3 py-3 text-center text-slate-600">{s.drawn}</td>
                <td className="px-3 py-3 text-center text-slate-600">{s.lost}</td>
                <td className="px-3 py-3 text-center text-slate-600">{s.goals_for}</td>
                <td className="px-3 py-3 text-center text-slate-600">{s.goals_against}</td>
                <td className="px-3 py-3 text-center text-slate-600">
                  {s.goal_difference > 0 ? `+${s.goal_difference}` : s.goal_difference}
                </td>
                <td className="px-3 py-3 text-center font-bold">{s.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
