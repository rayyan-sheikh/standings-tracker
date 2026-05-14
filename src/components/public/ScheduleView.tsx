import type { Leg, MatchWithTeams } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  legs: Leg[]
  matches: MatchWithTeams[]
}

export default function ScheduleView({ legs, matches }: Props) {
  const legMap = new Map(legs.map(l => [l.id, l]))

  const grouped = matches.reduce((acc, m) => {
    const key = `${m.leg_id}-${m.round_number}`
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {} as Record<string, MatchWithTeams[]>)

  if (matches.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-8">No matches scheduled yet.</p>
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([key, roundMatches]) => {
        const legId = key.split('-')[0]
        const round = roundMatches[0].round_number
        const leg = legMap.get(legId)
        return (
          <div key={key}>
            <p className="text-xs font-semibold uppercase text-slate-400 mb-2">
              {leg?.name ?? ''} · Round {round}
            </p>
            <div className="space-y-2">
              {roundMatches.map(m => {
                const done = m.status === 'completed' && m.home_score !== null && m.away_score !== null
                const homeWon = done && m.home_score! > m.away_score!
                const awayWon = done && m.away_score! > m.home_score!
                const isDraw = done && m.home_score === m.away_score

                return (
                  <div key={m.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
                    <span className={cn(
                      'flex-1 text-right text-sm',
                      homeWon ? 'font-bold text-slate-900' : 'font-medium text-slate-500'
                    )}>
                      {m.home_team.name}
                    </span>

                    {done ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={cn(
                          'text-base font-bold tabular-nums w-5 text-right',
                          homeWon ? 'text-slate-900' : 'text-slate-400'
                        )}>
                          {m.home_score}
                        </span>
                        <span className="text-slate-300 font-medium px-0.5">–</span>
                        <span className={cn(
                          'text-base font-bold tabular-nums w-5 text-left',
                          awayWon ? 'text-slate-900' : 'text-slate-400'
                        )}>
                          {m.away_score}
                        </span>
                        {isDraw && (
                          <span className="ml-1 text-xs text-slate-400 font-normal">D</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300 shrink-0 px-2">vs</span>
                    )}

                    <span className={cn(
                      'flex-1 text-sm',
                      awayWon ? 'font-bold text-slate-900' : 'font-medium text-slate-500'
                    )}>
                      {m.away_team.name}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
