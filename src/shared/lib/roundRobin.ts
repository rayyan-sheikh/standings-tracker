export interface ScheduledMatch {
  round: number
  homeTeamId: string
  awayTeamId: string
}

export function generateRoundRobin(teamIds: string[], flipHomeAway = false): ScheduledMatch[] {
  const teams = [...teamIds]
  const hasBye = teams.length % 2 !== 0
  if (hasBye) teams.push('BYE')

  const n = teams.length
  const rounds = n - 1
  const matches: ScheduledMatch[] = []
  const rotating = teams.slice(1)

  for (let round = 0; round < rounds; round++) {
    const fixed = teams[0]
    const pair: [string, string] = round % 2 === 0
      ? [fixed, rotating[0]]
      : [rotating[0], fixed]

    if (pair[0] !== 'BYE' && pair[1] !== 'BYE') {
      const [home, away] = flipHomeAway ? [pair[1], pair[0]] : pair
      matches.push({ round: round + 1, homeTeamId: home, awayTeamId: away })
    }

    for (let i = 0; i < Math.floor(n / 2) - 1; i++) {
      const top = rotating[i + 1]
      const bottom = rotating[rotating.length - 1 - i]
      const [home, away] = flipHomeAway ? [bottom, top] : [top, bottom]
      if (top !== 'BYE' && bottom !== 'BYE') {
        matches.push({ round: round + 1, homeTeamId: home, awayTeamId: away })
      }
    }

    rotating.push(rotating.shift()!)
  }

  return matches
}
