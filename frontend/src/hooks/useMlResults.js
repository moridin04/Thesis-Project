/*
 * Loads model results once for the staff model section.
 * ModelResultsSection.jsx reads results, loading, and error.
 * The request is fetchMlResults in services/mlService.js.
 */
import { useEffect, useState } from 'react'
import { fetchMlResults } from '../services/mlService'

// Drops the result if this section unmounts before the request finishes.
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
