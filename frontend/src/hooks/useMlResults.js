import { useEffect, useState } from 'react'
import { fetchMlResults } from '../services/mlService'

export function useMlResults() {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetchMlResults()
      .then((data) => {
        if (active) setResults(data)
      })
      .catch(() => {
        if (active) setError('Unable to load model results. Check that the API is running.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return { results, loading, error }
}
