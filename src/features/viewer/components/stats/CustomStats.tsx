import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts'
import type { Team, MatchWithTeams, TournamentRules } from '@/shared/types'
import { computeStandings } from '@/shared/utils/standings'

interface Props {
  teams: Team[]
  matches: MatchWithTeams[]
  rules: TournamentRules
  scoreUnit: string
}

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32']
const LINE_COLORS = [
  '#4ade80', '#60a5fa', '#f472b6', '#fb923c',
  '#a78bfa', '#34d399', '#fbbf24', '#38bdf8',
]

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
      <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-lg font-bold text-zinc-100" style={{ fontFamily: 'Sora, sans-serif' }}>{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function CustomStats({ teams, matches, rules, scoreUnit }: Props) {
  const standings = computeStandings(teams, matches, rules)
  const completed = matches.filter(m => m.status === 'completed' && m.home_score !== null && m.away_score !== null)

  if (standings.length === 0) {
    return <p className="text-sm text-zinc-600 text-center py-8">No stats yet — play some matches first.</p>
  }

  const unit = (scoreUnit || 'point').replace(/s$/i, '')
  const unitPlural = unit + 's'

  // Quick facts
  const highestScoringMatch = completed.reduce<MatchWithTeams | null>((best, m) => {
    const total = m.home_score! + m.away_score!
    return !best || total > (best.home_score! + best.away_score!) ? m : best
  }, null)

  const biggestWin = completed.reduce<{ winner: string; loser: string; margin: number } | null>((best, m) => {
    const margin = Math.abs(m.home_score! - m.away_score!)
    if (!best || margin > best.margin) {
      const homeWon = m.home_score! > m.away_score!
      return { winner: homeWon ? m.home_team.name : m.away_team.name, loser: homeWon ? m.away_team.name : m.home_team.name, margin }
    }
    return best
  }, null)

  // Build per-match data for line charts
  const matchProgression = (() => {
    const cumulativePts: Record<string, number> = {}
    teams.forEach(t => { cumulativePts[t.id] = 0 })

    return completed.map((m, i) => {
      const hWon = m.home_score! > m.away_score!
      const aWon = m.away_score! > m.home_score!
      const draw = m.home_score === m.away_score

      cumulativePts[m.home_team_id] += hWon ? rules.points_win : draw ? rules.points_draw : rules.points_loss
      cumulativePts[m.away_team_id] += aWon ? rules.points_win : draw ? rules.points_draw : rules.points_loss

      const point: Record<string, number | string> = { match: `#${i + 1}` }
      teams.forEach(t => { point[t.id] = cumulativePts[t.id] })
      return point
    })
  })()

  // Bar chart data — points
  const chartData = standings.map(s => ({
    name: s.team.name,
    pts: s.points,
    won: s.won,
    drawn: s.drawn,
    lost: s.lost,
  }))

  const yAxisWidth = Math.min(Math.max(...chartData.map(d => d.name.length)) * 7 + 8, 180)

  const top3 = standings.slice(0, 3)

  return (
    <div className="space-y-6">

      {/* Podium */}
      {top3.length >= 2 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600 mb-3">Podium</p>
          <div className="grid grid-cols-3 gap-2">
            {top3.map((s, i) => (
              <div key={s.team.id} className="relative rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-4 text-center overflow-hidden">
                <span style={{
                  position: 'absolute', top: 0, left: 0, width: 0, height: 0,
                  borderTop: `22px solid ${MEDAL_COLORS[i]}`,
                  borderRight: '22px solid transparent',
                }} />
                <p className="text-2xl font-black" style={{ fontFamily: 'Sora, sans-serif', color: MEDAL_COLORS[i] }}>
                  {s.points}
                </p>
                <p className="text-[10px] text-zinc-500 mb-1">{unitPlural}</p>
                <p className="text-xs font-semibold text-zinc-300 truncate">{s.team.name}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">{s.won}W {s.drawn}D {s.lost}L</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cumulative points progression */}
      {matchProgression.length > 1 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600 mb-3">Points progression</p>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 outline-none select-none">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={matchProgression} margin={{ left: -10, right: 10, top: 8, bottom: 0 }}>
                <XAxis dataKey="match" tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#a1a1aa' }}
                  formatter={(value, _, props) => {
                    const key = props.dataKey as string
                    const team = teams.find(t => t.id === key)
                    return [`${value} pts`, team?.name ?? key]
                  }}
                />
                <Legend formatter={(value) => teams.find(t => t.id === value)?.name ?? value}
                  wrapperStyle={{ fontSize: 11, color: '#a1a1aa', paddingTop: 8 }} />
                {teams.map((t, i) => (
                  <Line key={t.id} type="monotone" dataKey={t.id} stroke={LINE_COLORS[i % LINE_COLORS.length]}
                    strokeWidth={2} dot={{ r: 3, fill: LINE_COLORS[i % LINE_COLORS.length] }} activeDot={{ r: 5 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* W/D/L chart */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600 mb-3">Win / Draw / Loss</p>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <ResponsiveContainer width="100%" height={Math.max(chartData.length * 36, 120)}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 24, top: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} width={yAxisWidth} />
              <Tooltip
                cursor={{ fill: '#27272a' }}
                contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#f4f4f5', fontWeight: 600 }}
                labelFormatter={(_: unknown, payload: readonly { payload?: { name?: string } }[]) => payload?.[0]?.payload?.name ?? ''}
              />
              <Bar dataKey="won" name="Won" stackId="a" fill="#4ade80" maxBarSize={22} />
              <Bar dataKey="drawn" name="Drawn" stackId="a" fill="#a1a1aa" maxBarSize={22} />
              <Bar dataKey="lost" name="Lost" stackId="a" fill="#f87171" radius={[0, 6, 6, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick facts */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600 mb-3">Quick facts</p>
        <div className="grid grid-cols-2 gap-3">
          {standings[0] && (
            <StatCard label="Most points" value={`${standings[0].points} pts`} sub={standings[0].team.name} />
          )}
          {standings[standings.length - 1] && standings.length > 1 && (
            <StatCard label="Least points" value={`${standings[standings.length - 1].points} pts`} sub={standings[standings.length - 1].team.name} />
          )}
          {highestScoringMatch && (
            <StatCard
              label="Highest scoring match"
              value={`${highestScoringMatch.home_score} – ${highestScoringMatch.away_score}`}
              sub={`${highestScoringMatch.home_team.name} vs ${highestScoringMatch.away_team.name}`}
            />
          )}
          {biggestWin && biggestWin.margin > 0 && (
            <StatCard
              label="Biggest win"
              value={`by ${biggestWin.margin} ${biggestWin.margin === 1 ? unit : unitPlural}`}
              sub={`${biggestWin.winner} beat ${biggestWin.loser}`}
            />
          )}
          {standings[0] && (() => {
            const maxWins = Math.max(...standings.map(s => s.won))
            const leaders = standings.filter(s => s.won === maxWins)
            return (
              <StatCard
                label="Most wins"
                value={`${maxWins} win${maxWins !== 1 ? 's' : ''}`}
                sub={leaders.map(s => s.team.name).join(', ')}
              />
            )
          })()}
          <StatCard label="Matches played" value={`${completed.length}`} sub={`of ${matches.length} total`} />
        </div>
      </div>
    </div>
  )
}
