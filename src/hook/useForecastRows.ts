// useForecastRows.ts
import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import type { ForecastRow } from '../types/forecast'

export function useForecastRows(projectId: string) {
  const [rows, setRows] = useState<ForecastRow[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data, error } = await supabase
        .from('project_sheets')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error(error)
        return
      }
      if (!cancelled) setRows(data as ForecastRow[])
    }

    load()

    // realtime subscription (optional but nice)
    const channel = supabase
      .channel('project_sheets_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_sheets',
          filter: `project_id=eq.${projectId}`
        },
        payload => {
          setRows(current => {
            const row = payload.new as ForecastRow
            switch (payload.eventType) {
              case 'INSERT':
                return [...current, row]
              case 'UPDATE':
                return current.map(r => (r.id === row.id ? row : r))
              case 'DELETE':
                return current.filter(r => r.id !== payload.old.id)
              default:
                return current
            }
          })
        }
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [projectId])

  return { rows, setRows }
}
