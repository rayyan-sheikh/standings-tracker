import type { Leg, MatchWithTeams } from '@/shared/types'
import { cn } from '@/shared/lib/utils'

interface Props {
  legs: Leg[]
  matches: MatchWithTeams[]
  scoreUnit?: string
  isDoubles?: boolean
}

function initials(name: string, isDoubles: boolean) {
  if (isDoubles && name.includes(' / ')) {
    const [p1, p2] = name.split(' / ')
    return `${p1.trim()[0]}${p2.trim()[0]}`.toUpperCase()
  }
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function displayName(name: string, isDoubles: boolean) {
  if (isDoubles && name.includes(' / ')) {
    return name.replace(' / ', ' & ')
  }
  return name
}

function TeamRow({ team, score, won, done, isDoubles }: {
  team: { id: string; name: string }
  score: number | null
  won: boolean
  done: boolean
  isDoubles: boolean
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-300 shrink-0">
        {initials(team.name, isDoubles)}
      </div>
      <span className={cn('flex-1 text-sm tracking-wide whitespace-nowrap', won ? 'font-bold text-zinc-100' : 'font-medium text-zinc-400')}>
        {displayName(team.name, isDoubles)}
      </span>
      {done && (
        <span
          className={cn('text-xl font-bold tabular-nums', won ? 'text-zinc-100' : 'text-zinc-400')}
          style={{ fontFamily: 'Sora, sans-serif' }}
        >
          {score}
        </span>
      )}
    </div>
  )
}

export default function ScheduleView({ legs, matches, scoreUnit = 'points', isDoubles = false }: Props) {
  const sortedLegs = [...legs].sort((a, b) => a.leg_number - b.leg_number)

  const matchesByLeg = sortedLegs.map(leg => ({
    leg,
    matches: matches
      .filter(m => m.leg_id === leg.id)
,
  }))

  if (matches.length === 0) {
    return <p className="text-sm text-zinc-600 text-center py-8">No matches scheduled yet.</p>
  }

  let matchCounter = 0

  return (
    <div className="space-y-10">
      {matchesByLeg.map(({ leg, matches: legMatches }) => {
        if (legMatches.length === 0) return null
        return (
          <div key={leg.id}>
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-green-400">
                {leg.name ?? `Leg ${leg.leg_number}`}
              </h3>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            <div className="space-y-3">
              {legMatches.map(m => {
                matchCounter++
                const matchNum = matchCounter
                const done = m.status === 'completed' && m.home_score !== null && m.away_score !== null
                const homeWon = done && m.home_score! > m.away_score!
                const awayWon = done && m.away_score! > m.home_score!
                const winner = homeWon || awayWon
                const margin = done ? Math.abs(m.home_score! - m.away_score!) : 0

                return (
                  <div key={m.id} className="rounded-2xl bg-zinc-900 border border-zinc-800 shadow-md shadow-black/30 overflow-hidden">
                    <div className="flex items-stretch">
                      <div className="flex-1 divide-y divide-zinc-800 px-4 overflow-x-auto no-scrollbar">
                        <TeamRow team={m.home_team} score={m.home_score} won={homeWon} done={done} isDoubles={isDoubles} />
                        <TeamRow team={m.away_team} score={m.away_score} won={awayWon} done={done} isDoubles={isDoubles} />
                      </div>
                      <div className="flex flex-col items-center justify-center px-4 border-l border-zinc-800 gap-1 min-w-[52px]">
                        <span className="text-[10px] font-semibold text-zinc-700 uppercase tracking-wider">#{matchNum}</span>
                        {done ? (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-green-600">FT</span>
                        ) : (
                          <span className="text-xs text-zinc-700 font-medium">vs</span>
                        )}
                      </div>
                    </div>

                    {done && (
                      <div className="border-t border-green-900/30 bg-green-950/20 px-4 py-2.5 flex items-center justify-between">
                        {winner ? (
                          <>
                            <span className="text-xs font-semibold text-green-300 tracking-wide">
                              {displayName(homeWon ? m.home_team.name : m.away_team.name, isDoubles)}
                            </span>
                            <span className="text-xs text-green-400" style={{ fontFamily: 'Sora, sans-serif' }}>
                              won by {margin} {(() => { const s = (scoreUnit || 'points').replace(/s$/i, ''); return margin === 1 ? s : s + 's' })()}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-zinc-500 tracking-wide w-full text-center">Draw</span>
                        )}
                      </div>
                    )}
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
