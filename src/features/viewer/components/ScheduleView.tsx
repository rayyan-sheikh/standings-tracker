import type { Leg, MatchWithTeams, TournamentDay } from '@/shared/types'
import { cn } from '@/shared/lib/utils'
import { format } from 'date-fns'

interface Props {
  legs: Leg[]
  days: TournamentDay[]
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
  if (isDoubles && name.includes(' / ')) return name.replace(' / ', ' & ')
  return name
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const tomorrow = new Date(today.getTime() + 86400000)
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === today.toDateString()) return `Today · ${time}`
  if (d.toDateString() === tomorrow.toDateString()) return `Tomorrow · ${time}`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ` · ${time}`
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

export default function ScheduleView({ legs, days, matches, scoreUnit = 'points', isDoubles = false }: Props) {
  const sortedLegs = [...legs].sort((a, b) => a.leg_number - b.leg_number)
  const sortedDays = [...days].sort((a, b) => a.day_number - b.day_number)
  const hasDays = days.length > 0

  const matchesByDay = sortedDays.map(day => ({
    day,
    matches: matches
      .filter(m => m.day_id === day.id)
      .sort((a, b) => {
        if (a.scheduled_at && b.scheduled_at) return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
        return 0
      }),
  }))

  const unscheduledMatches = hasDays ? matches.filter(m => !m.day_id) : []

  const matchesByLeg = sortedLegs.map(leg => ({
    leg,
    matches: matches.filter(m => m.leg_id === leg.id),
  }))

  if (matches.length === 0) {
    return <p className="text-sm text-zinc-600 text-center py-8">No matches scheduled yet.</p>
  }

  const matchNumberMap = new Map(matches.map((m, i) => [m.id, i + 1]))

  function renderMatches(groupMatches: MatchWithTeams[]) {
    return groupMatches.map(m => {
      const matchNum = matchNumberMap.get(m.id) ?? 0
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
            <div className="flex flex-col items-center justify-center px-3 border-l border-zinc-800 gap-1 min-w-[56px]">
              <span className="text-[10px] font-semibold text-zinc-700 uppercase tracking-wider">#{matchNum}</span>
              {done ? (
                <span className="text-[10px] font-bold uppercase tracking-widest text-green-600">FT</span>
              ) : m.scheduled_at ? (
                <span className="text-[10px] text-zinc-300 text-center leading-tight">{formatTime(m.scheduled_at)}</span>
              ) : (
                <span className="text-xs text-zinc-700">vs</span>
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
                    won by {margin} {(() => { const s = (scoreUnit || 'point').replace(/s$/i, ''); return margin === 1 ? s : s + 's' })()}
                  </span>
                </>
              ) : (
                <span className="text-xs text-zinc-500 tracking-wide w-full text-center">Draw</span>
              )}
            </div>
          )}
        </div>
      )
    })
  }

  if (hasDays) {
    return (
      <div className="space-y-10">
        {matchesByDay.map(({ day, matches: dayMatches }) => {
          if (dayMatches.length === 0) return null
          return (
            <div key={day.id}>
              <div className="flex items-center gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-green-400">
                    {day.label ?? `Day ${day.day_number}`}
                  </h3>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    {format(new Date(day.date + 'T00:00:00'), 'EEEE, MMMM d')}
                  </p>
                </div>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>
              <div className="space-y-3">{renderMatches(dayMatches)}</div>
            </div>
          )
        })}
        {unscheduledMatches.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-600">Unscheduled</h3>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>
            <div className="space-y-3">{renderMatches(unscheduledMatches)}</div>
          </div>
        )}
      </div>
    )
  }

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

            <div className="space-y-3">{renderMatches(legMatches)}</div>
          </div>
        )
      })}
    </div>
  )
}
