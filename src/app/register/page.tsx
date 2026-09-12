'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import styles from './register.module.css'
import RegisterInteractivePanel from './RegisterInteractivePanel'

interface Campus {
  id: string
  name: string
  location: string
}

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialRole = searchParams.get('role') === 'tpc' ? false : true

  const [isStudent, setIsStudent] = useState(initialRole)
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [tpcSubmittedInfo, setTpcSubmittedInfo] = useState<{
    collegeName: string
    email: string
  } | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    campusId: '',
    collegeName: '',
    branch: '',
    rollNumber: '',
    graduationYear: ''
  })

  useEffect(() => {
    fetch('/api/campuses')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCampuses(data)
        }
      })
      .catch(console.error)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const payload = isStudent
        ? {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            campusId: formData.campusId,
            role: 'STUDENT',
            branch: formData.branch,
            rollNumber: formData.rollNumber,
            graduationYear: formData.graduationYear
          }
        : {
            name: formData.name || 'Training & Placement Cell',
            email: formData.email,
            password: formData.password,
            collegeName: formData.collegeName || (campuses.find(c => c.id === formData.campusId)?.name ?? ''),
            campusId: formData.campusId,
            role: 'TPC_ADMIN'
          }

      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed')
      } else {
        if (!isStudent) {
          // TPC Registration queued for institutional verification
          setTpcSubmittedInfo({
            collegeName: formData.collegeName || (campuses.find(c => c.id === formData.campusId)?.name ?? 'Your College'),
            email: formData.email
          })
        } else {
          setSuccess('Student account created successfully! Redirecting to sign in...')
          setTimeout(() => {
            router.push('/login')
          }, 1500)
        }
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.pageGrid} data-auth-page="true">
      {/* Left Column: Registration Form */}
      <div className={styles.formSection}>
        <div className={styles.formCard}>
          {tpcSubmittedInfo ? (
            /* TPC Registration Queued State */
            <div>
              <div className={styles.formHeader}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  color: 'var(--accent)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: '0.5rem'
                }}>
                  REGISTRATION REQUEST TRANSMITTED
                </div>
                <h1 className={styles.formTitle}>Request Under Review</h1>
                <p className={styles.formSubtitle}>
                  Awaiting Platform Institutional Verification & Acceptance
                </p>
              </div>

              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-strong)',
                padding: '1.5rem',
                marginBottom: '2rem'
              }}>
                <div style={{ display: 'grid', gap: '0.85rem', fontSize: '0.875rem' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      College / University
                    </div>
                    <div style={{ fontWeight: 600, color: '#ffffff', marginTop: '0.2rem' }}>
                      {tpcSubmittedInfo.collegeName}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Registered Official Email
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      {tpcSubmittedInfo.email}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Approval Status
                    </div>
                    <div style={{ marginTop: '0.3rem' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.6rem',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        background: 'rgba(234, 179, 8, 0.12)',
                        border: '1px solid rgba(234, 179, 8, 0.4)',
                        color: '#eab308'
                      }}>
                        PENDING INSTITUTIONAL VERIFICATION
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '0.875rem', lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Your TPC Officer registration request has been safely received. The platform verification team will verify your college placement credentials. Once accepted, you will be able to log in and manage your campus placement stories.
              </p>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link
                  href="/login"
                  style={{
                    flex: 1,
                    padding: '0.875rem 1.25rem',
                    background: '#ffffff',
                    color: '#08090b',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    textDecoration: 'none'
                  }}
                >
                  Go to Sign In →
                </Link>
                <Link
                  href="/"
                  style={{
                    flex: 1,
                    padding: '0.875rem 1.25rem',
                    background: 'transparent',
                    border: '1px solid var(--border-strong)',
                    color: '#ffffff',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    textDecoration: 'none'
                  }}
                >
                  Return Home
                </Link>
              </div>
            </div>
          ) : (
            /* Main Registration Form */
            <>
              <div className={styles.formHeader}>
                <h1 className={styles.formTitle}>
                  {isStudent ? 'Create student account' : 'Register placement cell'}
                </h1>
                <p className={styles.formSubtitle}>
                  {isStudent
                    ? 'Join your campus to explore verified interview rounds and reports.'
                    : 'Register your college training and placement cell for verification.'}
                </p>
              </div>

              {/* Role Toggle */}
              <div className={styles.toggleRow}>
                <button
                  type="button"
                  className={isStudent ? styles.toggleBtnActive : styles.toggleBtn}
                  onClick={() => {
                    setIsStudent(true)
                    setError(null)
                  }}
                >
                  Student Account
                </button>
                <button
                  type="button"
                  className={!isStudent ? styles.toggleBtnActive : styles.toggleBtn}
                  onClick={() => {
                    setIsStudent(false)
                    setError(null)
                  }}
                >
                  TPC Officer / Cell
                </button>
              </div>

              {error && <div className={styles.alertError}>{error}</div>}
              {success && <div className={styles.alertSuccess}>{success}</div>}

              <form onSubmit={handleSubmit}>
                {/* Contact / Officer Name */}
                <div className="form-group">
                  <label className="label">
                    {isStudent ? 'Full Name' : 'Placement Officer / Coordinator Name'}
                  </label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder={isStudent ? 'e.g. Rahul Sharma' : 'e.g. Dr. S. K. Gupta / Placement Cell'}
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                {/* Email */}
                <div className="form-group">
                  <label className="label">
                    {isStudent ? 'Student Email' : 'Official College Email'}
                  </label>
                  <input
                    type="email"
                    required
                    className="input"
                    placeholder={isStudent ? 'e.g. rahul@iitdelhi.ac.in' : 'e.g. tpc@college.edu.in'}
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    suppressHydrationWarning
                  />
                </div>

                {/* Password */}
                <div className="form-group">
                  <label className="label">Password</label>
                  <input
                    type="password"
                    required
                    className="input"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>

                {/* For TPC Registration: Only College Name is Needed */}
                {!isStudent ? (
                  <div className="form-group">
                    <label className="label">College / University Name</label>
                    <input
                      type="text"
                      required
                      className="input"
                      list="partner-colleges"
                      placeholder="Type your college name (e.g. IIT Delhi, NIT Trichy...)"
                      value={formData.collegeName}
                      onChange={e => {
                        const val = e.target.value
                        const matched = campuses.find(c => c.name.toLowerCase() === val.toLowerCase())
                        setFormData({
                          ...formData,
                          collegeName: val,
                          campusId: matched ? matched.id : ''
                        })
                      }}
                    />
                    <datalist id="partner-colleges">
                      {campuses.map(c => (
                        <option key={c.id} value={c.name} />
                      ))}
                    </datalist>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.68rem',
                      color: 'var(--text-muted)',
                      marginTop: '0.4rem',
                      letterSpacing: '0.04em'
                    }}>
                      NOTE: For TPC registration, only your college name and official contact credentials are required. Your request will be queued for institutional platform verification.
                    </div>
                  </div>
                ) : (
                  /* Student College Select */
                  <div className="form-group">
                    <label className="label">Assigned Campus / College</label>
                    <select
                      className="select"
                      required
                      value={formData.campusId}
                      onChange={e => setFormData({ ...formData, campusId: e.target.value })}
                    >
                      <option value="">Select your college / campus...</option>
                      {campuses.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.location})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Student Specific Fields (Omitted entirely for TPC) */}
                {isStudent && (
                  <>
                    <div className={styles.formRow}>
                      <div className="form-group">
                        <label className="label">Branch</label>
                        <input
                          type="text"
                          required
                          className="input"
                          placeholder="e.g. B.Tech CSE"
                          value={formData.branch}
                          onChange={e => setFormData({ ...formData, branch: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="label">Roll Number</label>
                        <input
                          type="text"
                          required
                          className="input"
                          placeholder="e.g. 22CSE104"
                          value={formData.rollNumber}
                          onChange={e => setFormData({ ...formData, rollNumber: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="label">Graduation Year</label>
                      <input
                        type="number"
                        required
                        min="1980"
                        max="2100"
                        className="input"
                        placeholder="e.g. 2026"
                        value={formData.graduationYear}
                        onChange={e => setFormData({ ...formData, graduationYear: e.target.value })}
                        id="register-grad-year"
                      />
                    </div>
                  </>
                )}

                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading
                    ? 'Transmitting Request...'
                    : isStudent
                    ? 'Register Student Account →'
                    : 'Submit TPC Registration Request →'}
                </button>
              </form>

              <p className={styles.footerText}>
                Already registered?{' '}
                <Link href="/login" className={styles.footerLink}>
                  Sign In
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

      {/* Right Column: Interactive Career & Placement Radar */}
      <div className={styles.interactiveSection}>
        <RegisterInteractivePanel />
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#08090b', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        Loading registration portal...
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}
