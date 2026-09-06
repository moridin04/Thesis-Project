import { priorityBarangays as baselineBarangays } from './mockOverview'
import { fetchApprovedBarangays } from '../services/uploadService'

const listeners = new Set()

export function subscribeBarangayData(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function notifyBarangayDataChanged() {
  listeners.forEach((listener) => listener())
}

function mergeBaselineWithApproved(approvedUploads) {
  const seen = new Set(baselineBarangays.map((row) => row.barangay.toLowerCase()))
  const merged = [...baselineBarangays]

  for (const row of approvedUploads) {
    const key = row.barangay.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(row)
  }

  return merged.sort((a, b) => b.dpi - a.dpi)
}

/** Published barangay rows — baseline mock data plus admin-approved uploads. */
export function getApprovedPriorityBarangays() {
  return [...baselineBarangays].sort((a, b) => b.dpi - a.dpi)
}

export async function loadApprovedPriorityBarangays() {
  try {
    const approvedUploads = await fetchApprovedBarangays()
    return mergeBaselineWithApproved(approvedUploads)
  } catch {
    return getApprovedPriorityBarangays()
  }
}
