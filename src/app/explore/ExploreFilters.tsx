'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import styles from './exploreFilters.module.css'

interface ExploreFiltersProps {
  allCompanies: { id: string; name: string }[]
  allCampuses: { id: string; name: string }[]
  currentFilters: {
    q?: string
    company?: string
    year?: string
    campus?: string
    result?: string
  }
}

export default function ExploreFilters({
  allCompanies,
  allCampuses,
  currentFilters
}: ExploreFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  // Expanded panel toggle
  const [isExpanded, setIsExpanded] = useState(false)

  // Local form state
  const [searchQuery, setSearchQuery] = useState(currentFilters.q || '')
  const [selectedCompany, setSelectedCompany] = useState(currentFilters.company || '')
  const [selectedYear, setSelectedYear] = useState(currentFilters.year || '')
  const [selectedCampus, setSelectedCampus] = useState(currentFilters.campus || '')
  const [selectedResult, setSelectedResult] = useState(currentFilters.result || '')

  // Sync state when props change (e.g. back/forward navigation)
  useEffect(() => {
    setSearchQuery(currentFilters.q || '')
    setSelectedCompany(currentFilters.company || '')
    setSelectedYear(currentFilters.year || '')
    setSelectedCampus(currentFilters.campus || '')
    setSelectedResult(currentFilters.result || '')
  }, [currentFilters.q, currentFilters.company, currentFilters.year, currentFilters.campus, currentFilters.result])

  // Count active non-empty filters
  const activeCount = [
    currentFilters.q,
    currentFilters.company,
    currentFilters.year,
    currentFilters.campus,
    currentFilters.result
  ].filter(Boolean).length

  // Helper to push updated params to router with non-blocking transition
  const applyParams = (overrides: Partial<typeof currentFilters>) => {
    const next = {
      q: searchQuery.trim(),
      company: selectedCompany,
      year: selectedYear,
      campus: selectedCampus,
      result: selectedResult,
      ...overrides
    }

    const params = new URLSearchParams()
    if (next.q) params.set('q', next.q)
    if (next.company) params.set('company', next.company)
    if (next.year) params.set('year', next.year)
    if (next.campus) params.set('campus', next.campus)
    if (next.result) params.set('result', next.result)

    const qs = params.toString()
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname)
    })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    applyParams({ q: searchQuery.trim() })
  }

  const handleClearAll = () => {
    setSearchQuery('')
    setSelectedCompany('')
    setSelectedYear('')
    setSelectedCampus('')
    setSelectedResult('')
    startTransition(() => {
      router.push(pathname)
    })
  }

  const handleQuickCampusClick = (campusName: string) => {
    const nextCampus = selectedCampus.toLowerCase() === campusName.toLowerCase() ? '' : campusName
    setSelectedCampus(nextCampus)
    applyParams({ campus: nextCampus })
  }

  return (
    <div className={styles.filterContainer}>
      {/* Primary Search Bar & Control Row */}
      <div className={styles.searchBarWrapper}>
        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <div className={styles.inputPrefixIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search company, role (e.g. SDE), interview topic, or question keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {searchQuery && (
            <button
              type="button"
              className={styles.clearInputBtn}
              onClick={() => {
                setSearchQuery('')
                applyParams({ q: '' })
              }}
              title="Clear search"
            >
              ✕
            </button>
          )}

          <button type="submit" className={styles.searchBtn} disabled={isPending} style={{ opacity: isPending ? 0.7 : 1 }}>
            {isPending ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Collapsible Filter Toggle Button */}
        <button
          type="button"
          className={`${styles.filterToggleBtn} ${isExpanded ? styles.filterToggleBtnActive : ''}`}
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
          <span>Filters</span>
          {activeCount > 0 && (
            <span className={styles.activeBadge}>{activeCount}</span>
          )}
          <span className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ''}`}>
            ▼
          </span>
        </button>
      </div>

      {/* Quick Campus Bar */}
      <div className={styles.quickCampusRow}>
        <div className={styles.quickCampusLabel}>
          <span>Campuses:</span>
        </div>
        <div className={styles.quickCampusList}>
          <button
            type="button"
            className={`${styles.campusChip} ${!selectedCampus ? styles.campusChipActive : ''}`}
            onClick={() => handleQuickCampusClick('')}
          >
            All Campuses
          </button>
          {allCampuses.map((c) => {
            const isActive = selectedCampus.toLowerCase() === c.name.toLowerCase()
            return (
              <button
                key={c.id}
                type="button"
                className={`${styles.campusChip} ${isActive ? styles.campusChipActive : ''}`}
                onClick={() => handleQuickCampusClick(c.name)}
              >
                {c.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Collapsible Advanced Filters Drawer */}
      {isExpanded && (
        <div className={styles.drawer}>
          <div className={styles.drawerHeader}>
            <div className={styles.drawerTitle}>
              <span className={styles.drawerKicker}>Archive Criteria & Filters</span>
              <span className={styles.drawerSubtitle}>Narrow down verified interview debriefs</span>
            </div>
            {activeCount > 0 && (
              <button
                type="button"
                className={styles.drawerResetBtn}
                onClick={handleClearAll}
              >
                Reset All Criteria
              </button>
            )}
          </div>

          <div className={styles.drawerGrid}>
            {/* Field 1: Company */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="filter-drawer-company">
                Company
              </label>
              <select
                id="filter-drawer-company"
                className={styles.fieldSelect}
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
              >
                <option value="">All Companies ({allCompanies.length})</option>
                {allCompanies.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Field 2: Campus */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="filter-drawer-campus">
                College / Campus
              </label>
              <select
                id="filter-drawer-campus"
                className={styles.fieldSelect}
                value={selectedCampus}
                onChange={(e) => setSelectedCampus(e.target.value)}
              >
                <option value="">All Campuses ({allCampuses.length})</option>
                {allCampuses.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Field 3: Passing Year Button Group */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                Graduating Batch
              </label>
              <div className={styles.pillButtonGroup}>
                {['', '2026', '2025', '2024'].map((yr) => (
                  <button
                    key={yr || 'all'}
                    type="button"
                    className={`${styles.pillBtn} ${selectedYear === yr ? styles.pillBtnActive : ''}`}
                    onClick={() => setSelectedYear(yr)}
                  >
                    {yr ? `Class of ${yr}` : 'All Batches'}
                  </button>
                ))}
              </div>
            </div>

            {/* Field 4: Result Button Group */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                Interview Outcome
              </label>
              <div className={styles.pillButtonGroup}>
                {[
                  { label: 'All Outcomes', value: '' },
                  { label: 'Offered', value: 'Selected', color: 'success' },
                  { label: 'Not Selected', value: 'Not Selected', color: 'danger' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`
                      ${styles.pillBtn} 
                      ${selectedResult === opt.value ? styles.pillBtnActive : ''}
                      ${selectedResult === opt.value && opt.color === 'success' ? styles.pillSuccess : ''}
                      ${selectedResult === opt.value && opt.color === 'danger' ? styles.pillDanger : ''}
                    `}
                    onClick={() => setSelectedResult(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.drawerFooter}>
            <div className={styles.drawerSummary}>
              <span className={styles.drawerDot} />
              <span>
                {activeCount === 0
                  ? 'Showing all verified archives'
                  : `${activeCount} filter criteria applied`}
              </span>
            </div>

            <div className={styles.drawerActions}>
              <button
                type="button"
                className={styles.drawerCancelBtn}
                onClick={() => setIsExpanded(false)}
              >
                Close
              </button>
              <button
                type="button"
                className={styles.drawerApplyBtn}
                onClick={() => {
                  applyParams({})
                  setIsExpanded(false)
                }}
              >
                Apply Filters →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Chips Bar (Shown when any filter is active) */}
      {activeCount > 0 && (
        <div className={styles.activeChipsBar}>
          <span className={styles.activeChipsLabel}>FILTERED BY:</span>

          <div className={styles.chipsContainer}>
            {currentFilters.q && (
              <span className={styles.chip}>
                <span className={styles.chipKey}>Keyword:</span>
                <span className={styles.chipVal}>"{currentFilters.q}"</span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    applyParams({ q: '' })
                  }}
                  className={styles.chipRemove}
                  title="Remove query"
                >
                  ✕
                </button>
              </span>
            )}

            {currentFilters.company && (
              <span className={styles.chip}>
                <span className={styles.chipKey}>Company:</span>
                <span className={styles.chipVal}>{currentFilters.company}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCompany('')
                    applyParams({ company: '' })
                  }}
                  className={styles.chipRemove}
                  title="Remove company"
                >
                  ✕
                </button>
              </span>
            )}

            {currentFilters.campus && (
              <span className={styles.chip}>
                <span className={styles.chipKey}>Campus:</span>
                <span className={styles.chipVal}>{currentFilters.campus}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCampus('')
                    applyParams({ campus: '' })
                  }}
                  className={styles.chipRemove}
                  title="Remove campus"
                >
                  ✕
                </button>
              </span>
            )}

            {currentFilters.year && (
              <span className={styles.chip}>
                <span className={styles.chipKey}>Batch:</span>
                <span className={styles.chipVal}>{currentFilters.year}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedYear('')
                    applyParams({ year: '' })
                  }}
                  className={styles.chipRemove}
                  title="Remove batch"
                >
                  ✕
                </button>
              </span>
            )}

            {currentFilters.result && (
              <span className={styles.chip}>
                <span className={styles.chipKey}>Result:</span>
                <span className={styles.chipVal} style={{ color: currentFilters.result === 'Selected' ? 'var(--success)' : 'var(--danger)' }}>
                  {currentFilters.result}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedResult('')
                    applyParams({ result: '' })
                  }}
                  className={styles.chipRemove}
                  title="Remove result filter"
                >
                  ✕
                </button>
              </span>
            )}

            <button
              type="button"
              className={styles.clearAllBtn}
              onClick={handleClearAll}
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
