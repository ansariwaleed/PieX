'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import styles from './admin.module.css'

export interface ManagedExperience {
  id: string
  submittedAt: string | Date
  publishedAt: string | Date | null
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED'
  result: string
  student: {
    name: string
    rollNumber: string | null
    email: string
    branch: string | null
    graduationYear: number | null
  }
  drive: {
    role: string
    year: number
    company: { name: string }
    campus: { name: string }
  }
  rounds: { id: string }[]
}

export default function TpcArchivesManager({
  initialExperiences,
  campusName
}: {
  initialExperiences: ManagedExperience[]
  campusName: string
}) {
  const [experiences, setExperiences] = useState<ManagedExperience[]>(initialExperiences)
  const [viewMode, setViewMode] = useState<'company' | 'year' | 'list'>('company')
  
  // Filters
  const [selectedCompany, setSelectedCompany] = useState<string>('ALL')
  const [selectedYear, setSelectedYear] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [selectedResult, setSelectedResult] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const [processingId, setProcessingId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // Extract distinct companies and years from experiences
  const companiesList = useMemo(() => {
    const set = new Set<string>()
    experiences.forEach(e => {
      if (e.drive.company.name) set.add(e.drive.company.name)
    })
    return Array.from(set).sort()
  }, [experiences])

  const yearsList = useMemo(() => {
    const set = new Set<number>()
    experiences.forEach(e => {
      if (e.drive.year) set.add(e.drive.year)
      if (e.student.graduationYear) set.add(e.student.graduationYear)
    })
    return Array.from(set).sort((a, b) => b - a)
  }, [experiences])

  // Filtered experiences
  const filteredExperiences = useMemo(() => {
    return experiences.filter(item => {
      if (selectedCompany !== 'ALL' && item.drive.company.name !== selectedCompany) {
        return false
      }
      if (selectedYear !== 'ALL') {
        const yr = parseInt(selectedYear)
        if (item.drive.year !== yr && item.student.graduationYear !== yr) {
          return false
        }
      }
      if (selectedStatus !== 'ALL' && item.verificationStatus !== selectedStatus) {
        return false
      }
      if (selectedResult !== 'ALL' && item.result !== selectedResult) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesName = item.student.name.toLowerCase().includes(q)
        const matchesEmail = item.student.email.toLowerCase().includes(q)
        const matchesRoll = item.student.rollNumber?.toLowerCase().includes(q)
        const matchesRole = item.drive.role.toLowerCase().includes(q)
        const matchesComp = item.drive.company.name.toLowerCase().includes(q)
        if (!matchesName && !matchesEmail && !matchesRoll && !matchesRole && !matchesComp) {
          return false
        }
      }
      return true
    })
  }, [experiences, selectedCompany, selectedYear, selectedStatus, selectedResult, searchQuery])

  // Actions: Delete, Revert, Verify
  const handleDelete = async (id: string, company: string, role: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete the placement story for ${company} (${role})?`
    )
    if (!confirmed) return

    setProcessingId(id)
    try {
      const res = await fetch(`/api/admin/experiences/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setExperiences(prev => prev.filter(e => e.id !== id))
        setNotice(`✓ Experience for ${company} (${role}) permanently deleted.`)
      } else {
        alert('Failed to delete experience.')
      }
    } catch (err) {
      alert('Error deleting experience.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleStatusChange = async (id: string, action: 'verify' | 'revert_pending' | 'reject') => {
    setProcessingId(id)
    try {
      const res = await fetch(`/api/admin/experiences/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      if (res.ok) {
        const nextStatus = action === 'verify' ? 'VERIFIED' : action === 'reject' ? 'REJECTED' : 'PENDING'
        setExperiences(prev => prev.map(e => e.id === id ? { ...e, verificationStatus: nextStatus } : e))
        setNotice(`✓ Status updated to ${nextStatus}.`)
      } else {
        alert('Failed to update status.')
      }
    } catch (err) {
      alert('Error updating status.')
    } finally {
      setProcessingId(null)
    }
  }

  // Grouped by Company
  const companyGroups = useMemo(() => {
    const groups: { [company: string]: ManagedExperience[] } = {}
    filteredExperiences.forEach(e => {
      const comp = e.drive.company.name
      if (!groups[comp]) groups[comp] = []
      groups[comp].push(e)
    })
    return groups
  }, [filteredExperiences])

  // Grouped by Year
  const yearGroups = useMemo(() => {
    const groups: { [year: string]: ManagedExperience[] } = {}
    filteredExperiences.forEach(e => {
      const yr = (e.drive.year || e.student.graduationYear || 2026).toString()
      if (!groups[yr]) groups[yr] = []
      groups[yr].push(e)
    })
    return groups
  }, [filteredExperiences])

  return (
    <div style={{ marginTop: '2.5rem' }}>
      {/* Management Section Header & View Mode Switcher */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '1.25rem',
        marginBottom: '1.75rem'
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.68rem',
            color: 'var(--accent)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '0.25rem'
          }}>
            PLACEMENT CELL INTELLIGENCE & VERIFICATION
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 400, color: '#ffffff', margin: 0 }}>
            {campusName} Placement Management
          </h2>
        </div>

        {/* View Mode Toggle */}
        <div style={{ display: 'flex', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => setViewMode('company')}
            style={{
              padding: '0.5rem 0.9rem',
              background: viewMode === 'company' ? '#ffffff' : 'transparent',
              color: viewMode === 'company' ? '#08090b' : 'var(--text-muted)',
              border: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              fontWeight: viewMode === 'company' ? 700 : 500,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.06em'
            }}
          >
            By Company
          </button>
          <button
            type="button"
            onClick={() => setViewMode('year')}
            style={{
              padding: '0.5rem 0.9rem',
              background: viewMode === 'year' ? '#ffffff' : 'transparent',
              color: viewMode === 'year' ? '#08090b' : 'var(--text-muted)',
              border: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              fontWeight: viewMode === 'year' ? 700 : 500,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.06em'
            }}
          >
            By Batch / Year
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            style={{
              padding: '0.5rem 0.9rem',
              background: viewMode === 'list' ? '#ffffff' : 'transparent',
              color: viewMode === 'list' ? '#08090b' : 'var(--text-muted)',
              border: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              fontWeight: viewMode === 'list' ? 700 : 500,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.06em'
            }}
          >
            All Submissions ({filteredExperiences.length})
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-strong)',
        padding: '1.25rem 1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1rem',
          alignItems: 'end'
        }}>
          {/* Company Filter */}
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Company
            </label>
            <select
              className="select"
              value={selectedCompany}
              onChange={e => setSelectedCompany(e.target.value)}
              style={{ padding: '0.45rem 0.65rem', fontSize: '0.75rem', width: '100%' }}
            >
              <option value="ALL">All Companies ({companiesList.length})</option>
              {companiesList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Batch Year
            </label>
            <select
              className="select"
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              style={{ padding: '0.45rem 0.65rem', fontSize: '0.75rem', width: '100%' }}
            >
              <option value="ALL">All Batch Years</option>
              {yearsList.map(yr => (
                <option key={yr} value={yr.toString()}>{yr} Season</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Verification Status
            </label>
            <select
              className="select"
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              style={{ padding: '0.45rem 0.65rem', fontSize: '0.75rem', width: '100%' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">◇ Pending Reviews</option>
              <option value="VERIFIED">✓ Verified & Live</option>
              <option value="REJECTED">✕ Rejected</option>
            </select>
          </div>

          {/* Outcome Filter */}
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Placement Outcome
            </label>
            <select
              className="select"
              value={selectedResult}
              onChange={e => setSelectedResult(e.target.value)}
              style={{ padding: '0.45rem 0.65rem', fontSize: '0.75rem', width: '100%' }}
            >
              <option value="ALL">All Results</option>
              <option value="Selected">✓ Selected</option>
              <option value="Rejected">✕ Not Selected</option>
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Search Candidate / Role
            </label>
            <input
              type="text"
              className="input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="e.g. Rahul, SDE, Analyst..."
              style={{ padding: '0.45rem 0.65rem', fontSize: '0.75rem', width: '100%' }}
            />
          </div>
        </div>

        {(selectedCompany !== 'ALL' || selectedYear !== 'ALL' || selectedStatus !== 'ALL' || selectedResult !== 'ALL' || searchQuery) && (
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Showing {filteredExperiences.length} of {experiences.length} submissions
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedCompany('ALL')
                setSelectedYear('ALL')
                setSelectedStatus('ALL')
                setSelectedResult('ALL')
                setSearchQuery('')
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {notice && (
        <div style={{
          padding: '0.75rem 1rem',
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

      {/* VIEW 1: COMPANY-WISE BREAKDOWN */}
      {viewMode === 'company' && (
        <div style={{ display: 'grid', gap: '2rem' }}>
          {Object.keys(companyGroups).length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              No companies match the current filter criteria.
            </div>
          ) : (
            Object.entries(companyGroups).map(([companyName, items]) => {
              const selectedCount = items.filter(i => i.result === 'Selected').length
              const pendingCount = items.filter(i => i.verificationStatus === 'PENDING').length
              const verifiedCount = items.filter(i => i.verificationStatus === 'VERIFIED').length

              return (
                <div key={companyName} style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-strong)',
                  padding: '1.75rem'
                }}>
                  {/* Company Card Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    borderBottom: '1px solid var(--border)',
                    paddingBottom: '1rem',
                    marginBottom: '1.25rem'
                  }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        RECRUITING PARTNER // {campusName}
                      </div>
                      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 600, color: '#ffffff', margin: '0.2rem 0' }}>
                        {companyName}
                      </h3>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        {items.length} Total Submissions · {selectedCount} Selected ({items.length > 0 ? Math.round((selectedCount / items.length) * 100) : 0}% Selection Rate)
                      </div>
                    </div>

                    {/* Company Stats Tags */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '0.3rem 0.6rem',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        background: 'rgba(52, 211, 153, 0.1)',
                        border: '1px solid rgba(52, 211, 153, 0.3)',
                        color: '#34d399'
                      }}>
                        {verifiedCount} VERIFIED
                      </span>
                      {pendingCount > 0 && (
                        <span style={{
                          padding: '0.3rem 0.6rem',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          background: 'rgba(234, 179, 8, 0.15)',
                          border: '1px solid rgba(234, 179, 8, 0.4)',
                          color: '#eab308'
                        }}>
                          {pendingCount} PENDING
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Submissions Table for this Company */}
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Candidate</th>
                        <th>Role / Position</th>
                        <th>Batch</th>
                        <th>Rounds</th>
                        <th>Result</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(item => (
                        <tr key={item.id}>
                          <td className={styles.primaryCol}>
                            <div style={{ fontWeight: 600, color: '#ffffff' }}>{item.student.name}</div>
                            <div className={styles.subText}>{item.student.rollNumber || item.student.email}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 500, color: '#f3f4f6' }}>{item.drive.role}</div>
                            <div className={styles.subText}>{item.student.branch || 'B.Tech'}</div>
                          </td>
                          <td>{item.drive.year || item.student.graduationYear || 2026}</td>
                          <td>{item.rounds.length} rounds</td>
                          <td>
                            <span className={`badge ${item.result === 'Selected' ? 'badge-selected' : 'badge-not-selected'}`}>
                              {item.result === 'Selected' ? '✓ SELECTED' : '✕ NOT SELECTED'}
                            </span>
                          </td>
                          <td>
                            <span className={item.verificationStatus === 'VERIFIED' ? styles.badgeVerified : styles.badgePending}>
                              {item.verificationStatus === 'VERIFIED' ? '✓ VERIFIED' : item.verificationStatus === 'PENDING' ? '◇ PENDING' : '✕ REJECTED'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              <Link
                                href={`/admin/review/${item.id}`}
                                className="btn btn-secondary"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.68rem', textDecoration: 'none' }}
                              >
                                Review
                              </Link>
                              <Link
                                href={`/admin/experiences/${item.id}/edit`}
                                style={{
                                  padding: '0.3rem 0.6rem',
                                  fontSize: '0.68rem',
                                  background: '#ffffff',
                                  color: '#08090b',
                                  fontFamily: 'var(--font-mono)',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em',
                                  textDecoration: 'none'
                                }}
                              >
                                Edit
                              </Link>
                              {item.verificationStatus === 'VERIFIED' ? (
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(item.id, 'revert_pending')}
                                  disabled={processingId === item.id}
                                  style={{
                                    padding: '0.3rem 0.6rem',
                                    fontSize: '0.68rem',
                                    background: 'transparent',
                                    border: '1px solid rgba(234, 179, 8, 0.4)',
                                    color: '#eab308',
                                    fontFamily: 'var(--font-mono)',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Unpublish
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(item.id, 'verify')}
                                  disabled={processingId === item.id}
                                  style={{
                                    padding: '0.3rem 0.6rem',
                                    fontSize: '0.68rem',
                                    background: 'transparent',
                                    border: '1px solid rgba(52, 211, 153, 0.4)',
                                    color: '#34d399',
                                    fontFamily: 'var(--font-mono)',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Verify
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDelete(item.id, item.drive.company.name, item.drive.role)}
                                disabled={processingId === item.id}
                                style={{
                                  padding: '0.3rem 0.6rem',
                                  fontSize: '0.68rem',
                                  background: 'transparent',
                                  border: '1px solid rgba(239, 68, 68, 0.4)',
                                  color: '#ef4444',
                                  fontFamily: 'var(--font-mono)',
                                  cursor: 'pointer'
                                }}
                              >
                                ✕ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* VIEW 2: YEAR-WISE BREAKDOWN */}
      {viewMode === 'year' && (
        <div style={{ display: 'grid', gap: '2rem' }}>
          {Object.keys(yearGroups).length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              No batch years match the current filter criteria.
            </div>
          ) : (
            Object.entries(yearGroups).map(([batchYear, items]) => {
              const selectedCount = items.filter(i => i.result === 'Selected').length
              const verifiedCount = items.filter(i => i.verificationStatus === 'VERIFIED').length
              const pendingCount = items.filter(i => i.verificationStatus === 'PENDING').length

              return (
                <div key={batchYear} style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-strong)',
                  padding: '1.75rem'
                }}>
                  {/* Batch Year Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    borderBottom: '1px solid var(--border)',
                    paddingBottom: '1rem',
                    marginBottom: '1.25rem'
                  }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        CAMPUS PLACEMENT COHORT // {campusName}
                      </div>
                      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 600, color: '#ffffff', margin: '0.2rem 0' }}>
                        Graduation Batch of {batchYear}
                      </h3>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        {items.length} Recorded Submissions · {selectedCount} Confirmed Offers ({items.length > 0 ? Math.round((selectedCount / items.length) * 100) : 0}% Success Rate)
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '0.3rem 0.6rem',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        background: 'rgba(52, 211, 153, 0.1)',
                        border: '1px solid rgba(52, 211, 153, 0.3)',
                        color: '#34d399'
                      }}>
                        {verifiedCount} VERIFIED
                      </span>
                      {pendingCount > 0 && (
                        <span style={{
                          padding: '0.3rem 0.6rem',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          background: 'rgba(234, 179, 8, 0.15)',
                          border: '1px solid rgba(234, 179, 8, 0.4)',
                          color: '#eab308'
                        }}>
                          {pendingCount} PENDING
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Submissions Table for this Year */}
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Candidate</th>
                        <th>Company</th>
                        <th>Role / Position</th>
                        <th>Rounds</th>
                        <th>Result</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(item => (
                        <tr key={item.id}>
                          <td className={styles.primaryCol}>
                            <div style={{ fontWeight: 600, color: '#ffffff' }}>{item.student.name}</div>
                            <div className={styles.subText}>{item.student.rollNumber || item.student.email}</div>
                          </td>
                          <td style={{ fontWeight: 600, color: '#f3f4f6' }}>{item.drive.company.name}</td>
                          <td>
                            <div>{item.drive.role}</div>
                            <div className={styles.subText}>{item.student.branch || 'B.Tech'}</div>
                          </td>
                          <td>{item.rounds.length} rounds</td>
                          <td>
                            <span className={`badge ${item.result === 'Selected' ? 'badge-selected' : 'badge-not-selected'}`}>
                              {item.result === 'Selected' ? '✓ SELECTED' : '✕ NOT SELECTED'}
                            </span>
                          </td>
                          <td>
                            <span className={item.verificationStatus === 'VERIFIED' ? styles.badgeVerified : styles.badgePending}>
                              {item.verificationStatus === 'VERIFIED' ? '✓ VERIFIED' : item.verificationStatus === 'PENDING' ? '◇ PENDING' : '✕ REJECTED'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              <Link
                                href={`/admin/review/${item.id}`}
                                className="btn btn-secondary"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.68rem', textDecoration: 'none' }}
                              >
                                Review
                              </Link>
                              <Link
                                href={`/admin/experiences/${item.id}/edit`}
                                style={{
                                  padding: '0.3rem 0.6rem',
                                  fontSize: '0.68rem',
                                  background: '#ffffff',
                                  color: '#08090b',
                                  fontFamily: 'var(--font-mono)',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em',
                                  textDecoration: 'none'
                                }}
                              >
                                Edit
                              </Link>
                              {item.verificationStatus === 'VERIFIED' ? (
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(item.id, 'revert_pending')}
                                  disabled={processingId === item.id}
                                  style={{
                                    padding: '0.3rem 0.6rem',
                                    fontSize: '0.68rem',
                                    background: 'transparent',
                                    border: '1px solid rgba(234, 179, 8, 0.4)',
                                    color: '#eab308',
                                    fontFamily: 'var(--font-mono)',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Unpublish
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(item.id, 'verify')}
                                  disabled={processingId === item.id}
                                  style={{
                                    padding: '0.3rem 0.6rem',
                                    fontSize: '0.68rem',
                                    background: 'transparent',
                                    border: '1px solid rgba(52, 211, 153, 0.4)',
                                    color: '#34d399',
                                    fontFamily: 'var(--font-mono)',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Verify
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDelete(item.id, item.drive.company.name, item.drive.role)}
                                disabled={processingId === item.id}
                                style={{
                                  padding: '0.3rem 0.6rem',
                                  fontSize: '0.68rem',
                                  background: 'transparent',
                                  border: '1px solid rgba(239, 68, 68, 0.4)',
                                  color: '#ef4444',
                                  fontFamily: 'var(--font-mono)',
                                  cursor: 'pointer'
                                }}
                              >
                                ✕ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* VIEW 3: MASTER LIST VIEW */}
      {viewMode === 'list' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)', padding: '1.5rem' }}>
          {filteredExperiences.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              No submissions match the current filter criteria.
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Batch</th>
                  <th>Rounds</th>
                  <th>Result</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExperiences.map(item => (
                  <tr key={item.id}>
                    <td className={styles.primaryCol}>
                      <div style={{ fontWeight: 600, color: '#ffffff' }}>{item.student.name}</div>
                      <div className={styles.subText}>{item.student.rollNumber || item.student.email}</div>
                    </td>
                    <td style={{ fontWeight: 600, color: '#f3f4f6' }}>{item.drive.company.name}</td>
                    <td>{item.drive.role}</td>
                    <td>{item.drive.year || item.student.graduationYear || 2026}</td>
                    <td>{item.rounds.length}</td>
                    <td>
                      <span className={`badge ${item.result === 'Selected' ? 'badge-selected' : 'badge-not-selected'}`}>
                        {item.result === 'Selected' ? '✓ SELECTED' : '✕ NOT SELECTED'}
                      </span>
                    </td>
                    <td>
                      <span className={item.verificationStatus === 'VERIFIED' ? styles.badgeVerified : styles.badgePending}>
                        {item.verificationStatus === 'VERIFIED' ? '✓ VERIFIED' : item.verificationStatus === 'PENDING' ? '◇ PENDING' : '✕ REJECTED'}
                      </span>
                    </td>
                    <td>{new Date(item.submittedAt).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <Link
                          href={`/admin/review/${item.id}`}
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.68rem', textDecoration: 'none' }}
                        >
                          Review
                        </Link>
                        <Link
                          href={`/admin/experiences/${item.id}/edit`}
                          style={{
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.68rem',
                            background: '#ffffff',
                            color: '#08090b',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            textDecoration: 'none'
                          }}
                        >
                          Edit
                        </Link>
                        {item.verificationStatus === 'VERIFIED' ? (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item.id, 'revert_pending')}
                            disabled={processingId === item.id}
                            style={{
                              padding: '0.3rem 0.6rem',
                              fontSize: '0.68rem',
                              background: 'transparent',
                              border: '1px solid rgba(234, 179, 8, 0.4)',
                              color: '#eab308',
                              fontFamily: 'var(--font-mono)',
                              cursor: 'pointer'
                            }}
                          >
                            Unpublish
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item.id, 'verify')}
                            disabled={processingId === item.id}
                            style={{
                              padding: '0.3rem 0.6rem',
                              fontSize: '0.68rem',
                              background: 'transparent',
                              border: '1px solid rgba(52, 211, 153, 0.4)',
                              color: '#34d399',
                              fontFamily: 'var(--font-mono)',
                              cursor: 'pointer'
                            }}
                          >
                            Verify
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.drive.company.name, item.drive.role)}
                          disabled={processingId === item.id}
                          style={{
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.68rem',
                            background: 'transparent',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            color: '#ef4444',
                            fontFamily: 'var(--font-mono)',
                            cursor: 'pointer'
                          }}
                        >
                          ✕ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
