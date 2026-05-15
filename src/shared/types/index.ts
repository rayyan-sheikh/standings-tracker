export type Tiebreaker = 'head_to_head' | 'gd' | 'gf' | 'ga' | 'wins'

export interface TournamentRules {
  points_win: number
  points_draw: number
  points_loss: number
  max_score: number
  score_unit: string
  tiebreakers: Tiebreaker[]
  promotion_spots: number
  relegation_spots: number
}

export const DEFAULT_RULES: TournamentRules = {
  points_win: 3,
  points_draw: 1,
  points_loss: 0,
  max_score: 20,
  score_unit: 'point',
  tiebreakers: ['head_to_head', 'gd', 'gf'],
  promotion_spots: 0,
  relegation_spots: 0,
}

export type TournamentType = 'league'

export const TOURNAMENT_TYPES: { value: TournamentType; label: string; description: string }[] = [
  { value: 'league', label: 'League', description: 'Every team plays each other. Points table decides the winner.' },
]

export type ParticipantType = 'team' | 'singles' | 'doubles'

export type SportType = 'custom'

export const SPORTS: { value: SportType; label: string; description: string }[] = [
  { value: 'custom', label: 'Custom', description: 'Define your own scoring rules' },
]

export type TournamentStatus = 'active' | 'completed'

export interface Tournament {
  id: string
  name: string
  description: string | null
  type: TournamentType
  sport: SportType
  participant_type: ParticipantType
  status: TournamentStatus
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

export interface TournamentDay {
  id: string
  tournament_id: string
  day_number: number
  label: string | null
  date: string // ISO date string YYYY-MM-DD
}

export interface Match {
  id: string
  leg_id: string
  day_id: string | null
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
