'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from './admin.module.css'

interface VerifiedItem {
  id: string
  publishedAt: string | Date | null
  drive: {
    role: string
    company: { name: string }
    campus: { name: string }
  }
}

export default function VerifiedArchivesList({ initialItems }: { initialItems: VerifiedItem[] }) {
  const [items, setItems] = useState<VerifiedItem[]>(initialItems)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [itemToDelete, setItemToDelete] = useState<VerifiedItem | null>(null)
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
        setItems(prev => prev.filter(item => item.id !== id))
        setNotice(`Deleted placement story for ${company} (${role}).`)
        setItemToDelete(null)
      } else {
        alert('Failed to delete story.')
      }
    } catch {
      alert('Network error while deleting story.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRevert = async (id: string, company: string, role: string) => {
    setProcessingId(id)
    try {
      const res = await fetch(`/api/admin/experiences/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revert_pending' })
      })
      if (res.ok) {
        setItems(prev => prev.filter(item => item.id !== id))
        setNotice(`◇ Reverted ${company} (${role}) back to Pending Reviews queue.`)
      } else {
        alert('Failed to revert status.')
      }
    } catch (err) {
      alert('Network error while updating status.')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div>
      {notice && (
        <div style={{
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          background: 'rgba(52, 211, 153, 0.1)',
          border: '1px solid rgba(52, 211, 153, 0.4)',
          color: '#34d399'
        }}>
          {notice}
        </div>
      )}

      {items.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', padding: '1rem 0', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
          No recently verified archives.
        </p>
      ) : (
        <div className={styles.activityList}>
          {items.map((item) => (
            <div
              className={styles.activityItem}
              key={item.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1, minWidth: '260px' }}>
                <span className={styles.activityIcon}>[VERIFIED]</span>
                <div>
                  <div className={styles.activityText}>
                    <strong>{item.drive.company.name} — {item.drive.role}</strong>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.15rem' }}>
                      {item.drive.campus.name} · Verified & live in public archive
                    </div>
                  </div>
                  <div className={styles.activityTime}>
                    {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : 'Recently'}
                  </div>
                </div>
              </div>

              {/* Action buttons on verified archives */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Link
                  href={`/admin/review/${item.id}`}
                  style={{
                    padding: '0.4rem 0.75rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-strong)',
                    color: '#ffffff',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    textDecoration: 'none'
                  }}
                >
                  Review
                </Link>

                <Link
                  href={`/admin/experiences/${item.id}/edit`}
                  style={{
                    padding: '0.4rem 0.75rem',
                    background: '#ffffff',
                    color: '#08090b',
                    border: '1px solid #ffffff',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    textDecoration: 'none'
                  }}
                >
                  Edit
                </Link>

                <button
                  type="button"
                  onClick={() => handleRevert(item.id, item.drive.company.name, item.drive.role)}
                  disabled={processingId === item.id}
                  style={{
                    padding: '0.4rem 0.75rem',
                    background: 'transparent',
                    border: '1px solid rgba(234, 179, 8, 0.4)',
                    color: '#eab308',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em'
                  }}
                >
                  Unpublish
                </button>

                <button
                  type="button"
                  onClick={() => setItemToDelete(item)}
                  style={{
                    padding: '0.4rem 0.75rem',
                    background: 'transparent',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#ef4444',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* In-app Confirmation Modal for Verified Experience Deletion */}
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
              [TPC ADMIN ACTION // PERMANENT DELETION]
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: '#ffffff', marginBottom: '0.75rem' }}>
              Are you sure you want to delete this story?
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              You are about to permanently delete the verified experience record for <strong style={{ color: '#ffffff' }}>{itemToDelete.drive.company.name} ({itemToDelete.drive.role})</strong>.
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
              This will remove the story from the campus archive permanently. This action cannot be reversed.
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
    </div>
  )
}
