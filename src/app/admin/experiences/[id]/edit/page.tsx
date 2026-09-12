'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './edit.module.css'

interface Round {
  id?: string
  roundNumber: number
  type: string
  durationMinutes: number
  difficulty: number
  description: string
  topics: string[]
}

interface ExperienceData {
  id: string
  result: string
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED'
  isAnonymous: boolean
  drive: {
    role: string
    year: number
    company: { name: string }
    campus: { name: string }
  }
  student: {
    name: string
    email: string
    rollNumber: string | null
    branch: string | null
  }
  rounds: Round[]
}

export default function EditExperiencePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    companyName: '',
    role: '',
    result: 'Selected',
    verificationStatus: 'VERIFIED',
    isAnonymous: true,
    rounds: [] as Round[]
  })

  const [expInfo, setExpInfo] = useState<ExperienceData | null>(null)

  useEffect(() => {
    fetch(`/api/admin/experiences/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load experience')
        return res.json()
      })
      .then((data: ExperienceData) => {
        setExpInfo(data)
        setFormData({
          companyName: data.drive.company.name,
          role: data.drive.role,
          result: data.result,
          verificationStatus: data.verificationStatus,
          isAnonymous: data.isAnonymous,
          rounds: data.rounds.length > 0 ? data.rounds : [
            {
              roundNumber: 1,
              type: 'Technical Interview',
              durationMinutes: 45,
              difficulty: 3,
              description: '',
              topics: ['DSA', 'Problem Solving']
            }
          ]
        })
        setLoading(false)
      })
      .catch(err => {
        setError(err.message || 'Error loading experience data')
        setLoading(false)
      })
  }, [id])

  const handleRoundChange = (index: number, field: keyof Round, value: any) => {
    const updated = [...formData.rounds]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, rounds: updated })
  }

  const handleAddRound = () => {
    setFormData({
      ...formData,
      rounds: [
        ...formData.rounds,
        {
          roundNumber: formData.rounds.length + 1,
          type: 'Technical Round',
          durationMinutes: 45,
          difficulty: 3,
          description: '',
          topics: ['Problem Solving']
        }
      ]
    })
  }

  const handleRemoveRound = (index: number) => {
    if (formData.rounds.length <= 1) {
      alert('At least one round is required')
      return
    }
    const updated = formData.rounds.filter((_, i) => i !== index)
      .map((r, i) => ({ ...r, roundNumber: i + 1 }))
    setFormData({ ...formData, rounds: updated })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`/api/admin/experiences/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to update experience')
      } else {
        setSuccess('✓ Experience updated successfully.')
        setTimeout(() => {
          router.push(`/admin/review/${id}`)
        }, 1200)
      }
    } catch (err) {
      setError('An error occurred while saving changes.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)

    try {
      const targetId = expInfo?.id || id
      const res = await fetch(`/api/admin/experiences/${targetId}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to delete experience')
        setDeleting(false)
        setShowConfirmDelete(false)
      } else {
        setSuccess('✓ Story deleted permanently. Redirecting...')
        setTimeout(() => {
          window.location.href = '/admin/pending'
        }, 500)
      }
    } catch (err) {
      setError('An error occurred while deleting the experience.')
      setDeleting(false)
      setShowConfirmDelete(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '3rem 0', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
        Loading experience details...
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <div>
          <Link href={`/admin/review/${id}`} className={styles.backLink}>
            ← Back to Review / Experience
          </Link>
          <div className={styles.kicker}>ARCHIVE MANAGEMENT // TPC & SUPER ADMIN CONSOLE</div>
          <h1 className={styles.pageTitle}>Edit Placement Story</h1>
          <p className={styles.subtitle}>
            Modify role, interview rounds, evaluation difficulty, or publication status for candidate submission.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className={styles.deleteTopBtn}
        >
          {deleting ? 'Deleting...' : '✕ Delete Permanently'}
        </button>
      </div>

      {error && <div className={styles.alertError}>{error}</div>}
      {success && <div className={styles.alertSuccess}>{success}</div>}

      <form onSubmit={handleSave}>
        {/* Student & Campus Context */}
        {expInfo && (
          <div className={styles.contextBox}>
            <div className={styles.contextItem}>
              <div className={styles.contextLabel}>Candidate Name</div>
              <div className={styles.contextValue}>{expInfo.student.name}</div>
            </div>
            <div className={styles.contextItem}>
              <div className={styles.contextLabel}>Roll Number</div>
              <div className={styles.contextValue}>{expInfo.student.rollNumber || 'N/A'}</div>
            </div>
            <div className={styles.contextItem}>
              <div className={styles.contextLabel}>College / Campus</div>
              <div className={styles.contextValue}>{expInfo.drive.campus.name}</div>
            </div>
            <div className={styles.contextItem}>
              <div className={styles.contextLabel}>Placement Drive</div>
              <div className={styles.contextValue}>{expInfo.drive.year} Season</div>
            </div>
          </div>
        )}

        {/* Primary Placement Details */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Core Placement Details</h2>
          <div className={styles.grid2}>
            <div className="form-group">
              <label className="label">Company Name</label>
              <input
                type="text"
                required
                className="input"
                value={formData.companyName}
                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="label">Job Role / Position</label>
              <input
                type="text"
                required
                className="input"
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.grid2}>
            <div className="form-group">
              <label className="label">Final Result</label>
              <select
                className="select"
                value={formData.result}
                onChange={e => setFormData({ ...formData, result: e.target.value })}
              >
                <option value="Selected">Selected</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Archive Publication Status</label>
              <select
                className="select"
                value={formData.verificationStatus}
                onChange={e => setFormData({ ...formData, verificationStatus: e.target.value as any })}
              >
                <option value="VERIFIED">VERIFIED (Live in Public Archive)</option>
                <option value="PENDING">PENDING (Awaiting Verification / Unpublished)</option>
                <option value="REJECTED">REJECTED (Declined / Hidden)</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={formData.isAnonymous}
                onChange={e => setFormData({ ...formData, isAnonymous: e.target.checked })}
              />
              Publish anonymously to students (Student name hidden on public read view)
            </label>
          </div>
        </div>

        {/* Interview Rounds */}
        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className={styles.cardTitle} style={{ margin: 0 }}>
              Interview Rounds ({formData.rounds.length})
            </h2>
            <button
              type="button"
              onClick={handleAddRound}
              className={styles.addRoundBtn}
            >
              + Add Another Round
            </button>
          </div>

          {formData.rounds.map((round, index) => (
            <div key={index} className={styles.roundBox}>
              <div className={styles.roundBoxHeader}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)' }}>
                  ROUND {index + 1}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveRound(index)}
                  className={styles.removeRoundBtn}
                >
                  ✕ Remove Round
                </button>
              </div>

              <div className={styles.grid3}>
                <div className="form-group">
                  <label className="label">Round Type</label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={round.type}
                    onChange={e => handleRoundChange(index, 'type', e.target.value)}
                    placeholder="e.g. Technical Interview"
                  />
                </div>
                <div className="form-group">
                  <label className="label">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={round.durationMinutes}
                    onChange={e => handleRoundChange(index, 'durationMinutes', parseInt(e.target.value) || 45)}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Difficulty (1 - 5)</label>
                  <select
                    className="select"
                    value={round.difficulty}
                    onChange={e => handleRoundChange(index, 'difficulty', parseInt(e.target.value) || 3)}
                  >
                    <option value="1">1 (Easy)</option>
                    <option value="2">2 (Moderate-Easy)</option>
                    <option value="3">3 (Medium)</option>
                    <option value="4">4 (Challenging)</option>
                    <option value="5">5 (Very Difficult)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="label">Topics Covered (comma separated)</label>
                <input
                  type="text"
                  className="input"
                  value={round.topics.join(', ')}
                  onChange={e => handleRoundChange(
                    index,
                    'topics',
                    e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                  )}
                  placeholder="DSA, System Design, SQL, OOP..."
                />
              </div>

              <div className="form-group">
                <label className="label">Round Breakdown & Questions Asked</label>
                <textarea
                  rows={6}
                  required
                  className="input"
                  style={{
                    minHeight: '140px',
                    width: '100%',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                    padding: '0.875rem 1rem',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.9375rem',
                    lineHeight: '1.6',
                    resize: 'vertical'
                  }}
                  value={round.description}
                  onChange={e => handleRoundChange(index, 'description', e.target.value)}
                  placeholder="Describe the questions asked, interview atmosphere, and candidate performance..."
                />
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className={styles.actionsBar}>
          <button type="submit" disabled={saving || deleting} className={styles.saveBtn}>
            {saving ? 'Saving Updates...' : '✓ Save Changes to Story →'}
          </button>
          <Link href={`/admin/review/${id}`} className={styles.cancelBtn}>
            Cancel
          </Link>

          {showConfirmDelete ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginLeft: 'auto',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid #ef4444',
              padding: '0.5rem 1rem'
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#ef4444', fontWeight: 700 }}>
                PERMANENTLY DELETE?
              </span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                id="btn-confirm-delete-edit"
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.45rem 0.85rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {deleting ? 'DELETING...' : 'YES, DELETE'}
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                disabled={deleting}
                style={{
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  padding: '0.45rem 0.85rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  cursor: 'pointer'
                }}
              >
                CANCEL
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              disabled={deleting}
              className={styles.deleteBottomBtn}
              id="btn-delete-story-edit"
            >
              ✕ Delete Story
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
