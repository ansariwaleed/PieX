'use client'

import { useState } from 'react'
import styles from '../super-admin.module.css'

interface ResetItem {
  id: string
  userId: string
  status: string
  requestedAt: string
  resolvedAt?: string | null
  user: {
    id: string
    name: string
    email: string
    role: string
    rollNumber: string | null
    branch: string | null
    campus?: { id: string; name: string; location: string } | null
  }
  resolvedBy?: {
    name: string
    email: string
    role: string
  } | null
}

export default function SuperAdminResetsClient({
  initialPending,
  initialResolved
}: {
  initialPending: ResetItem[]
  initialResolved: ResetItem[]
}) {
  const [pending, setPending] = useState<ResetItem[]>(initialPending)
  const [resolved, setResolved] = useState<ResetItem[]>(initialResolved)
  const [selectedReq, setSelectedReq] = useState<ResetItem | null>(null)
  const [tempPassword, setTempPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [filterRole, setFilterRole] = useState<'ALL' | 'TPC_ADMIN' | 'STUDENT'>('ALL')
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string; password?: string } | null>(null)

  const filteredPending = pending.filter(r => {
    if (filterRole === 'ALL') return true
    return r.user.role === filterRole
  })

  const tpcPendingCount = pending.filter(r => r.user.role === 'TPC_ADMIN').length
  const studentPendingCount = pending.filter(r => r.user.role === 'STUDENT').length

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$'
    let result = ''
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setTempPassword(result)
  }

  const handleOpenApprove = (req: ResetItem) => {
    setSelectedReq(req)
    if (req.user.role === 'TPC_ADMIN') {
      setTempPassword('Admin@2026')
    } else {
      const roll = req.user.rollNumber ? req.user.rollNumber.replace(/[^a-zA-Z0-9]/g, '') : 'Student'
      setTempPassword(`${roll}@2026`)
    }
  }

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReq) return

    if (!tempPassword || tempPassword.length < 6) {
      alert("Password must be at least 6 characters.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/password-reset-requests/${selectedReq.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'APPROVED',
          newPassword: tempPassword
        })
      })

      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Failed to approve request')
      } else {
        const approvedItem: ResetItem = {
          ...selectedReq,
          status: 'APPROVED',
          resolvedAt: new Date().toISOString(),
          resolvedBy: { name: 'Super Admin', email: '', role: 'SUPER_ADMIN' }
        }
        setPending(prev => prev.filter(r => r.id !== selectedReq.id))
        setResolved(prev => [approvedItem, ...prev])
        setNotice({
          type: 'success',
          text: `Password updated for ${selectedReq.user.name} (${selectedReq.user.email}).`,
          password: tempPassword
        })
        setSelectedReq(null)
        setTempPassword('')
      }
    } catch (err) {
      alert('Network error while resolving request.')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async (req: ResetItem) => {
    const confirmReject = window.confirm(`Decline password reset request for ${req.user.name} (${req.user.email})?`)
    if (!confirmReject) return

    setLoading(true)
    try {
      const res = await fetch(`/api/password-reset-requests/${req.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'REJECTED'
        })
      })

      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Failed to reject request')
      } else {
        const rejectedItem: ResetItem = {
          ...req,
          status: 'REJECTED',
          resolvedAt: new Date().toISOString(),
          resolvedBy: { name: 'Super Admin', email: '', role: 'SUPER_ADMIN' }
        }
        setPending(prev => prev.filter(r => r.id !== req.id))
        setResolved(prev => [rejectedItem, ...prev])
        setNotice({
          type: 'success',
          text: `Password reset request rejected for ${req.user.name}.`
        })
      }
    } catch (err) {
      alert('Network error while rejecting request.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className={styles.pageHeader}>
        <div className={styles.kicker}>CENTRAL SECURITY & CREDENTIAL MANAGEMENT</div>
        <h1 className={styles.pageTitle}>Password Reset Authority</h1>
        <p className={styles.pageSubtitle}>
          Central oversight of credential recovery requests across TPC administrators and campus students platform-wide.
        </p>
      </div>

      {notice && (
        <div style={{
          padding: '1.25rem',
          marginBottom: '2rem',
          background: notice.type === 'success' ? 'rgba(52, 211, 153, 0.08)' : 'rgba(239, 68, 68, 0.08)',
          border: `1px solid ${notice.type === 'success' ? 'rgba(52, 211, 153, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
          color: notice.type === 'success' ? '#34d399' : '#ef4444'
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600, marginBottom: notice.password ? '0.75rem' : 0 }}>
            {notice.text}
          </div>
          {notice.password && (
            <div style={{
              padding: '0.75rem 1rem',
              background: '#08090b',
              border: '1px solid rgba(52, 211, 153, 0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginTop: '0.5rem',
              width: 'fit-content'
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                COMMUNICATE NEW TEMPORARY PASSWORD:
              </span>
              <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', color: '#ffffff', letterSpacing: '0.08em' }}>
                {notice.password}
              </strong>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(notice.password!)
                  alert('Password copied to clipboard!')
                }}
                style={{
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-mono)',
                  background: 'var(--accent)',
                  color: '#08090b',
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Copy
              </button>
            </div>
          )}
        </div>
      )}

      {/* Info notice about TPC & Super Admin resolution */}
      <div style={{
        padding: '1.25rem 1.5rem',
        marginBottom: '2.5rem',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem'
      }}>
        <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: '1rem' }}>ℹ</span>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <strong style={{ color: '#ffffff' }}>Dual Hierarchy Resolution:</strong><br />
          • <strong>TPC Admin Requests:</strong> Only Super Admin can reset/approve TPC Admin passwords.<br />
          • <strong>Student Requests:</strong> Both their campus TPC Admin and Super Admin have authority. If a TPC Admin approves a student request first, it is marked resolved and automatically cleared from this queue.
        </div>
      </div>

      {/* Pending Section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
              Pending Requests ({pending.length})
            </h2>
            {pending.length > 0 && (
              <span style={{
                padding: '0.2rem 0.6rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                fontWeight: 700,
                background: 'rgba(234, 179, 8, 0.15)',
                border: '1px solid rgba(234, 179, 8, 0.4)',
                color: '#eab308'
              }}>
                {pending.length} ACTION REQUIRED
              </span>
            )}
          </div>

          {/* Role Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setFilterRole('ALL')}
              style={{
                padding: '0.4rem 0.8rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                background: filterRole === 'ALL' ? '#ffffff' : 'transparent',
                color: filterRole === 'ALL' ? '#08090b' : 'var(--text-secondary)',
                border: '1px solid var(--border-strong)',
                cursor: 'pointer'
              }}
            >
              All ({pending.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterRole('TPC_ADMIN')}
              style={{
                padding: '0.4rem 0.8rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                background: filterRole === 'TPC_ADMIN' ? '#ffffff' : 'transparent',
                color: filterRole === 'TPC_ADMIN' ? '#08090b' : 'var(--text-secondary)',
                border: '1px solid var(--border-strong)',
                cursor: 'pointer'
              }}
            >
              TPC Officers ({tpcPendingCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterRole('STUDENT')}
              style={{
                padding: '0.4rem 0.8rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                background: filterRole === 'STUDENT' ? '#ffffff' : 'transparent',
                color: filterRole === 'STUDENT' ? '#08090b' : 'var(--text-secondary)',
                border: '1px solid var(--border-strong)',
                cursor: 'pointer'
              }}
            >
              Students ({studentPendingCount})
            </button>
          </div>
        </div>

        {filteredPending.length === 0 ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-strong)',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem'
          }}>
            ✓ NO PENDING REQUESTS // All credential recovery requests have been resolved.
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User / Account</th>
                <th>Role</th>
                <th>College / Campus</th>
                <th>Requested At</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPending.map((req) => (
                <tr key={req.id}>
                  <td className={styles.primaryCol}>
                    <div style={{ fontWeight: 600, color: '#ffffff' }}>{req.user.name}</div>
                    <div className={styles.subText}>{req.user.email}</div>
                  </td>
                  <td>
                    {req.user.role === 'TPC_ADMIN' ? (
                      <span className={styles.badgeRoleTpc}>TPC OFFICER</span>
                    ) : (
                      <span style={{
                        padding: '0.15rem 0.45rem',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.68rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-secondary)'
                      }}>
                        STUDENT
                      </span>
                    )}
                  </td>
                  <td>
                    <div>{req.user.campus?.name || 'Unassigned'}</div>
                    {req.user.rollNumber && (
                      <div className={styles.subText}>Roll: {req.user.rollNumber}</div>
                    )}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(req.requestedAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleOpenApprove(req)}
                        style={{
                          padding: '0.45rem 0.85rem',
                          background: '#ffffff',
                          color: '#08090b',
                          border: '1px solid #ffffff',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          cursor: 'pointer'
                        }}
                      >
                        Reset Password →
                      </button>
                      <button
                        onClick={() => handleReject(req)}
                        style={{
                          padding: '0.45rem 0.85rem',
                          background: 'transparent',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Super Admin Modal for setting password */}
      {selectedReq && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-strong)',
            maxWidth: '480px',
            width: '100%',
            padding: '2.5rem'
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>
              [SUPER ADMIN AUTHORITY // CREDENTIAL RESET]
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: '#ffffff', marginBottom: '0.75rem' }}>
              Reset Password for {selectedReq.user.role === 'TPC_ADMIN' ? 'TPC Officer' : 'Student'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              User: <strong>{selectedReq.user.name}</strong> ({selectedReq.user.email})<br />
              College: {selectedReq.user.campus?.name || 'Unassigned'}<br />
              Role: <strong style={{ color: '#ffffff' }}>{selectedReq.user.role}</strong>
            </p>

            <form onSubmit={handleApproveSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  New Password (min 6 chars)
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Enter new password"
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      color: '#ffffff',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.9rem'
                    }}
                  />
                  <button
                    type="button"
                    onClick={generatePassword}
                    style={{
                      padding: '0.75rem 1rem',
                      background: 'var(--bg-card-hover)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    Random
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  disabled={loading}
                  style={{
                    padding: '0.75rem 1.25rem',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#ffffff',
                    border: '1px solid #ffffff',
                    color: '#08090b',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    cursor: 'pointer'
                  }}
                >
                  {loading ? 'Updating...' : 'Set Password & Resolve →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolved History Section */}
      <div className={styles.section} style={{ marginTop: '3.5rem' }}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            Resolved Password Requests Archive
          </h2>
        </div>

        {resolved.length === 0 ? (
          <div style={{ padding: '2rem 0', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
            No resolved password reset requests in system history yet.
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User / Account</th>
                <th>Role</th>
                <th>Resolution Status</th>
                <th>Handled By</th>
                <th>Resolved At</th>
              </tr>
            </thead>
            <tbody>
              {resolved.map((req) => (
                <tr key={req.id}>
                  <td className={styles.primaryCol}>
                    <div style={{ fontWeight: 600, color: '#ffffff' }}>{req.user.name}</div>
                    <div className={styles.subText}>{req.user.email} • {req.user.campus?.name || 'College'}</div>
                  </td>
                  <td>
                    <span style={{
                      padding: '0.15rem 0.45rem',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.68rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-secondary)'
                    }}>
                      {req.user.role}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      padding: '0.2rem 0.55rem',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      background: req.status === 'APPROVED' ? 'rgba(52, 211, 153, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                      border: `1px solid ${req.status === 'APPROVED' ? 'rgba(52, 211, 153, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                      color: req.status === 'APPROVED' ? '#34d399' : '#ef4444'
                    }}>
                      {req.status === 'APPROVED' ? '✓ APPROVED & RESET' : '✕ DECLINED'}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {req.resolvedBy ? `${req.resolvedBy.name} (${req.resolvedBy.role})` : 'Administrator'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {req.resolvedAt ? new Date(req.resolvedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
