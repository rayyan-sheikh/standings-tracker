import type { Leg, MatchWithTeams } from '@/types'
import { Badge } from '@/components/ui/badge'

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
              {roundMatches.map(m => (
                <div key={m.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <span className="flex-1 text-right font-medium text-sm">{m.home_team.name}</span>
                  {m.status === 'completed' ? (
                    <Badge variant="outline" className="font-mono px-3 py-1 shrink-0">
                      {m.home_score} – {m.away_score}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs shrink-0">vs</Badge>
                  )}
                  <span className="flex-1 font-medium text-sm">{m.away_team.name}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
