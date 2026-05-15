import { useEffect } from 'react'
import { supabase } from '@/shared/lib/supabase'

interface Options {
  tournamentId: string
  legIds: string[]
  onUpdate: () => void
}

export function useRealtimeTournament({ tournamentId, legIds, onUpdate }: Options) {
  useEffect(() => {
    if (!tournamentId) return

    const channel = supabase
      .channel(`tournament:${tournamentId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, onUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams', filter: `tournament_id=eq.${tournamentId}` }, onUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'legs', filter: `tournament_id=eq.${tournamentId}` }, onUpdate)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tournamentId, legIds.join(','), onUpdate])
}
