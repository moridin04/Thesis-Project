/*
 * Loads the public barangay list once.
 * The overview dashboard and the priority map use this hook.
 * The request is fetchPublicBarangays in services/publicService.js.
 */
import { useEffect, useState } from 'react'
import { fetchPublicBarangays } from '../services/publicService'

// Drops the result if the page unmounts before the request finishes.
export function usePublicBarangays() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetchPublicBarangays()
      .then((data) => {
        if (active) setRows(data)
      })
      .catch(() => {
        if (active) setError('Unable to load barangay priorities. Check that the API is running.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return { rows, loading, error }
}
