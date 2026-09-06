import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { useUploadData } from '../../context/UploadDataContext'
import PageHeader from '../../components/shared/PageHeader'

export default function ManageUsers() {
  const { users, updateUser, addUser, loading, error } = useUploadData()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('staff')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [busyUserId, setBusyUserId] = useState(null)

  async function handleAddUser(event) {
    event.preventDefault()
    if (submitting) return
    setFormError('')
    setSubmitting(true)
    try {
      await addUser({
        name: name.trim(),
        username: username.trim(),
        password,
        role,
      })
      setName('')
      setUsername('')
      setPassword('')
      setRole('staff')
    } catch (err) {
      setFormError(err?.response?.data?.detail ?? 'Unable to create account.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRoleChange(userId, nextRole) {
    setBusyUserId(userId)
    try {
      await updateUser(userId, { role: nextRole })
    } finally {
      setBusyUserId(null)
    }
  }

  async function handleStatusChange(userId, nextStatus) {
    setBusyUserId(userId)
    try {
      await updateUser(userId, { status: nextStatus })
    } finally {
      setBusyUserId(null)
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Manage Users"
        subtitle="Approve registrations and manage LGU/Staff and Admin access."
      />

      {error ? (
        <p className="rounded-xl border border-[color:var(--risk-high)]/30 bg-[color-mix(in_srgb,var(--accent-soft)_55%,white)] px-4 py-3 text-sm text-foundation">
          {typeof error === 'string' ? error : 'Unable to load accounts.'}
        </p>
      ) : null}

      <form className="card-surface max-w-xl space-y-4 rounded-2xl p-6" onSubmit={handleAddUser}>
        <h2 className="font-display text-lg font-semibold text-heading">Add User</h2>
        <input
          className="input-field"
          placeholder="Full name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <input
          className="input-field"
          placeholder="Username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
        />
        <input
          className="input-field"
          type="password"
          placeholder="Temporary password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <select className="input-field" value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="staff">LGU / Staff</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-70">
          {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          Add User
        </button>
        {formError ? <p className="text-sm text-[color:var(--color-accent)]">{formError}</p> : null}
      </form>

      {loading ? (
        <p className="text-sm text-muted">Loading accounts…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[color:var(--border-subtle)]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[color:var(--color-tint-soft)] text-ocean">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Username</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-[color:var(--border-subtle)]">
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3">{user.username}</td>
                  <td className="px-4 py-3">
                    <select
                      className="input-field-light"
                      value={user.role}
                      disabled={busyUserId === user.id}
                      onChange={(event) => handleRoleChange(user.id, event.target.value)}
                    >
                      <option value="staff">LGU / Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="input-field-light"
                      value={user.status}
                      disabled={busyUserId === user.id}
                      onChange={(event) => handleStatusChange(user.id, event.target.value)}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
