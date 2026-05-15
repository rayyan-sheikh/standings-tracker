import type { MatchWithTeams, Standing, Team, TournamentRules, Tiebreaker } from '@/shared/types'
import { DEFAULT_RULES } from '@/shared/types'

export function computeStandings(
  teams: Team[],
  matches: MatchWithTeams[],
  rules: TournamentRules = DEFAULT_RULES
): Standing[] {
  const map = new Map<string, Standing>()

  for (const team of teams) {
    map.set(team.id, {
      team, played: 0, won: 0, drawn: 0, lost: 0,
      goals_for: 0, goals_against: 0, goal_difference: 0, points: 0,
    })
  }

  for (const m of matches) {
    if (m.status !== 'completed' || m.home_score === null || m.away_score === null) continue
    const home = map.get(m.home_team_id)
    const away = map.get(m.away_team_id)
    if (!home || !away) continue

    home.played++; away.played++
    home.goals_for += m.home_score; home.goals_against += m.away_score
    away.goals_for += m.away_score; away.goals_against += m.home_score

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

  const standings = Array.from(map.values())
    .map(s => ({ ...s, goal_difference: s.goals_for - s.goals_against }))

  const tiebreakers: Tiebreaker[] = rules.tiebreakers ?? ['head_to_head', 'gd', 'gf']

  return sortWithTiebreakers(standings, matches, tiebreakers, rules)
}

function sortWithTiebreakers(
  standings: Standing[],
  matches: MatchWithTeams[],
  tiebreakers: Tiebreaker[],
  rules: TournamentRules
): Standing[] {
  const sorted = [...standings].sort((a, b) => b.points - a.points)

  // Group teams with equal points and apply tiebreakers within each group
  const result: Standing[] = []
  let i = 0
  while (i < sorted.length) {
    let j = i + 1
    while (j < sorted.length && sorted[j].points === sorted[i].points) j++
    const group = sorted.slice(i, j)
    result.push(...breakTies(group, matches, tiebreakers, rules))
    i = j
  }

  return result
}

function breakTies(
  group: Standing[],
  matches: MatchWithTeams[],
  tiebreakers: Tiebreaker[],
  rules: TournamentRules
): Standing[] {
  if (group.length === 1) return group

  for (const tb of tiebreakers) {
    if (tb === 'head_to_head') {
      const teamIds = new Set(group.map(s => s.team.id))
      const h2hMatches = matches.filter(
        m => m.status === 'completed' &&
          m.home_score !== null && m.away_score !== null &&
          teamIds.has(m.home_team_id) && teamIds.has(m.away_team_id)
      )
      if (h2hMatches.length === 0) continue

      // Compute mini-table among tied teams
      const h2hMap = new Map<string, { pts: number; gd: number; gf: number }>()
      for (const s of group) h2hMap.set(s.team.id, { pts: 0, gd: 0, gf: 0 })

      for (const m of h2hMatches) {
        const home = h2hMap.get(m.home_team_id)!
        const away = h2hMap.get(m.away_team_id)!
        home.gf += m.home_score!; home.gd += m.home_score! - m.away_score!
        away.gf += m.away_score!; away.gd += m.away_score! - m.home_score!
        if (m.home_score! > m.away_score!) {
          home.pts += rules.points_win; away.pts += rules.points_loss
        } else if (m.home_score! < m.away_score!) {
          away.pts += rules.points_win; home.pts += rules.points_loss
        } else {
          home.pts += rules.points_draw; away.pts += rules.points_draw
        }
      }

      const sorted = [...group].sort((a, b) => {
        const ha = h2hMap.get(a.team.id)!
        const hb = h2hMap.get(b.team.id)!
        return hb.pts - ha.pts || hb.gd - ha.gd || hb.gf - ha.gf
      })

      // If head-to-head fully resolves ties, use it; otherwise continue
      if (sorted[0].team.id !== sorted[sorted.length - 1].team.id) {
        // Re-apply remaining tiebreakers within head-to-head equal groups
        const remaining = tiebreakers.filter(t => t !== 'head_to_head')
        return sortWithTiebreakers(sorted, matches, remaining, rules)
      }
    } else {
      const getValue = (s: Standing) => {
        if (tb === 'gd') return s.goal_difference
        if (tb === 'gf') return s.goals_for
        if (tb === 'ga') return -s.goals_against
        if (tb === 'wins') return s.won
        return 0
      }

      const allEqual = group.every(s => getValue(s) === getValue(group[0]))
      if (allEqual) continue

      return [...group].sort((a, b) => getValue(b) - getValue(a))
    }
  }

  // Final fallback: alphabetical
  return [...group].sort((a, b) => a.team.name.localeCompare(b.team.name))
}
