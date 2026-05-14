export interface TournamentRules {
  points_win: number
  points_draw: number
  points_loss: number
  max_score: number
}

export const DEFAULT_RULES: TournamentRules = {
  points_win: 3,
  points_draw: 1,
  points_loss: 0,
  max_score: 99,
}

export interface Tournament {
  id: string
  name: string
  description: string | null
  rules: TournamentRules
  created_at: string
}

export interface Team {
  id: string
  tournament_id: string
  name: string
  created_at: string
}

export interface Leg {
  id: string
  tournament_id: string
  leg_number: number
  name: string | null
}

export interface Match {
  id: string
  leg_id: string
  home_team_id: string
  away_team_id: string
  home_score: number | null
  away_score: number | null
  scheduled_at: string | null
  status: 'scheduled' | 'completed'
  round_number: number
}

export interface MatchWithTeams extends Match {
  home_team: Team
  away_team: Team
}

export interface Standing {
  team: Team
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  goal_difference: number
  points: number
}
