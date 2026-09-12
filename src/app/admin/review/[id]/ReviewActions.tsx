'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './review.module.css'

interface ReviewActionsProps {
  experienceId: string
  currentStatus: string
}

export default function ReviewActions({ experienceId, currentStatus }: ReviewActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [status, setStatus] = useState(currentStatus)
  const [message, setMessage] = useState<string | null>(null)

  const handleAction = async (action: 'verify' | 'reject' | 'unpublish' | 'revert_pending' | 'request_changes') => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/experiences/${experienceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (res.ok) {
        if (action === 'verify') {
          setStatus('VERIFIED')
          setMessage('VERIFIED — Experience published to public archive.')
        } else if (action === 'reject') {
          setStatus('REJECTED')
          setMessage('REJECTED — Submission marked as rejected.')
        } else if (action === 'revert_pending' || action === 'unpublish') {
          setStatus('PENDING')
          setMessage('REVERTED — Experience unpublished and moved back to pending review.')
        } else {
          setMessage('REVISION REQUESTED — Notification sent to student.')
        }
        router.refresh()
      } else {
        const data = await res.json()
        setMessage(data.error || 'Failed to update submission.')
      }
    } catch (err) {
      setMessage('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/admin/experiences/${experienceId}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || 'Failed to delete experience')
        setDeleting(false)
        setShowConfirmDelete(false)
      } else {
        setMessage('✓ Story permanently deleted. Redirecting...')
        setTimeout(() => {
          window.location.href = '/admin/pending'
        }, 500)
      }
    } catch (err) {
      setMessage('Error deleting experience.')
      setDeleting(false)
      setShowConfirmDelete(false)
    }
  }

  return (
    <div className={styles.actionsCard}>
      <div className={styles.actionsTitle}>TPC & Admin Decision</div>

      {/* Current Status Pill */}
      <div style={{ marginBottom: '1.25rem' }}>
        <span style={{
          display: 'inline-block',
          width: '100%',
          textAlign: 'center',
          padding: '0.4rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          background: status === 'VERIFIED'
            ? 'rgba(52, 211, 153, 0.12)'
            : status === 'PENDING'
            ? 'rgba(234, 179, 8, 0.12)'
            : 'rgba(239, 68, 68, 0.12)',
          border: `1px solid ${
            status === 'VERIFIED'
              ? 'rgba(52, 211, 153, 0.4)'
              : status === 'PENDING'
              ? 'rgba(234, 179, 8, 0.4)'
              : 'rgba(239, 68, 68, 0.4)'
          }`,
          color: status === 'VERIFIED' ? '#34d399' : status === 'PENDING' ? '#eab308' : '#ef4444'
        }}>
          {status === 'VERIFIED'
            ? '✓ LIVE & VERIFIED IN ARCHIVE'
            : status === 'PENDING'
            ? '◇ PENDING VERIFICATION'
            : '✕ REJECTED / UNPUBLISHED'}
        </span>
      </div>

      {message && (
        <div style={{
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.04em',
          backgroundColor: status === 'VERIFIED' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)',
          border: `1px solid ${status === 'VERIFIED' ? '#34d399' : '#f87171'}`,
          color: status === 'VERIFIED' ? '#34d399' : '#f87171'
        }}>
          {message}
        </div>
      )}

      <div className={styles.actionsStack}>
        {/* Status Actions */}
        {status !== 'VERIFIED' ? (
          <button
            className={styles.approveBtn}
            disabled={loading || deleting}
            onClick={() => handleAction('verify')}
            id="btn-verify-publish"
          >
            {loading ? 'UPDATING...' : '✓ VERIFY & PUBLISH STORY'}
          </button>
        ) : (
          <button
            type="button"
            className={styles.changesBtn}
            disabled={loading || deleting}
            onClick={() => handleAction('revert_pending')}
            id="btn-revert-pending"
          >
            ◇ REVERT TO PENDING REVIEW
          </button>
        )}

        {status === 'PENDING' && (
          <button
            className={styles.changesBtn}
            disabled={loading || deleting}
            onClick={() => handleAction('request_changes')}
            id="btn-request-changes"
          >
            REQUEST STUDENT REVISION
          </button>
        )}

        {status !== 'REJECTED' && (
          <button
            className={styles.rejectBtn}
            disabled={loading || deleting}
            onClick={() => handleAction('reject')}
            id="btn-reject"
          >
            ✕ REJECT & UNPUBLISH
          </button>
        )}

        {status === 'REJECTED' && (
          <button
            type="button"
            className={styles.approveBtn}
            disabled={loading || deleting}
            onClick={() => handleAction('verify')}
          >
            ✓ RE-APPROVE & PUBLISH
          </button>
        )}

        {/* Edit and Delete Powers */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem', display: 'grid', gap: '0.65rem' }}>
          <Link
            href={`/admin/experiences/${experienceId}/edit`}
            style={{
              display: 'block',
              textAlign: 'center',
              padding: '0.75rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-strong)',
              color: '#ffffff',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              textDecoration: 'none'
            }}
          >
            Edit Story Details →
          </Link>

          {showConfirmDelete ? (
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid #ef4444',
              padding: '0.85rem',
              display: 'grid',
              gap: '0.5rem'
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#ef4444', fontWeight: 700, letterSpacing: '0.04em' }}>
                CONFIRM PERMANENT REMOVAL?
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                This will permanently delete this review and its round debriefs from the archive.
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  id="btn-confirm-delete"
                  style={{
                    flex: 1,
                    padding: '0.55rem',
                    background: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
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
                    flex: 1,
                    padding: '0.55rem',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.72rem',
                    cursor: 'pointer'
                  }}
                >
                  CANCEL
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              disabled={loading || deleting}
              id="btn-delete-review"
              style={{
                padding: '0.75rem',
                background: 'transparent',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#ef4444',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                cursor: 'pointer'
              }}
            >
              ✕ Delete Permanently
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
