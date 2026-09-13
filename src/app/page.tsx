import styles from './page.module.css'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export default async function Home() {
  const [expCount, companyCount, campusCount, companies, recentExperiences] = await Promise.all([
    prisma.experience.count({ where: { verificationStatus: 'VERIFIED' } }),
    prisma.company.count(),
    prisma.campus.count(),
    prisma.company.findMany({ take: 6, orderBy: { name: 'asc' } }),
    prisma.experience.findMany({
      where: { verificationStatus: 'VERIFIED' },
      take: 6,
      include: {
        drive: {
          include: {
            company: true,
            campus: true,
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
    })
  ])

  return (
    <main>
      {/* ——— Editorial Hero ——— */}
      <section className={styles.hero}>
        <div className={styles.heroGrid} />
        <div className={`container ${styles.heroContent}`}>
          <div className={styles.eyebrow}>
            PieX · Verified Campus Placement Intelligence
          </div>
          <h1 className={styles.title}>
            Real interview experiences from students who <em>got placed</em>.
          </h1>
          <p className={styles.subtitle}>
            Read genuine round-by-round interview questions, coding tests, and preparation tips shared by seniors — verified directly by college placement cells (TPC).
          </p>

          <form action="/explore" method="GET" className={styles.searchContainer}>
            <span className={styles.searchIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              name="company"
              placeholder="Search companies, roles, or topics..."
              className={styles.searchInput}
              id="hero-search"
            />
            <button type="submit" className={styles.searchBtn}>
              Explore Stories →
            </button>
          </form>

          <div className={styles.tags}>
            <span className={styles.tagLabel}>Popular:</span>
            {companies.map((c) => (
              <Link href={`/explore?company=${encodeURIComponent(c.name)}`} key={c.id} className={styles.tag}>
                {c.name}
              </Link>
            ))}
            <Link href="/explore?q=system+design" className={styles.tag}>
              System Design
            </Link>
          </div>
        </div>
      </section>

      {/* ——— Architectural Metrics Grid ——— */}
      <div className="container">
        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>{expCount > 0 ? `${expCount}` : '0'}</div>
            <div className={styles.statLabel}>Verified Student Stories</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>{companyCount}</div>
            <div className={styles.statLabel}>Companies Hiring</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>{campusCount}</div>
            <div className={styles.statLabel}>Colleges & Campuses</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>100%</div>
            <div className={styles.statLabel}>TPC Verified Records</div>
          </div>
        </div>

        {/* ——— Recent Stories Section ——— */}
        <div className={styles.sectionHeader}>
          <div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Curated Placement Archives
            </div>
            <h2 className={styles.sectionTitle}>Featured Placement Stories</h2>
          </div>
          <Link href="/explore" className={styles.sectionLink}>
            View All Experiences →
          </Link>
        </div>

        <div className={styles.grid}>
          {recentExperiences.map((exp, idx) => {
            const words = exp.rounds.reduce((acc, r) => acc + (r.description ? r.description.split(/\s+/).length : 0), 0)
            const readMinutes = Math.max(3, Math.ceil(words / 150))
            const firstRound = exp.rounds[0]

            return (
              <Link href={`/experiences/${exp.id}`} className="card" key={exp.id}>
                <div className={styles.cardTop}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.72rem', color: 'var(--accent)', letterSpacing: '0.04em', marginBottom: '0.25rem', fontWeight: 500 }}>
                      Story #{idx + 1} · {readMinutes} min read
                    </div>
                    <h3 className={styles.companyName}>{exp.drive.company.name}</h3>
                    <div className={styles.roleName}>{exp.drive.role}</div>
                  </div>
                  <span className={`badge ${exp.result === 'Selected' ? 'badge-selected' : 'badge-not-selected'}`}>
                    {exp.result === 'Selected' ? 'Selected' : 'Interviewed'}
                  </span>
                </div>

                <div className={styles.cardMeta}>
                  <span>{exp.drive.campus.name}</span>
                  <span className={styles.metaDot}>·</span>
                  <span>Batch of {exp.drive.year}</span>
                  <span className={styles.metaDot}>·</span>
                  <span>{exp.rounds.length} Rounds</span>
                </div>

                {firstRound?.description && (
                  <p style={{
                    fontSize: '0.875rem',
                    lineHeight: '1.65',
                    color: 'var(--text-secondary)',
                    marginBottom: '1.25rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    fontStyle: 'italic'
                  }}>
                    "{firstRound.description.slice(0, 130)}..."
                  </p>
                )}

                <div className={styles.journeySteps}>
                  {exp.rounds.slice(0, 3).map((round) => (
                    <div className={styles.step} key={round.id || round.roundNumber}>
                      <span className={styles.stepIndex}>Round {round.roundNumber}</span>
                      <span className={styles.stepLabel}>{round.type}</span>
                      <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {round.durationMinutes}m
                      </span>
                    </div>
                  ))}
                  {exp.rounds.length > 3 && (
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--accent)', paddingTop: '0.2rem' }}>
                      + {exp.rounds.length - 3} more rounds
                    </div>
                  )}
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.cardStats}>
                    {exp.student.branch || 'B.Tech CSE'} · TPC Verified
                  </div>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>
                    Read Experience →
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </main>
  )
}
