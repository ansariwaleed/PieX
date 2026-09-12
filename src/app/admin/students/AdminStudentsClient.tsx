'use client'

import { useState } from 'react'
import styles from '../admin.module.css'

interface StudentItem {
  id: string
  name: string
  email: string
  rollNumber: string | null
  branch: string | null
  graduationYear: number | null
  verificationStatus: string
  campus?: { name: string } | null
  experiences: { id: string; verificationStatus: string }[]
}

export default function AdminStudentsClient({ initialStudents }: { initialStudents: StudentItem[] }) {
  const [students, setStudents] = useState<StudentItem[]>(initialStudents)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [resetModalStudent, setResetModalStudent] = useState<StudentItem | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [updatingPassword, setUpdatingPassword] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const handleDelete = async (id: string, name: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete student "${name}"? This will permanently remove their account and all their placement experience submissions.`
    )
    if (!confirmed) return

    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/students/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setStudents(prev => prev.filter(s => s.id !== id))
        setNotice(`✓ Student "${name}" has been permanently deleted.`)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete student.')
      }
    } catch (err) {
      alert('Network error while deleting student.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleOpenResetModal = (student: StudentItem) => {
    setResetModalStudent(student)
    const roll = student.rollNumber ? student.rollNumber.replace(/[^a-zA-Z0-9]/g, '') : 'Student'
    setNewPassword(`${roll}@2026`)
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetModalStudent) return

    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters.")
      return
    }

    setUpdatingPassword(true)
    try {
      const res = await fetch(`/api/admin/students/${resetModalStudent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      })

      const data = await res.json()
      if (res.ok) {
        setNotice(`✓ Password updated successfully for ${resetModalStudent.name} (${resetModalStudent.email}). New password: ${newPassword}`)
        setResetModalStudent(null)
      } else {
        alert(data.error || 'Failed to update student password.')
      }
    } catch (err) {
      alert('Network error while updating password.')
    } finally {
      setUpdatingPassword(false)
    }
  }

  return (
    <>
      <div className={styles.sectionHeader}>
        <div>
          <h1 className={styles.pageTitle}>Campus Placement Roster</h1>
          <p className={styles.pageSubtitle}>
            Registered candidates, verification status, and student credentials ({students.length} students)
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

      {students.length === 0 ? (
        <div style={{ padding: '3rem 0', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
          No registered students found for this college roster.
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Roll No.</th>
              <th>Branch</th>
              <th>Campus</th>
              <th>Graduation</th>
              <th>Submissions</th>
              <th>Roster Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td className={styles.studentName}>
                  <div>{student.name}</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{student.email}</span>
                </td>
                <td>{student.rollNumber || 'N/A'}</td>
                <td>{student.branch || 'B.Tech CSE'}</td>
                <td>{student.campus?.name || 'Campus'}</td>
                <td>{student.graduationYear || 2026}</td>
                <td>{student.experiences.length}</td>
                <td>
                  <span className={`badge ${student.verificationStatus === 'VERIFIED' ? 'badge-verified' : 'badge-pending'}`}>
                    {student.verificationStatus === 'VERIFIED' ? '✓ ROSTER CONFIRMED' : '◇ PENDING MATCH'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleOpenResetModal(student)}
                      style={{
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.7rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-strong)',
                        color: '#ffffff',
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer'
                      }}
                      title="Set new password for this student"
                    >
                      Set Password
                    </button>
                    <button
                      onClick={() => handleDelete(student.id, student.name)}
                      disabled={deletingId === student.id}
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
                      {deletingId === student.id ? 'Deleting...' : '✕ Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Password Reset Modal */}
      {resetModalStudent && (
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
              [TPC ROSTER // DIRECT CREDENTIAL UPDATE]
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: '#ffffff', marginBottom: '0.5rem' }}>
              Set Student Password
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Student: <strong>{resetModalStudent.name}</strong> ({resetModalStudent.email})<br />
              Roll Number: <span style={{ fontFamily: 'var(--font-mono)' }}>{resetModalStudent.rollNumber || 'N/A'}</span>
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
                  onClick={() => setResetModalStudent(null)}
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
    </>
  )
}
