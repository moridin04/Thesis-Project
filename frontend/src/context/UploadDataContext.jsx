import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { notifyBarangayDataChanged } from '../data/barangayData'
import {
  createAccount,
  fetchAccounts,
  fetchAuditLogs,
  patchAccountRole,
  patchAccountStatus,
} from '../services/adminService'
import {
  approveUpload as approveUploadRequest,
  fetchAllUploads,
  fetchMyUploads,
  rejectUpload as rejectUploadRequest,
  submitUpload as submitUploadRequest,
} from '../services/uploadService'

const UploadDataContext = createContext(null)

export function UploadDataProvider({ children }) {
  const { account, isAuthenticated, role, loading: authLoading } = useAuth()
  const [uploads, setUploads] = useState([])
  const [users, setUsers] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isAdmin = role === 'admin'

  const refreshUploads = useCallback(async () => {
    if (!isAuthenticated) {
      setUploads([])
      return
    }

    const rows = isAdmin ? await fetchAllUploads() : await fetchMyUploads()
    setUploads(rows)
  }, [isAdmin, isAuthenticated])

  const refreshUsers = useCallback(async () => {
    if (!isAuthenticated || !isAdmin) {
      setUsers([])
      return
    }
    const rows = await fetchAccounts()
    setUsers(rows)
  }, [isAdmin, isAuthenticated])

  const refreshAuditLogs = useCallback(async () => {
    if (!isAuthenticated || !isAdmin) {
      setAuditLogs([])
      return
    }
    const rows = await fetchAuditLogs()
    setAuditLogs(rows)
  }, [isAdmin, isAuthenticated])

  const refreshAll = useCallback(async () => {
    if (!isAuthenticated) {
      setUploads([])
      setUsers([])
      setAuditLogs([])
      return
    }

    setLoading(true)
    setError('')
    try {
      await Promise.all([refreshUploads(), refreshUsers(), refreshAuditLogs()])
    } catch (err) {
      setError(err?.response?.data?.detail ?? 'Unable to load workspace data.')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, refreshAuditLogs, refreshUploads, refreshUsers])

  useEffect(() => {
    if (authLoading) return
    refreshAll()
  }, [authLoading, refreshAll, account?.id, role])

  const submitUpload = useCallback(
    async ({ barangayName, dataType, notes, file }) => {
      const formData = new FormData()
      if (file) formData.append('file', file)
      formData.append('barangay_name', barangayName)
      formData.append('data_type', dataType)
      formData.append('notes', notes ?? '')

      const record = await submitUploadRequest(formData)
      setUploads((current) => [record, ...current])
      if (isAdmin) {
        await refreshAuditLogs()
      }
      return record
    },
    [isAdmin, refreshAuditLogs],
  )

  const approveUpload = useCallback(
    async (uploadId) => {
      const record = await approveUploadRequest(uploadId)
      setUploads((current) =>
        current.map((item) => (item.id === uploadId ? record : item)),
      )
      notifyBarangayDataChanged()
      await refreshAuditLogs()
      return record
    },
    [refreshAuditLogs],
  )

  const rejectUpload = useCallback(
    async (uploadId, rejectionReason = '') => {
      const record = await rejectUploadRequest(uploadId, rejectionReason)
      setUploads((current) =>
        current.map((item) => (item.id === uploadId ? record : item)),
      )
      await refreshAuditLogs()
      return record
    },
    [refreshAuditLogs],
  )

  const updateUser = useCallback(
    async (userId, patch) => {
      let updated
      if (patch.role !== undefined) {
        updated = await patchAccountRole(userId, patch.role)
      } else if (patch.status !== undefined) {
        updated = await patchAccountStatus(userId, patch.status === 'active')
      } else {
        return
      }

      setUsers((current) =>
        current.map((user) => (user.id === userId ? updated : user)),
      )
      await refreshAuditLogs()
      return updated
    },
    [refreshAuditLogs],
  )

  const addUser = useCallback(
    async ({ name, username, password, role: nextRole }) => {
      const created = await createAccount({
        full_name: name,
        username,
        password,
        role: nextRole,
      })
      setUsers((current) => [...current, created])
      await refreshAuditLogs()
      return created
    },
    [refreshAuditLogs],
  )

  const value = useMemo(
    () => ({
      uploads,
      users,
      auditLogs,
      loading,
      error,
      refreshAll,
      submitUpload,
      approveUpload,
      rejectUpload,
      updateUser,
      addUser,
      uploadsForUser: (userId) => uploads.filter((item) => item.uploaderId === userId),
      pendingUploads: uploads.filter((item) => item.status === 'pending'),
    }),
    [
      uploads,
      users,
      auditLogs,
      loading,
      error,
      refreshAll,
      submitUpload,
      approveUpload,
      rejectUpload,
      updateUser,
      addUser,
    ],
  )

  return (
    <UploadDataContext.Provider value={value}>{children}</UploadDataContext.Provider>
  )
}

export function useUploadData() {
  const context = useContext(UploadDataContext)
  if (!context) {
    throw new Error('useUploadData must be used within UploadDataProvider')
  }
  return context
}
