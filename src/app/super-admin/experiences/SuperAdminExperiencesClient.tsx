'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from '../super-admin.module.css'

interface ExperienceItem {
  id: string
  submittedAt: string | Date
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED'
  result: string
  student: {
    name: string
    rollNumber: string | null
    email: string
  }
  drive: {
    role: string
    company: { name: string }
    campus: { name: string }
  }
  rounds: { id: string }[]
}

export default function SuperAdminExperiencesClient({ initialExperiences }: { initialExperiences: ExperienceItem[] }) {
  const [experiences, setExperiences] = useState<ExperienceItem[]>(initialExperiences)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [itemToDelete, setItemToDelete] = useState<ExperienceItem | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return
    const id = itemToDelete.id
    const company = itemToDelete.drive.company.name
    const role = itemToDelete.drive.role

    setProcessingId(id)
    try {
      const res = await fetch(`/api/admin/experiences/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setExperiences(prev => prev.filter(e => e.id !== id))
        setNotice(`Experience for ${company} (${role}) permanently deleted.`)
        setItemToDelete(null)
      } else {
        alert('Failed to delete experience.')
      }
    } catch {
      alert('Network error while deleting experience.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleStatusToggle = async (id: string, action: 'verify' | 'revert_pending' | 'reject') => {
    setProcessingId(id)
    try {
      const res = await fetch(`/api/admin/experiences/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      if (res.ok) {
        const nextStatus = action === 'verify' ? 'VERIFIED' : action === 'reject' ? 'REJECTED' : 'PENDING'
        setExperiences(prev => prev.map(e => e.id === id ? { ...e, verificationStatus: nextStatus } : e))
        setNotice(`✓ Status updated to ${nextStatus}.`)
      } else {
        alert('Failed to update status.')
      }
    } catch (err) {
      alert('Network error while updating status.')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <>
      <div className={styles.pageHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className={styles.kicker}>CENTRAL ARCHIVE MANAGEMENT // SUPER ADMIN</div>
          <h1 className={styles.pageTitle}>All Campus Placement Experiences</h1>
          <p className={styles.pageSubtitle}>
            Full authority to review, edit details, adjust publication statuses, or delete stories across all partner universities.
          </p>
        </div>
      </div>

      {notice && (
        <div style={{
          padding: '0.875rem 1.25rem',
          marginBottom: '1.5rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          background: 'rgba(52, 211, 153, 0.1)',
          border: '1px solid rgba(52, 211, 153, 0.4)',
          color: '#34d399'
        }}>
          {notice}
        </div>
      )}

      <div className={styles.section}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Student</th>
              <th>College / Campus</th>
              <th>Company & Role</th>
              <th>Rounds</th>
              <th>Result</th>
              <th>Status</th>
              <th>Submitted</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {experiences.map((item) => (
              <tr key={item.id}>
                <td className={styles.primaryCol}>
                  <div>{item.student.name}</div>
                  <div className={styles.subText}>{item.student.rollNumber || item.student.email}</div>
                </td>
                <td>{item.drive.campus.name}</td>
                <td>
                  <div style={{ fontWeight: 600, color: '#ffffff' }}>{item.drive.company.name}</div>
                  <div className={styles.subText}>{item.drive.role}</div>
                </td>
                <td>{item.rounds.length} rounds</td>
                <td>
                  <span className={`badge ${item.result === 'Selected' ? 'badge-selected' : 'badge-not-selected'}`}>
                    {item.result === 'Selected' ? '✓ SELECTED' : '✕ NOT SELECTED'}
                  </span>
                </td>
                <td>
                  <span className={item.verificationStatus === 'VERIFIED' ? styles.badgeVerified : styles.badgePending}>
                    {item.verificationStatus === 'VERIFIED' ? '✓ VERIFIED' : item.verificationStatus === 'PENDING' ? '◇ PENDING' : '✕ REJECTED'}
                  </span>
                </td>
                <td>{new Date(item.submittedAt).toLocaleDateString()}</td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <Link
                      href={`/admin/review/${item.id}`}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.7rem', textDecoration: 'none' }}
                    >
                      Review
                    </Link>

                    <Link
                      href={`/admin/experiences/${item.id}/edit`}
                      style={{
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.7rem',
                        background: '#ffffff',
                        color: '#08090b',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        textDecoration: 'none'
                      }}
                    >
                      Edit
                    </Link>

                    {item.verificationStatus === 'VERIFIED' ? (
                      <button
                        onClick={() => handleStatusToggle(item.id, 'revert_pending')}
                        disabled={processingId === item.id}
                        style={{
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.7rem',
                          background: 'transparent',
                          border: '1px solid rgba(234, 179, 8, 0.4)',
                          color: '#eab308',
                          fontFamily: 'var(--font-mono)',
                          cursor: 'pointer'
                        }}
                      >
                        Unpublish
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusToggle(item.id, 'verify')}
                        disabled={processingId === item.id}
                        style={{
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.7rem',
                          background: 'transparent',
                          border: '1px solid rgba(52, 211, 153, 0.4)',
                          color: '#34d399',
                          fontFamily: 'var(--font-mono)',
                          cursor: 'pointer'
                        }}
                      >
                        Verify
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setItemToDelete(item)}
                      style={{
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.7rem',
                        background: 'transparent',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#ef4444',
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal for Experience Deletion */}
      {itemToDelete && (
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
            maxWidth: '500px',
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
              [SUPER ADMIN ACTION // PERMANENT DELETION]
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: '#ffffff', marginBottom: '0.75rem' }}>
              Are you sure you want to delete this experience?
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              You are about to permanently delete the placement interview submission for <strong style={{ color: '#ffffff' }}>{itemToDelete.drive.company.name} ({itemToDelete.drive.role})</strong> submitted by {itemToDelete.student.name}.
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
              This will cascade and remove all rounds, questions, and reports associated with this submission across the platform. This action cannot be undone.
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={Boolean(processingId)}
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
                onClick={handleConfirmDelete}
                disabled={Boolean(processingId)}
                style={{
                  padding: '0.6rem 1.25rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  background: '#ef4444',
                  border: '1px solid #ef4444',
                  color: '#ffffff',
                  fontWeight: 700,
                  cursor: processingId ? 'wait' : 'pointer'
                }}
              >
                {processingId ? 'Deleting...' : 'Confirm Permanent Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
