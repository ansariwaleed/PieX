import Link from 'next/link'
import styles from './explore.module.css'
import { prisma } from '@/lib/prisma'
import ExploreFilters from './ExploreFilters'

export default async function ExplorePage({
  searchParams
}: {
  searchParams: Promise<{ company?: string; year?: string; campus?: string; result?: string; q?: string }>
}) {
  const params = await searchParams
  const company = params.company || ''
  const year = params.year || ''
  const campus = params.campus || ''
  const result = params.result || ''
  const q = (params.q || '').trim()

  const whereClause: any = {
    verificationStatus: 'VERIFIED'
  }

  if (result) {
    whereClause.result = result
  }

  if (company || year || campus) {
    whereClause.drive = {}
    if (company) {
      whereClause.drive.company = { name: { equals: company, mode: 'insensitive' } }
    }
    if (year) {
      whereClause.drive.year = parseInt(year)
    }
    if (campus) {
      whereClause.drive.campus = { name: { equals: campus, mode: 'insensitive' } }
    }
  }

  if (q) {
    whereClause.OR = [
      { drive: { role: { contains: q, mode: 'insensitive' } } },
      { drive: { company: { name: { contains: q, mode: 'insensitive' } } } },
      { rounds: { some: { description: { contains: q, mode: 'insensitive' } } } }
    ]
  }

  const [experiences, allCompanies, allCampuses] = await Promise.all([
    prisma.experience.findMany({
      where: whereClause,
      include: {
        drive: {
          include: {
            company: true,
            campus: true
          }
        },
        rounds: {
          orderBy: { roundNumber: 'asc' }
        },
        student: {
          select: {
            branch: true,
            graduationYear: true
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      }
    }),
    prisma.company.findMany({ orderBy: { name: 'asc' } }),
    prisma.campus.findMany({ orderBy: { name: 'asc' } })
  ])

  // Check if filtering is active
  const isFiltering = Boolean(company || year || campus || result || q)
  const spotlightExp = !isFiltering && experiences.length > 0 ? experiences[0] : null
  const archiveList = spotlightExp ? experiences.slice(1) : experiences

  return (
    <main className="container">
      <header className={styles.pageHeader}>
        <div className={styles.kicker}>
          PIEX (πX) // THE PLACEMENT EXPERIENCE · PAN-INDIA INTELLIGENCE
        </div>
        <h1 className={styles.pageTitle}>Explore Campus Placement Stories</h1>
        <p className={styles.pageSubtitle}>
          Verified round-by-round interview debriefs, online assessment questions, and preparation strategies from premier institutions across India.
        </p>
      </header>

      {/* Featured Spotlight Story (when not filtering) */}
      {spotlightExp && (
        <Link href={`/experiences/${spotlightExp.id}`} className={styles.spotlightCard}>
          <div>
            <div className={styles.spotlightKicker}>
              <span>FEATURED INTERVIEW STORY</span>
              <span>·</span>
              <span>{spotlightExp.drive.campus.name}</span>
              <span>·</span>
              <span>◷ ~4 MIN READ</span>
            </div>
            <h2 className={styles.spotlightTitle}>
              {spotlightExp.drive.company.name} — {spotlightExp.drive.role}
            </h2>
            <p className={styles.spotlightExcerpt}>
              "{spotlightExp.rounds[0]?.description?.slice(0, 220)}..."
            </p>
            <div className={styles.spotlightMeta}>
              <span>BATCH {spotlightExp.drive.year}</span>
              <span>·</span>
              <span>{spotlightExp.rounds.length} ROUNDS DETAILED</span>
              <span>·</span>
              <span style={{ color: spotlightExp.result === 'Selected' ? '#34d399' : '#f87171' }}>
                {spotlightExp.result === 'Selected' ? '✓ SELECTED' : '✕ NOT SELECTED'}
              </span>
            </div>
          </div>

          <div className={styles.spotlightAction}>
            READ FULL STORY →
          </div>
        </Link>
      )}

      {/* Sleek, Collapsible Intelligence Filter Console */}
      <ExploreFilters
        allCompanies={allCompanies}
        allCampuses={allCampuses}
        currentFilters={{ q, company, year, campus, result }}
      />

      <div className={styles.resultsInfo}>
        <span className={styles.resultCount}>
          FOUND // {experiences.length} VERIFIED INTERVIEW STORIES
        </span>
      </div>

      {archiveList.length === 0 ? (
        <div style={{ padding: '4rem 0', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', color: '#ffffff' }}>No verified records found for this query</h3>
          <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
            Try clearing filters or search for another company or campus.
          </p>
          <Link href="/explore" className="btn btn-secondary" style={{ marginTop: '1.5rem', display: 'inline-block' }}>
            Reset Filters
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {archiveList.map((exp, idx) => {
            const words = exp.rounds.reduce((acc, r) => acc + (r.description ? r.description.split(/\s+/).length : 0), 0)
            const readMinutes = Math.max(3, Math.ceil(words / 150))
            const firstDescription = exp.rounds[0]?.description || ''

            return (
              <Link href={`/experiences/${exp.id}`} className={styles.card} key={exp.id}>
                <div>
                  <div className={styles.cardTop}>
                    <div>
                      <div className={styles.cardDossierIndex}>
                        STORY // {idx < 9 ? `0${idx + 1}` : idx + 1} · ◷ {readMinutes}M READ
                      </div>
                      <h3 className={styles.companyName}>{exp.drive.company.name}</h3>
                      <div className={styles.roleName}>{exp.drive.role}</div>
                    </div>
                    <span className={`badge ${exp.result === 'Selected' ? 'badge-selected' : 'badge-not-selected'}`}>
                      {exp.result === 'Selected' ? '✓ SELECTED' : '✕ NOT SELECTED'}
                    </span>
                  </div>

                  <div className={styles.cardMeta}>
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{exp.drive.campus.name}</span>
                    <span className={styles.metaDot}>/</span>
                    <span>BATCH {exp.drive.year}</span>
                    <span className={styles.metaDot}>/</span>
                    <span>{exp.rounds.length} ROUNDS</span>
                  </div>

                  {firstDescription && (
                    <p className={styles.cardExcerpt}>
                      "{firstDescription.slice(0, 140)}..."
                    </p>
                  )}

                  <div className={styles.journeySteps}>
                    {exp.rounds.slice(0, 3).map((round) => (
                      <div className={styles.step} key={round.id || round.roundNumber}>
                        <span className={styles.stepDot}>0{round.roundNumber}</span>
                        <span className={styles.stepLabel}>{round.type}</span>
                        <span style={{ marginLeft: 'auto', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                          {round.durationMinutes}M
                        </span>
                      </div>
                    ))}
                    {exp.rounds.length > 3 && (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--accent)', paddingTop: '0.25rem' }}>
                        + {exp.rounds.length - 3} MORE ROUNDS
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.cardStats}>
                    {exp.student.branch || 'B.TECH CSE'} · VERIFIED
                  </div>
                  <span className={styles.readMoreBtn}>
                    READ STORY →
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}
