import type { MatchWithTeams, Standing, Team, TournamentRules } from '@/types'
import { DEFAULT_RULES } from '@/types'

export function computeStandings(
  teams: Team[],
  matches: MatchWithTeams[],
  rules: TournamentRules = DEFAULT_RULES
): Standing[] {
  const map = new Map<string, Standing>()

  for (const team of teams) {
    map.set(team.id, {
      team,
      played: 0, won: 0, drawn: 0, lost: 0,
      goals_for: 0, goals_against: 0, goal_difference: 0, points: 0,
    })
  }

  for (const m of matches) {
    if (m.status !== 'completed' || m.home_score === null || m.away_score === null) continue
    const home = map.get(m.home_team_id)
    const away = map.get(m.away_team_id)
    if (!home || !away) continue

    home.played++
    away.played++
    home.goals_for += m.home_score
    home.goals_against += m.away_score
    away.goals_for += m.away_score
    away.goals_against += m.home_score

    if (m.home_score > m.away_score) {
      home.won++; home.points += rules.points_win
      away.lost++; away.points += rules.points_loss
    } else if (m.home_score < m.away_score) {
      away.won++; away.points += rules.points_win
      home.lost++; home.points += rules.points_loss
    } else {
      home.drawn++; home.points += rules.points_draw
      away.drawn++; away.points += rules.points_draw
    }
  }

  return Array.from(map.values())
    .map(s => ({ ...s, goal_difference: s.goals_for - s.goals_against }))
    .sort((a, b) =>
      b.points - a.points ||
      b.goal_difference - a.goal_difference ||
      b.goals_for - a.goals_for ||
      a.team.name.localeCompare(b.team.name)
    )
}
