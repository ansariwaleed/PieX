'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from '../super-admin.module.css'

interface Officer {
  id: string
  name: string
  email: string
  role: string
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED'
  campus?: {
    id: string
    name: string
    location: string
    status: string
    drives?: {
      id: string
      experiences: { id: string }[]
    }[]
  } | null
}

export default function TpcManagementClient({ initialOfficers }: { initialOfficers: Officer[] }) {
  const [officers, setOfficers] = useState<Officer[]>(initialOfficers)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [resetOfficer, setResetOfficer] = useState<Officer | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [updatingPassword, setUpdatingPassword] = useState(false)
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string; password?: string } | null>(null)

  const pendingRequests = officers.filter(o => o.verificationStatus === 'PENDING')
  const verifiedOfficers = officers.filter(o => o.verificationStatus === 'VERIFIED')
  const rejectedOfficers = officers.filter(o => o.verificationStatus === 'REJECTED')

  const handleAction = async (userId: string, action: 'APPROVE' | 'REJECT') => {
    setProcessingId(userId)
    setActionMessage(null)

    try {
      const res = await fetch('/api/super-admin/tpc', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      })

      const data = await res.json()

      if (!res.ok) {
        setActionMessage({ type: 'error', text: data.error || 'Failed to update request' })
      } else {
        const newStatus = action === 'APPROVE' ? 'VERIFIED' : 'REJECTED'
        setOfficers(prev => prev.map(o => o.id === userId ? { ...o, verificationStatus: newStatus } : o))
        setActionMessage({
          type: 'success',
          text: action === 'APPROVE'
            ? `✓ ACCEPTED // TPC Officer for "${data.user?.campus?.name || 'college'}" is now verified and active.`
            : `✕ REJECTED // Registration request declined.`
        })
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Network or server error while updating request' })
    } finally {
      setProcessingId(null)
    }
  }

  const handleOpenReset = (officer: Officer) => {
    setResetOfficer(officer)
    setNewPassword('Admin@2026')
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetOfficer) return

    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters.")
      return
    }

    setUpdatingPassword(true)
    try {
      const res = await fetch('/api/super-admin/tpc', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: resetOfficer.id,
          action: 'UPDATE_PASSWORD',
          newPassword
        })
      })

      const data = await res.json()
      if (res.ok) {
        setActionMessage({
          type: 'success',
          text: `✓ Password updated successfully for TPC Officer ${resetOfficer.name} (${resetOfficer.email}).`,
          password: newPassword
        })
        setResetOfficer(null)
      } else {
        alert(data.error || 'Failed to update password')
      }
    } catch (err) {
      alert('Network error while updating password.')
    } finally {
      setUpdatingPassword(false)
    }
  }

  return (
    <>
      <div className={styles.pageHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className={styles.kicker}>ACCESS CONTROL & VERIFICATION</div>
          <h1 className={styles.pageTitle}>Training & Placement Cell (TPC) Roster</h1>
          <p className={styles.pageSubtitle}>
            Review and accept college placement coordinator applications, and manage verified college cells across institutions.
          </p>
        </div>
        <Link href="/register?role=tpc" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
          + New TPC Registration →
        </Link>
      </div>

      {actionMessage && (
        <div style={{
          padding: '0.875rem 1.25rem',
          marginBottom: '1.75rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          letterSpacing: '0.04em',
          backgroundColor: actionMessage.type === 'success' ? 'rgba(52, 211, 153, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          border: `1px solid ${actionMessage.type === 'success' ? 'rgba(52, 211, 153, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
          color: actionMessage.type === 'success' ? '#34d399' : '#ef4444'
        }}>
          <div>{actionMessage.text}</div>
          {actionMessage.password && (
            <div style={{
              marginTop: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <span>TEMPORARY PASSWORD: <strong>{actionMessage.password}</strong></span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(actionMessage.password!)
                  alert('Password copied!')
                }}
                style={{
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.68rem',
                  background: '#34d399',
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

      {/* Pending TPC Registration Requests Section */}
      <div className={styles.section} style={{ marginBottom: '3rem' }}>
        <div className={styles.sectionHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
              Pending TPC Registration Requests
            </h2>
            <span style={{
              display: 'inline-block',
              padding: '0.2rem 0.55rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              fontWeight: 700,
              background: pendingRequests.length > 0 ? 'rgba(234, 179, 8, 0.2)' : 'var(--bg-secondary)',
              border: pendingRequests.length > 0 ? '1px solid rgba(234, 179, 8, 0.5)' : '1px solid var(--border)',
              color: pendingRequests.length > 0 ? '#eab308' : 'var(--text-muted)'
            }}>
              {pendingRequests.length} QUEUED
            </span>
          </div>
        </div>

        {pendingRequests.length === 0 ? (
          <div style={{
            padding: '2.5rem',
            textAlign: 'center',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-strong)',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            letterSpacing: '0.06em'
          }}>
            ✓ ALL TPC REQUESTS PROCESSED // No pending college registration requests in queue.
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Coordinator / Contact</th>
                <th>Requested College</th>
                <th>Official Email</th>
                <th>Current Status</th>
                <th style={{ textAlign: 'right' }}>Review Decision</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.map((officer) => (
                <tr key={officer.id} style={{ background: 'rgba(234, 179, 8, 0.03)' }}>
                  <td className={styles.primaryCol}>
                    <div style={{ fontWeight: 600, color: '#ffffff' }}>{officer.name}</div>
                    <div className={styles.subText}>ID: {officer.id.slice(0, 8)}...</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#f3f4f6' }}>
                      {officer.campus?.name || 'Unassigned College'}
                    </div>
                    <div className={styles.subText}>{officer.campus?.location || 'Campus'}</div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                    {officer.email}
                  </td>
                  <td>
                    <span className={styles.badgePending}>
                      ◇ AWAITING ACCEPTANCE
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleAction(officer.id, 'APPROVE')}
                        disabled={processingId === officer.id}
                        style={{
                          padding: '0.45rem 0.85rem',
                          background: '#ffffff',
                          color: '#08090b',
                          border: '1px solid #ffffff',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {processingId === officer.id ? 'Processing...' : '✓ Accept Request'}
                      </button>
                      <button
                        onClick={() => handleAction(officer.id, 'REJECT')}
                        disabled={processingId === officer.id}
                        style={{
                          padding: '0.45rem 0.85rem',
                          background: 'transparent',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
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

      {/* Active & Verified TPC Officers Section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
              Verified & Active TPC Officers
            </h2>
            <span style={{
              display: 'inline-block',
              padding: '0.2rem 0.55rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              fontWeight: 700,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)'
            }}>
              {verifiedOfficers.length} ACTIVE
            </span>
          </div>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Officer / Coordinator</th>
              <th>College / Campus</th>
              <th>Official Email</th>
              <th>Campus Drives</th>
              <th>Account Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {verifiedOfficers.map((officer) => {
              const drivesCount = officer.campus?.drives?.length || 0

              return (
                <tr key={officer.id}>
                  <td className={styles.primaryCol}>
                    <div style={{ fontWeight: 600, color: '#ffffff' }}>{officer.name}</div>
                    <div className={styles.subText}>ID: {officer.id.slice(0, 8)}...</div>
                  </td>
                  <td>{officer.campus?.name || 'Unassigned'}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{officer.email}</td>
                  <td>{drivesCount} Drives</td>
                  <td>
                    <span className={styles.badgeVerified}>
                      ✓ ACTIVE OFFICER
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => handleOpenReset(officer)}
                      style={{
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.7rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-strong)',
                        color: '#ffffff',
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer'
                      }}
                      title="Set new password for this TPC Officer"
                    >
                      Set Password
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal to Set TPC Officer Password */}
      {resetOfficer && (
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
            maxWidth: '460px',
            width: '100%',
            padding: '2.25rem'
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
              [SUPER ADMIN // TPC CREDENTIAL OVERRIDE]
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: '#ffffff', marginBottom: '0.5rem' }}>
              Set TPC Officer Password
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Officer: <strong>{resetOfficer.name}</strong> ({resetOfficer.email})<br />
              College: {resetOfficer.campus?.name || 'Unassigned'}
            </p>

            <form onSubmit={handleUpdatePassword}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  New Password (min 6 characters)
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
                    onClick={() => {
                      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$'
                      let result = ''
                      for (let i = 0; i < 10; i++) {
                        result += chars.charAt(Math.floor(Math.random() * chars.length))
                      }
                      setNewPassword(result)
                    }}
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
                  onClick={() => setResetOfficer(null)}
                  disabled={updatingPassword}
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
                  disabled={updatingPassword}
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
                  {updatingPassword ? 'Saving...' : 'Update Password →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejected Requests (if any) */}
      {rejectedOfficers.length > 0 && (
        <div className={styles.section} style={{ marginTop: '3rem', opacity: 0.85 }}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
              Declined Registration Requests ({rejectedOfficers.length})
            </h2>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Officer / Coordinator</th>
                <th>College</th>
                <th>Official Email</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rejectedOfficers.map(officer => (
                <tr key={officer.id}>
                  <td className={styles.primaryCol}>{officer.name}</td>
                  <td>{officer.campus?.name || 'Unassigned'}</td>
                  <td>{officer.email}</td>
                  <td>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.68rem',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#ef4444'
                    }}>
                      ✕ REJECTED
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => handleAction(officer.id, 'APPROVE')}
                      disabled={processingId === officer.id}
                      style={{
                        padding: '0.35rem 0.7rem',
                        background: 'transparent',
                        color: '#ffffff',
                        border: '1px solid var(--border-strong)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.7rem',
                        cursor: 'pointer'
                      }}
                    >
                      Re-Approve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
