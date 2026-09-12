'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from '../super-admin.module.css'

export interface CampusItem {
  id: string
  name: string
  location: string
  users: { id: string; name: string; role: string; email: string }[]
  drives: {
    id: string
    company: { name: string }
    experiences: { id: string; verificationStatus: string }[]
  }[]
}

export default function SuperAdminCampusesClient({ initialCampuses }: { initialCampuses: CampusItem[] }) {
  const [campuses, setCampuses] = useState<CampusItem[]>(initialCampuses)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [campusToDelete, setCampusToDelete] = useState<CampusItem | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleConfirmDelete = async () => {
    if (!campusToDelete) return
    const id = campusToDelete.id
    const name = campusToDelete.name

    setDeletingId(id)
    try {
      const res = await fetch(`/api/super-admin/campuses/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setCampuses(prev => prev.filter(c => c.id !== id))
        setNotice({ type: 'success', text: `Campus "${name}" and all related placement records were permanently deleted.` })
        setCampusToDelete(null)
      } else {
        const data = await res.json()
        setNotice({ type: 'error', text: data.error || 'Failed to delete campus.' })
      }
    } catch {
      setNotice({ type: 'error', text: 'Network error while deleting campus.' })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <div className={styles.pageHeader}>
        <div className={styles.kicker}>INSTITUTIONAL DIRECTORY</div>
        <h1 className={styles.pageTitle}>Colleges & Partner Campuses</h1>
        <p className={styles.pageSubtitle}>
          Institutions participating in the verified placement archive with official Training & Placement Cells. Click any college to view its dedicated TPC dashboard or manage records.
        </p>
      </div>

      {notice && (
        <div style={{
          padding: '0.875rem 1.25rem',
          marginBottom: '1.5rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          background: notice.type === 'success' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${notice.type === 'success' ? 'rgba(52, 211, 153, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
          color: notice.type === 'success' ? '#34d399' : '#ef4444'
        }}>
          <div>{notice.text}</div>
        </div>
      )}

      <div className={styles.section}>
        {campuses.length === 0 ? (
          <div style={{ padding: '3rem 0', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
            No registered campuses found in the platform.
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>College / Campus</th>
                <th>Location</th>
                <th>TPC Coordinators</th>
                <th>Enrolled Students</th>
                <th>Placement Drives</th>
                <th>Total Experiences</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {campuses.map((c) => {
                const officers = c.users.filter(u => u.role === 'TPC_ADMIN')
                const students = c.users.filter(u => u.role === 'STUDENT')
                const totalExp = c.drives.reduce((acc, d) => acc + d.experiences.length, 0)
                const verifiedExp = c.drives.reduce((acc, d) => acc + d.experiences.filter(e => e.verificationStatus === 'VERIFIED').length, 0)

                return (
                  <tr key={c.id}>
                    <td className={styles.primaryCol}>
                      <Link
                        href={`/admin?campusId=${c.id}`}
                        style={{ color: '#ffffff', fontWeight: 600, textDecoration: 'none' }}
                        title="Click to view TPC Dashboard for this college"
                      >
                        {c.name}
                      </Link>
                      <div className={styles.subText}>ID: {c.id.slice(0, 8)}...</div>
                    </td>
                    <td>{c.location}</td>
                    <td>
                      {officers.map(o => (
                        <div key={o.id} style={{ fontSize: '0.8rem' }}>
                          {o.name} <span style={{ color: 'var(--text-muted)' }}>({o.email})</span>
                        </div>
                      ))}
                      {officers.length === 0 && <span style={{ color: 'var(--text-muted)' }}>No officer assigned</span>}
                    </td>
                    <td>{students.length} Students</td>
                    <td>{c.drives.length} Drives</td>
                    <td>
                      {totalExp} ({verifiedExp} verified)
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <Link
                          href={`/admin?campusId=${c.id}`}
                          style={{
                            display: 'inline-block',
                            padding: '0.35rem 0.65rem',
                            background: '#ffffff',
                            color: '#08090b',
                            border: '1px solid #ffffff',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            textDecoration: 'none',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          TPC Console
                        </Link>
                        <button
                          type="button"
                          onClick={() => setCampusToDelete(c)}
                          style={{
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.7rem',
                            background: 'transparent',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            color: '#ef4444',
                            fontFamily: 'var(--font-mono)',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                          title="Delete campus and associated records"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* In-app Confirmation Modal for Deleting Campus */}
      {campusToDelete && (
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
              Are you sure you want to delete this campus?
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              You are about to permanently remove <strong style={{ color: '#ffffff' }}>{campusToDelete.name}</strong> ({campusToDelete.location}).
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
              This will cascade and permanently delete all associated placement drives, interview experiences, round questions, and TPC coordinator credentials. This action cannot be reversed.
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setCampusToDelete(null)}
                disabled={Boolean(deletingId)}
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
                disabled={Boolean(deletingId)}
                style={{
                  padding: '0.6rem 1.25rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  background: '#ef4444',
                  border: '1px solid #ef4444',
                  color: '#ffffff',
                  fontWeight: 700,
                  cursor: deletingId ? 'wait' : 'pointer'
                }}
              >
                {deletingId ? 'Deleting Campus...' : 'Confirm Permanent Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
