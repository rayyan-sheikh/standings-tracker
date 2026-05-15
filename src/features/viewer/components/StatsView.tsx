import type { Team, MatchWithTeams, TournamentRules, SportType } from '@/shared/types'
import { DEFAULT_RULES } from '@/shared/types'
import CustomStats from './stats/CustomStats'

interface Props {
  sport: SportType
  teams: Team[]
  matches: MatchWithTeams[]
  rules?: TournamentRules
  scoreUnit?: string
}

export default function StatsView({ sport, teams, matches, rules = DEFAULT_RULES, scoreUnit = 'point' }: Props) {
  switch (sport) {
    case 'custom':
    default:
      return <CustomStats teams={teams} matches={matches} rules={rules} scoreUnit={scoreUnit} />
  }
}
