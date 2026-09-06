import api from './api'

export async function fetchPublicOverview() {
  const { data } = await api.get('/public/overview')
  return data
}

export async function fetchPublicBarangays() {
  const { data } = await api.get('/public/barangays')
  return data
}

export async function fetchPublicBarangay(id) {
  const { data } = await api.get(`/public/barangays/${id}`)
  return data
}

export async function fetchPublicRankings() {
  const { data } = await api.get('/public/rankings')
  return data
}
