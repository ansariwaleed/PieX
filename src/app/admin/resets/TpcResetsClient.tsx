'use client'

import { useState } from 'react'
import styles from '../admin.module.css'

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
    rollNumber: string | null
    branch: string | null
    campus?: { name: string } | null
  }
  resolvedBy?: {
    name: string
    email: string
    role: string
  } | null
}

export default function TpcResetsClient({
  campusName,
  initialPending,
  initialResolved
}: {
  campusName: string
  initialPending: ResetItem[]
  initialResolved: ResetItem[]
}) {
  const [pending, setPending] = useState<ResetItem[]>(initialPending)
  const [resolved, setResolved] = useState<ResetItem[]>(initialResolved)
  const [selectedReq, setSelectedReq] = useState<ResetItem | null>(null)
  const [tempPassword, setTempPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [declineTarget, setDeclineTarget] = useState<ResetItem | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string; password?: string } | null>(null)

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
    // Generate a default memorable password
    const roll = req.user.rollNumber ? req.user.rollNumber.replace(/[^a-zA-Z0-9]/g, '') : 'Student'
    setTempPassword(`${roll}@2026`)
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
          resolvedBy: { name: 'You (TPC)', email: '', role: 'TPC_ADMIN' }
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
    } catch {
      alert('Network error while resolving request.')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = (req: ResetItem) => {
    setDeclineTarget(req)
  }

  const handleConfirmReject = async () => {
    if (!declineTarget) return

    setLoading(true)
    try {
      const res = await fetch(`/api/password-reset-requests/${declineTarget.id}`, {
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
          ...declineTarget,
          status: 'REJECTED',
          resolvedAt: new Date().toISOString(),
          resolvedBy: { name: 'You (TPC)', email: '', role: 'TPC_ADMIN' }
        }
        setPending(prev => prev.filter(r => r.id !== declineTarget.id))
        setResolved(prev => [rejectedItem, ...prev])
        setNotice({
          type: 'success',
          text: `Password reset request rejected for ${declineTarget.user.name}.`
        })
        setDeclineTarget(null)
      }
    } catch {
      alert('Network error while rejecting request.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className={styles.sectionHeader}>
        <div>
          <h1 className={styles.pageTitle}>Student Password Reset Requests</h1>
          <p className={styles.pageSubtitle}>
            Official Training & Placement Cell password authority // {campusName}
          </p>
        </div>
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
                TEMPORARY PASSWORD TO COMMUNICATE:
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

      {/* Info notice explaining dual authority */}
      <div style={{
        padding: '1rem 1.25rem',
        marginBottom: '2.5rem',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem'
      }}>
        <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>ℹ</span>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Students of <strong>{campusName}</strong> who forgot their password can submit requests via the platform reset form.
          When you approve a student's request and set their temporary password, it is resolved instantly and removed from both your queue and the Super Admin queue.
        </div>
      </div>

      {/* Pending Requests Section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
              Pending Requests ({pending.length})
            </h2>
            {pending.length > 0 && (
              <span className={styles.statusPending}>
                Action Required
              </span>
            )}
          </div>
        </div>

        {pending.length === 0 ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem'
          }}>
            ✓ NO PENDING RESET REQUESTS // All student requests for this campus have been processed.
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Student Candidate</th>
                <th>Roll Number</th>
                <th>Branch</th>
                <th>Requested At</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((req) => (
                <tr key={req.id}>
                  <td className={styles.studentName}>
                    <div>{req.user.name}</div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {req.user.email}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                    {req.user.rollNumber || 'N/A'}
                  </td>
                  <td>{req.user.branch || 'B.Tech CSE'}</td>
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
                        className={styles.actionBtn}
                        style={{ cursor: 'pointer' }}
                      >
                        Reset Password →
                      </button>
                      <button
                        onClick={() => handleReject(req)}
                        style={{
                          padding: '0.4rem 0.75rem',
                          background: 'transparent',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          color: '#ef4444',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.72rem',
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

      {/* Modal for setting new password */}
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
              [TPC AUTHORIZATION // SET PASSWORD]
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: '#ffffff', marginBottom: '0.75rem' }}>
              Reset Student Password
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Candidate: <strong>{selectedReq.user.name}</strong> ({selectedReq.user.email})<br />
              Roll Number: <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedReq.user.rollNumber || 'N/A'}</span>
            </p>

            <form onSubmit={handleApproveSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  New Temporary Password (min 6 chars)
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
                  {loading ? 'Updating...' : 'Confirm & Set Password →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decline Password Reset Confirmation Modal */}
      {declineTarget && (
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
            border: '1px solid rgba(239, 68, 68, 0.5)',
            maxWidth: '480px',
            width: '100%',
            padding: '2.25rem'
          }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: '#ef4444',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '0.5rem'
            }}>
              [DECLINE PASSWORD RESET REQUEST]
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: '#ffffff', marginBottom: '0.75rem' }}>
              Decline reset request?
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              Are you sure you want to decline the password reset request for <strong style={{ color: '#ffffff' }}>{declineTarget.user.name}</strong> ({declineTarget.user.email})?
            </p>
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              borderLeft: '2px solid #ef4444',
              padding: '0.875rem 1rem',
              marginBottom: '1.5rem',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6
            }}>
              The student will not be issued a temporary password, and the request will be moved to the resolved archive as declined.
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setDeclineTarget(null)}
                disabled={loading}
                style={{
                  padding: '0.6rem 1.25rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  background: 'transparent',
                  border: '1px solid var(--border-strong)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={loading}
                style={{
                  padding: '0.6rem 1.25rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  background: '#ef4444',
                  border: '1px solid #ef4444',
                  color: '#ffffff',
                  fontWeight: 700,
                  cursor: loading ? 'wait' : 'pointer'
                }}
              >
                {loading ? 'Declining...' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolved History Section */}
      <div className={styles.section} style={{ marginTop: '3.5rem' }}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            Resolved Requests History
          </h2>
        </div>

        {resolved.length === 0 ? (
          <div style={{ padding: '2rem 0', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
            No resolved password reset requests on record yet.
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Student Candidate</th>
                <th>Roll Number</th>
                <th>Resolution Status</th>
                <th>Handled By</th>
                <th>Resolved At</th>
              </tr>
            </thead>
            <tbody>
              {resolved.map((req) => (
                <tr key={req.id}>
                  <td className={styles.studentName}>
                    <div>{req.user.name}</div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {req.user.email}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                    {req.user.rollNumber || 'N/A'}
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
                    {req.resolvedBy?.name || 'Administrator'}
                    {req.resolvedBy?.role === 'SUPER_ADMIN' && ' (Super Admin)'}
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
