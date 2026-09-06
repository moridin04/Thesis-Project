import { useEffect, useState } from 'react'
import {
  getApprovedPriorityBarangays,
  loadApprovedPriorityBarangays,
  subscribeBarangayData,
} from '../data/barangayData'

export function useApprovedBarangays() {
  const [rows, setRows] = useState(() => getApprovedPriorityBarangays())

  useEffect(() => {
    let active = true

    async function refresh() {
      const next = await loadApprovedPriorityBarangays()
      if (active) setRows(next)
    }

    refresh()
    return subscribeBarangayData(() => {
      refresh()
    })
  }, [])

  return rows
}
