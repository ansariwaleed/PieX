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
  const [notice, setNotice] = useState<string | null>(null)

  const handleDelete = async (id: string, company: string, role: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the verified story for ${company} (${role}) permanently?`
    )
    if (!confirmed) return

    setProcessingId(id)
    try {
      const res = await fetch(`/api/admin/experiences/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setItems(prev => prev.filter(item => item.id !== id))
        setNotice(`✓ Deleted placement story for ${company} (${role}).`)
      } else {
        alert('Failed to delete story.')
      }
    } catch (err) {
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
                  onClick={() => handleDelete(item.id, item.drive.company.name, item.drive.role)}
                  disabled={processingId === item.id}
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
                  {processingId === item.id ? 'Deleting...' : '✕ Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
