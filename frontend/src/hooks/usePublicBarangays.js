import { useEffect, useState } from 'react'
import { fetchPublicBarangays } from '../services/publicService'

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
