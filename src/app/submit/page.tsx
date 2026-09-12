'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import styles from './submit.module.css'

interface Round {
  roundNumber: number
  type: string
  durationMinutes: number
  difficulty: number
  topics: string
  description: string
}

interface Company {
  id: string
  name: string
}

interface Campus {
  id: string
  name: string
}

export default function SubmitPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role

  const [step, setStep] = useState(1)
  const [companies, setCompanies] = useState<Company[]>([])
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submittedExperienceId, setSubmittedExperienceId] = useState<string | null>(null)

  // Block TPC Admins and Super Admins from submitting candidate stories
  if (userRole === 'TPC_ADMIN' || userRole === 'SUPER_ADMIN') {
    return (
      <div className="container" style={{ minHeight: '65vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem' }}>
        <div style={{
          maxWidth: '560px',
          width: '100%',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-strong)',
          padding: '3rem 2.5rem',
          textAlign: 'left'
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            color: 'var(--accent)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '0.75rem'
          }}>
            ACCESS RESTRICTED // STUDENTS ONLY
          </div>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.85rem',
            fontWeight: 400,
            color: '#ffffff',
            marginBottom: '0.75rem'
          }}>
            Candidate Submission Area
          </h2>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            lineHeight: 1.7,
            marginBottom: '2rem'
          }}>
            Placement experience submission is reserved strictly for student accounts. You are currently logged in with an administrative account (<strong>{userRole === 'SUPER_ADMIN' ? 'Super Administrator' : 'TPC Officer'}</strong>). Administrative accounts review and verify student records rather than submitting them.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link
              href="/admin"
              style={{
                padding: '0.75rem 1.25rem',
                background: '#ffffff',
                color: '#08090b',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                textDecoration: 'none'
              }}
            >
              Go to TPC Console →
            </Link>
            {userRole === 'SUPER_ADMIN' && (
              <Link
                href="/super-admin"
                style={{
                  padding: '0.75rem 1.25rem',
                  background: 'transparent',
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
                Super Admin Console →
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Step 1: Placement Info
  const [companyName, setCompanyName] = useState('OTHER')
  const [customCompany, setCustomCompany] = useState('')
  const [campusName, setCampusName] = useState('OTHER')
  const [customCampus, setCustomCampus] = useState('')
  const [role, setRole] = useState('Associate Analyst')
  const [year, setYear] = useState('2026')
  const [branch, setBranch] = useState('B.Tech CSE')
  const [result, setResult] = useState('Selected')
  const [isAnonymous, setIsAnonymous] = useState(true)

  // Step 2: Rounds
  const [rounds, setRounds] = useState<Round[]>([
    {
      roundNumber: 1,
      type: 'Online Assessment',
      durationMinutes: 60,
      difficulty: 3,
      topics: 'Aptitude, Quantitative, Logical Reasoning',
      description: 'Online test with 3 sections. Quantitative was medium difficulty, verbal was direct. Need good speed to complete all questions.'
    },
    {
      roundNumber: 2,
      type: 'Technical Interview',
      durationMinutes: 45,
      difficulty: 3,
      topics: 'DSA, DBMS, SQL, Projects',
      description: 'Discussed resume projects and asked SQL queries on joins. Then solved a 2-pointer problem on arrays.'
    },
    {
      roundNumber: 3,
      type: 'HR Interview',
      durationMinutes: 20,
      difficulty: 2,
      topics: 'Behavioral, Teamwork, Relocation',
      description: 'General behavioral questions like "Why this company?", "Describe a challenge you overcame", and willingness to relocate.'
    }
  ])

  useEffect(() => {
    Promise.all([
      fetch('/api/companies').then(res => res.json()).catch(() => []),
      fetch('/api/campuses').then(res => res.json()).catch(() => [])
    ]).then(([comps, camps]) => {
      if (Array.isArray(comps) && comps.length > 0) {
        setCompanies(comps)
        setCompanyName(comps[0].name)
      } else {
        setCompanies([])
        setCompanyName('OTHER')
      }
      if (Array.isArray(camps) && camps.length > 0) {
        setCampuses(camps)
        setCampusName(camps[0].name)
      } else {
        setCampuses([])
        setCampusName('OTHER')
      }
    })
  }, [])

  const addRound = () => {
    setRounds([
      ...rounds,
      {
        roundNumber: rounds.length + 1,
        type: 'Technical Interview',
        durationMinutes: 45,
        difficulty: 3,
        topics: '',
        description: ''
      }
    ])
  }

  const updateRound = (index: number, field: keyof Round, value: any) => {
    const updated = [...rounds]
    updated[index] = { ...updated[index], [field]: value }
    setRounds(updated)
  }

  const removeRound = (index: number) => {
    const updated = rounds.filter((_, i) => i !== index).map((r, i) => ({ ...r, roundNumber: i + 1 }))
    setRounds(updated)
  }

  const handleSubmit = async () => {
    setError(null)
    setSubmitting(true)

    const finalCompany = (companies.length === 0 || companyName === 'OTHER')
      ? customCompany.trim()
      : companyName.trim()

    const finalCampus = (campuses.length === 0 || campusName === 'OTHER')
      ? customCampus.trim()
      : campusName.trim()

    if (!finalCompany) {
      setError('Please specify a company name.')
      setSubmitting(false)
      return
    }

    if (!finalCampus) {
      setError('Please specify a college / campus name.')
      setSubmitting(false)
      return
    }

    try {
      const payload = {
        companyName: finalCompany,
        campusName: finalCampus,
        role,
        year: parseInt(year),
        branch,
        result,
        isAnonymous,
        rounds
      }

      const res = await fetch('/api/experiences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to submit experience')
      } else {
        setSubmittedExperienceId(data.id)
      }
    } catch (err) {
      setError('An unexpected network error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submittedExperienceId) {
    return (
      <main className="container" style={{ padding: '5rem 0', maxWidth: '640px' }}>
        <div className={styles.formCard} style={{ textAlign: 'left' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '1rem' }}>
            RECORD // SUCCESSFUL TRANSMISSION
          </div>
          <h2 className={styles.formTitle}>Submission Received by TPC</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            Your interview experience has been queued for verification with the <strong>{campusName} Training & Placement Cell</strong>. Once official participation is confirmed against placement records, it will be published to the public intelligence archive.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/my-submissions" className="btn btn-primary">
              Track in My Submissions →
            </Link>
            <Link href="/explore" className="btn btn-secondary">
              Browse Public Archive
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="container">
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Submit Your Placement Experience</h1>
        <p className={styles.pageSubtitle}>Share your interview journey to help fellow batchmates & juniors prepare</p>
      </div>

      {/* Step Indicator */}
      <div className={styles.stepsBar}>
        <div className={styles.stepIndicator}>
          <div className={step >= 1 ? (step > 1 ? styles.stepCircleDone : styles.stepCircleActive) : styles.stepCircle}>
            01
          </div>
          <span className={step >= 1 ? styles.stepTextActive : styles.stepText}>Placement Details</span>
        </div>
        <div className={step > 1 ? styles.stepDividerDone : styles.stepDivider}></div>
        <div className={styles.stepIndicator}>
          <div className={step >= 2 ? (step > 2 ? styles.stepCircleDone : styles.stepCircleActive) : styles.stepCircle}>
            02
          </div>
          <span className={step >= 2 ? styles.stepTextActive : styles.stepText}>Interview Rounds</span>
        </div>
        <div className={step > 2 ? styles.stepDividerDone : styles.stepDivider}></div>
        <div className={styles.stepIndicator}>
          <div className={step >= 3 ? styles.stepCircleActive : styles.stepCircle}>03</div>
          <span className={step >= 3 ? styles.stepTextActive : styles.stepText}>Review & Submit</span>
        </div>
      </div>

      {error && (
        <div style={{
          maxWidth: '640px',
          margin: '0 auto 1.5rem',
          padding: '0.875rem 1.25rem',
          borderRadius: '0px',
          backgroundColor: 'rgba(248, 113, 113, 0.15)',
          border: '1px solid rgba(248, 113, 113, 0.3)',
          color: '#f87171'
        }}>
          {error}
        </div>
      )}

      {/* Step 1: Placement Information */}
      {step === 1 && (
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>Placement Information</h2>
          {/* Company & Role Row */}
          <div className={styles.formRow}>
            {companies.length > 0 ? (
              <div className="form-group">
                <label className="label">Company</label>
                <select
                  className="select"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  id="submit-company"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                  <option value="OTHER">+ Add other company</option>
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label className="label">Company Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Google, Microsoft, Deloitte"
                  value={customCompany}
                  onChange={e => setCustomCompany(e.target.value)}
                  id="submit-custom-company"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="label">Role Offered</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Software Engineer"
                value={role}
                onChange={e => setRole(e.target.value)}
                id="submit-role"
                required
              />
            </div>
          </div>

          {/* If existing companies exist and user selected "+ Add other company" */}
          {companies.length > 0 && companyName === 'OTHER' && (
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="label">Enter New Company Name</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Adobe, Uber, Cisco, Goldman Sachs"
                value={customCompany}
                onChange={e => setCustomCompany(e.target.value)}
                id="submit-custom-company"
                autoFocus
                required
              />
            </div>
          )}

          {/* Campus & Placement Year Row */}
          <div className={styles.formRow}>
            {campuses.length > 0 ? (
              <div className="form-group">
                <label className="label">Campus</label>
                <select
                  className="select"
                  value={campusName}
                  onChange={e => setCampusName(e.target.value)}
                  id="submit-campus"
                >
                  {campuses.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                  <option value="OTHER">+ Add other college</option>
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label className="label">College / Campus</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. IIT Delhi, BITS Pilani, NIT Trichy"
                  value={customCampus}
                  onChange={e => setCustomCampus(e.target.value)}
                  id="submit-custom-campus"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="label">Placement Year</label>
              <input
                type="number"
                required
                min="1980"
                max="2100"
                className="input"
                placeholder="e.g. 2026"
                value={year}
                onChange={e => setYear(e.target.value)}
                id="submit-year"
              />
            </div>
          </div>

          {/* If existing campuses exist and user selected "+ Add other college" */}
          {campuses.length > 0 && campusName === 'OTHER' && (
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="label">Enter College / University Name</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. IIT Bombay, DTU, VIT Vellore"
                value={customCampus}
                onChange={e => setCustomCampus(e.target.value)}
                id="submit-custom-campus"
                autoFocus
                required
              />
            </div>
          )}

          <div className={styles.formRow}>
            <div className="form-group">
              <label className="label">Branch</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. B.Tech CSE"
                value={branch}
                onChange={e => setBranch(e.target.value)}
                id="submit-branch"
              />
            </div>
            <div className="form-group">
              <label className="label">Final Result</label>
              <select
                className="select"
                value={result}
                onChange={e => setResult(e.target.value)}
                id="submit-result"
              >
                <option value="Selected">Selected</option>
                <option value="Not Selected">Not Selected</option>
                <option value="Waitlisted">Waitlisted</option>
              </select>
            </div>
          </div>

          <div className={styles.actions}>
            <button className="btn btn-primary btn-lg" onClick={() => setStep(2)}>
              Next: Add Rounds ({rounds.length}) →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Interview Rounds */}
      {step === 2 && (
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>Interview Rounds Breakdown</h2>

          {rounds.map((round, index) => (
            <div className={styles.roundSection} key={index}>
              <div className={styles.roundHeader}>
                <h3 className={styles.roundTitle}>Round {index + 1}</h3>
                {rounds.length > 1 && (
                  <button className={styles.removeBtn} onClick={() => removeRound(index)}>
                    REMOVE ROUND
                  </button>
                )}
              </div>

              <div className={styles.formRow}>
                <div className="form-group">
                  <label className="label">Round Type</label>
                  <select
                    className="select"
                    value={round.type}
                    onChange={e => updateRound(index, 'type', e.target.value)}
                  >
                    <option value="Online Assessment">Online Assessment</option>
                    <option value="Technical Interview">Technical Interview</option>
                    <option value="HR Interview">HR Interview</option>
                    <option value="Managerial Interview">Managerial Interview</option>
                    <option value="Group Discussion">Group Discussion</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Duration (minutes)</label>
                  <input
                    type="number"
                    className="input"
                    value={round.durationMinutes}
                    onChange={e => updateRound(index, 'durationMinutes', parseInt(e.target.value) || 30)}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className="form-group">
                  <label className="label">Difficulty (1-5)</label>
                  <select
                    className="select"
                    value={round.difficulty}
                    onChange={e => updateRound(index, 'difficulty', parseInt(e.target.value))}
                  >
                    <option value="1">1 — Easy</option>
                    <option value="2">2 — Moderate</option>
                    <option value="3">3 — Medium</option>
                    <option value="4">4 — Hard</option>
                    <option value="5">5 — Very Hard</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Topics Tested (comma separated)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. DSA, DBMS, System Design, SQL"
                    value={round.topics}
                    onChange={e => updateRound(index, 'topics', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Your Experience / Questions Asked</label>
                <textarea
                  className="input"
                  rows={4}
                  placeholder="Describe the questions asked, interview atmosphere, approach you used, and any tips..."
                  value={round.description}
                  onChange={e => updateRound(index, 'description', e.target.value)}
                ></textarea>
              </div>
            </div>
          ))}

          <button className={styles.addRoundBtn} onClick={addRound}>
            + Add Another Round
          </button>

          <div className={styles.actions}>
            <button className="btn btn-secondary btn-lg" onClick={() => setStep(1)}>
              ← Back
            </button>
            <button className="btn btn-primary btn-lg" onClick={() => setStep(3)}>
              Next: Review & Submit →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>Review & Submit</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.7 }}>
            Your experience will be submitted to <strong>{(campuses.length === 0 || campusName === 'OTHER') ? (customCampus || 'your college') : campusName} TPC</strong> for verification against official placement records. Upon verification, it will be published to the public placement archive.
          </p>

          <div style={{
            background: 'var(--bg-secondary)',
            padding: '1.25rem',
            borderRadius: '0px',
            marginBottom: '1.5rem',
            border: '1px solid var(--border)'
          }}>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Summary of Submission:
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div><strong>Company:</strong> {(companies.length === 0 || companyName === 'OTHER') ? (customCompany || 'Specified Company') : companyName}</div>
              <div><strong>Role:</strong> {role}</div>
              <div><strong>Campus:</strong> {(campuses.length === 0 || campusName === 'OTHER') ? (customCampus || 'Specified College') : campusName}</div>
              <div><strong>Year:</strong> {year}</div>
              <div><strong>Result:</strong> {result}</div>
              <div><strong>Total Rounds:</strong> {rounds.length}</div>
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={e => setIsAnonymous(e.target.checked)}
                id="submit-anonymous"
              />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                Publish anonymously on public archive (Student identity will only be visible to TPC)
              </span>
            </label>
          </div>

          <div className={styles.actions}>
            <button className="btn btn-secondary btn-lg" onClick={() => setStep(2)}>
              ← Back
            </button>
            <button
              className="btn btn-primary btn-lg"
              disabled={submitting}
              onClick={handleSubmit}
              id="submit-confirm-btn"
            >
              {submitting ? 'Submitting to TPC...' : 'Submit for TPC Verification →'}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
