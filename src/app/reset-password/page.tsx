'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import styles from '../login/login.module.css'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const initialEmail = searchParams.get('email') || ''

  const [email, setEmail] = useState(initialEmail)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/password-reset-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to submit request.')
      } else {
        setSubmitted(true)
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              color: 'var(--accent)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: '0.5rem'
            }}>
              REQUEST SUBMITTED
            </div>
            <h1 className={styles.formTitle}>Password Reset Requested</h1>
            <p className={styles.formSubtitle}>
              Your request has been queued for review
            </p>
          </div>

          <div style={{
            padding: '1.25rem',
            background: 'rgba(52, 211, 153, 0.1)',
            border: '1px solid rgba(52, 211, 153, 0.3)',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            lineHeight: 1.6,
            color: 'var(--text-secondary)'
          }}>
            Your password reset request for <strong style={{ color: '#ffffff' }}>{email}</strong> has been submitted successfully.
          </div>

          <div style={{
            padding: '1rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            marginBottom: '2rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            lineHeight: 1.7,
            color: 'var(--text-muted)'
          }}>
            <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              WHAT HAPPENS NEXT:
            </div>
            <div>• Your campus TPC Officer or platform administration will review this request.</div>
            <div>• Once approved, your password will be reset to a temporary password.</div>
            <div>• Contact your TPC officer to receive the new temporary password.</div>
          </div>

          <Link
            href="/login"
            className={styles.submitBtn}
            style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
          >
            Back to Sign In →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <h1 className={styles.formTitle}>Forgot Password</h1>
          <p className={styles.formSubtitle}>
            Submit a password reset request to your campus TPC or administration
          </p>
        </div>

        {error && (
          <div className={styles.alertError}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Registered Email Address</label>
            <input
              type="email"
              className="input"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@university.edu"
              id="reset-email"
              suppressHydrationWarning
            />
          </div>

          <div style={{
            padding: '0.85rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            marginBottom: '1rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            lineHeight: 1.6,
            color: 'var(--text-muted)'
          }}>
            Your password reset request will be sent to your campus TPC Officer for review.
            TPC Officers' requests are handled directly by central platform administration.
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading} id="reset-submit">
            {loading ? 'Submitting...' : 'Submit Reset Request →'}
          </button>
        </form>

        <p className={styles.footerText}>
          Remember your password?{' '}
          <Link href="/login" className={styles.footerLink}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className={styles.wrapper}>
        <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Loading...
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
