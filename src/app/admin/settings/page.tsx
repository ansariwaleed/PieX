'use client'

import { useState } from 'react'
import styles from '../admin.module.css'

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false)
  const [campusName, setCampusName] = useState('')
  const [activeYear, setActiveYear] = useState('')
  const [requireRosterMatch, setRequireRosterMatch] = useState(true)
  const [notifyOnSubmission, setNotifyOnSubmission] = useState(true)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <>
      <h1 className={styles.pageTitle}>Campus Settings</h1>
      <p className={styles.pageSubtitle}>Placement cell configuration, verification rules, and academic year settings</p>

      {saved && (
        <div style={{
          padding: '0.875rem 1.25rem',
          borderRadius: '0px',
          margin: '1.5rem 0',
          backgroundColor: 'rgba(52, 211, 153, 0.1)',
          border: '1px solid #34d399',
          color: '#34d399',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.06em'
        }}>
          CONFIRMED — Configuration updated successfully.
        </div>
      )}

      <form onSubmit={handleSave} style={{ maxWidth: '640px', marginTop: '1.5rem' }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '0px',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          <div className="form-group">
            <label className="label">Campus Name</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. National Institute of Technology"
              value={campusName}
              onChange={e => setCampusName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="label">Active Placement Drive Year</label>
            <input
              type="number"
              min="1980"
              max="2100"
              className="input"
              placeholder="e.g. 2026"
              value={activeYear}
              onChange={e => setActiveYear(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={requireRosterMatch}
                onChange={e => setRequireRosterMatch(e.target.checked)}
              />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                Require student roll number to match campus roster before submission
              </span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={notifyOnSubmission}
                onChange={e => setNotifyOnSubmission(e.target.checked)}
              />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                Send instant notification to TPC coordinator when new interview is submitted
              </span>
            </label>
          </div>

          <div>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
              Save Changes
            </button>
          </div>
        </div>
      </form>
    </>
  )
}
