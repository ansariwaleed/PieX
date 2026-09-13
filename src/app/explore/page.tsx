import Link from 'next/link'
import styles from './explore.module.css'
import { prisma } from '@/lib/prisma'
import { getCachedCompanies, getCachedCampuses } from '@/lib/data-cache'
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
    getCachedCompanies(),
    getCachedCampuses()
  ])

  // Check if filtering is active
  const isFiltering = Boolean(company || year || campus || result || q)
  const spotlightExp = !isFiltering && experiences.length > 0 ? experiences[0] : null
  const archiveList = spotlightExp ? experiences.slice(1) : experiences

  // If user is searching/filtering by a specific company, extract company hiring pattern intelligence
  let companyBlueprint: {
    name: string
    totalOffers: number
    offerRate: number
    uniqueCampuses: number
    avgRoundsCount: number
    topFocusAreas: string[]
  } | null = null

  if (company && experiences.length > 0) {
    const selectedCount = experiences.filter(e => e.result === 'Selected').length
    const totalOffers = experiences.length
    const offerRate = Math.round((selectedCount / totalOffers) * 100)
    const uniqueCampuses = new Set(experiences.map(e => e.drive.campus.name)).size
    const avgRoundsCount = Math.round(
      experiences.reduce((sum, e) => sum + e.rounds.length, 0) / experiences.length
    )

    const topicMap: Record<string, number> = {}
    experiences.forEach(e => {
      e.rounds.forEach(r => {
        r.topics.forEach((t: string) => {
          topicMap[t] = (topicMap[t] || 0) + 1
        })
      })
    })
    const topFocusAreas = Object.entries(topicMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name)

    companyBlueprint = {
      name: company,
      totalOffers,
      offerRate,
      uniqueCampuses,
      avgRoundsCount,
      topFocusAreas
    }
  }

  return (
    <main className="container">
      <header className={styles.pageHeader}>
        <div className={styles.kicker}>
          Placement Archives · Verified Campus Intelligence
        </div>
        <h1 className={styles.pageTitle}>Explore Campus Placement Stories</h1>
        <p className={styles.pageSubtitle}>
          Verified round-by-round interview debriefs, online assessment questions, and preparation strategies from premier institutions across India.
        </p>
      </header>

      {/* Company Hiring Pattern Blueprint when filtering by company */}
      {companyBlueprint && (
        <section className={styles.blueprintCard}>
          <div className={styles.blueprintHeader}>
            <div>
              <div className={styles.blueprintKicker}>Verified Placement Pattern</div>
              <h2 className={styles.blueprintTitle}>{companyBlueprint.name} Hiring Blueprint</h2>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Aggregated from {companyBlueprint.totalOffers} verified placement debriefs
            </div>
          </div>

          <div className={styles.blueprintGrid}>
            <div className={styles.blueprintMetric}>
              <span className={styles.blueprintLabel}>Campuses Represented</span>
              <span className={styles.blueprintValue}>{companyBlueprint.uniqueCampuses} Institutions</span>
            </div>
            <div className={styles.blueprintMetric}>
              <span className={styles.blueprintLabel}>Typical Rounds</span>
              <span className={styles.blueprintValue}>{companyBlueprint.avgRoundsCount} Interview Rounds</span>
            </div>
            <div className={styles.blueprintMetric}>
              <span className={styles.blueprintLabel}>Placement Success Rate</span>
              <span className={styles.blueprintValue} style={{ color: '#34d399' }}>{companyBlueprint.offerRate}% Selected</span>
            </div>
            <div className={styles.blueprintMetric}>
              <span className={styles.blueprintLabel}>Verification Authority</span>
              <span className={styles.blueprintValue}>TPC Accredited</span>
            </div>
          </div>

          {companyBlueprint.topFocusAreas.length > 0 && (
            <div className={styles.blueprintFocusSection}>
              <span className={styles.blueprintFocusLabel}>Most Tested Interview Topics:</span>
              {companyBlueprint.topFocusAreas.map(topic => (
                <span key={topic} className={styles.blueprintTopicTag}>
                  {topic}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Featured Spotlight Story (when not filtering) */}
      {spotlightExp && (
        <Link href={`/experiences/${spotlightExp.id}`} className={styles.spotlightCard}>
          <div>
            <div className={styles.spotlightKicker}>
              <span>Featured Interview Story</span>
              <span>·</span>
              <span>{spotlightExp.drive.campus.name}</span>
              <span>·</span>
              <span>~4 min read</span>
            </div>
            <h2 className={styles.spotlightTitle}>
              {spotlightExp.drive.company.name} — {spotlightExp.drive.role}
            </h2>
            <p className={styles.spotlightExcerpt}>
              "{spotlightExp.rounds[0]?.description?.slice(0, 220)}..."
            </p>
            <div className={styles.spotlightMeta}>
              <span>Batch of {spotlightExp.drive.year}</span>
              <span>·</span>
              <span>{spotlightExp.rounds.length} Rounds Detailed</span>
              <span>·</span>
              <span style={{ color: spotlightExp.result === 'Selected' ? '#34d399' : '#f87171' }}>
                {spotlightExp.result === 'Selected' ? '✓ Offered' : 'Not Selected'}
              </span>
            </div>
          </div>

          <div className={styles.spotlightAction}>
            Read Full Story →
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
          Showing {experiences.length} verified interview {experiences.length === 1 ? 'experience' : 'experiences'}
        </span>
      </div>

      {archiveList.length === 0 ? (
        <div style={{ padding: '4rem 0', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', color: '#ffffff' }}>No verified records found for this query</h3>
          <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
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
            const readMinutes = Math.max(2, Math.ceil(words / 180))
            const firstDescription = exp.rounds[0]?.description || ''

            return (
              <Link href={`/experiences/${exp.id}`} className={styles.card} key={exp.id}>
                <div>
                  <div className={styles.cardTop}>
                    <div>
                      <div className={styles.cardDossierIndex}>
                        Story #{idx + 1} · ~{readMinutes} min read
                      </div>
                      <h3 className={styles.companyName}>{exp.drive.company.name}</h3>
                      <div className={styles.roleName}>{exp.drive.role}</div>
                    </div>
                    <span className={`badge ${exp.result === 'Selected' ? 'badge-selected' : 'badge-not-selected'}`}>
                      {exp.result === 'Selected' ? '✓ Offered' : 'Not Selected'}
                    </span>
                  </div>

                  <div className={styles.cardMeta}>
                    <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{exp.drive.campus.name}</span>
                    <span className={styles.metaDot}>·</span>
                    <span>Class of {exp.drive.year}</span>
                    <span className={styles.metaDot}>·</span>
                    <span>{exp.rounds.length} Rounds</span>
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
                        <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {round.durationMinutes}m
                        </span>
                      </div>
                    ))}
                    {exp.rounds.length > 3 && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--accent)', paddingTop: '0.25rem' }}>
                        + {exp.rounds.length - 3} more rounds
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.cardStats}>
                    {exp.student.branch || 'B.Tech CSE'} · Verified
                  </div>
                  <span className={styles.readMoreBtn}>
                    Read Story →
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

