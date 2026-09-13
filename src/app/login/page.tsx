'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import styles from './login.module.css'
import AuthVisualShowcase from './AuthVisualShowcase'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialEmail = searchParams.get('email') || ''

  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      let userRole: string | null = null
      // Check if TPC is pending/rejected before attempting login
      const statusRes = await fetch(`/api/auth/check-status?email=${encodeURIComponent(email)}`).catch(() => null)
      if (statusRes && statusRes.ok) {
        const statusData = await statusRes.json()
        userRole = statusData.role || null
        if (statusData.isPendingTpc) {
          setError(`Your TPC Officer registration for "${statusData.campusName || 'your college'}" is pending platform institutional verification. You will be able to sign in once accepted.`)
          setLoading(false)
          return
        }
        if (statusData.isRejectedTpc) {
          setError('Your TPC Officer registration was declined by the platform administrator.')
          setLoading(false)
          return
        }
      }

      const res = await signIn('credentials', {
        email: email.toLowerCase().trim(),
        password,
        redirect: false
      })

      if (res?.error) {
        setError('Invalid email or password.')
      } else {
        setSuccess('Signed in successfully! Redirecting...')
        
        let role = userRole
        if (!role) {
          const sessionRes = await fetch('/api/auth/session').catch(() => null)
          if (sessionRes && sessionRes.ok) {
            const sessionData = await sessionRes.json()
            role = sessionData?.user?.role || null
          }
        }

        const targetUrl = role === 'SUPER_ADMIN'
          ? '/super-admin'
          : role === 'TPC_ADMIN'
            ? '/admin'
            : '/dashboard'

        setTimeout(() => {
          window.location.href = targetUrl
        }, 300)
      }
    } catch {
      setError('An error occurred during sign in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.pageGrid} data-auth-page="true">
      {/* Left Column: Form Card */}
      <div className={styles.formSection}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h1 className={styles.formTitle}>Welcome back</h1>
            <p className={styles.formSubtitle}>
              Sign in to access verified interview rounds, question archives, and placement insights.
            </p>
          </div>

          {error && (
            <div className={styles.alertError}>
              {error}
            </div>
          )}

          {success && (
            <div className={styles.alertSuccess}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@university.edu"
                id="login-email"
                suppressHydrationWarning
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label className="label" style={{ marginBottom: 0 }}>Password</label>
                <Link
                  href={`/reset-password${email ? `?email=${encodeURIComponent(email)}` : ''}`}
                  className={styles.forgotLink}
                >
                  Forgot password?
                </Link>
              </div>

              <div className={styles.inputWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  id="login-password"
                  suppressHydrationWarning
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading} id="login-submit">
              {loading ? (
                <>
                  <span>Authenticating</span>
                  <span style={{ animation: 'pulseBlink 1s infinite' }}>...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          <div className={styles.footerLinksRow}>
            <p className={styles.footerText}>
              Don't have an account?{' '}
              <Link href="/register" className={styles.footerLink}>
                Register as Student
              </Link>
            </p>
            <Link href="/register?role=tpc" className={styles.tpcRegisterLink}>
              Placement cell coordinator? Register your institution →
            </Link>
          </div>

          <div className={styles.auditFooter}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="0" ry="0" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Verified campus access with authenticated placement credentials</span>
          </div>
        </div>
      </div>

      {/* Right Column: Luminous Botanical Showcase / Terminal */}
      <div className={styles.interactiveSection}>
        <AuthVisualShowcase variant="login" />
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#08090b', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        Loading sign in portal...
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
