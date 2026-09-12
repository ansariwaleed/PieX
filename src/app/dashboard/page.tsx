import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import styles from './dashboard.module.css'

export default async function StudentDashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const role = (session.user as any)?.role

  // If TPC Admin or Super Admin accidentally visits student dashboard, redirect to their console
  if (role === 'TPC_ADMIN') {
    redirect('/admin')
  } else if (role === 'SUPER_ADMIN') {
    redirect('/super-admin')
  }

  // Fetch student details and their assigned campus
  const student = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      campus: {
        include: {
          drives: {
            include: {
              company: true,
              experiences: {
                where: { verificationStatus: 'VERIFIED' },
                include: { rounds: true, student: true }
              }
            }
          }
        }
      },
      experiences: {
        include: {
          drive: { include: { company: true } }
        }
      }
    }
  })

  const campus = student?.campus
  const campusName = campus?.name || 'Your Campus'
  const drives = campus?.drives || []

  // Extract all verified experiences from this student's campus
  const campusVerifiedExperiences = drives.flatMap(d =>
    d.experiences.map(e => ({
      ...e,
      companyName: d.company.name,
      role: d.role,
      year: d.year
    }))
  ).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())

  // Distinct campus companies
  const companyMap = new Map<string, { name: string; drivesCount: number; selectionsCount: number }>()
  drives.forEach(d => {
    const name = d.company.name
    const current = companyMap.get(name) || { name, drivesCount: 0, selectionsCount: 0 }
    current.drivesCount += 1
    current.selectionsCount += d.experiences.filter(e => e.result === 'Selected').length
    companyMap.set(name, current)
  })
  const topCompanies = Array.from(companyMap.values())

  // Calculate campus stats
  const totalVerifiedStories = campusVerifiedExperiences.length
  const selectedStories = campusVerifiedExperiences.filter(e => e.result === 'Selected').length
  const selectionRate = totalVerifiedStories > 0 ? Math.round((selectedStories / totalVerifiedStories) * 100) : 0
  const mySubmissionsCount = student?.experiences.length || 0

  return (
    <div className="container" style={{ padding: '2.5rem 0 5rem' }}>
      {/* Student Welcome Hero */}
      <div className={styles.heroBox}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          <div>
            <div className={styles.kicker}>
              CAMPUS PLACEMENT HUB // {campusName.toUpperCase()}
            </div>
            <h1 className={styles.heroTitle}>
              Welcome back, {student?.name?.split(' ')[0] || 'Scholar'}
            </h1>
            <p className={styles.heroSubtitle}>
              {campusName} Class of {student?.graduationYear || 2026} · {student?.branch || 'Engineering'} · Verified Placement Archive
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link href="/submit" className={styles.submitBtn}>
              + Submit Your Experience →
            </Link>
            <Link href="/explore" className={styles.exploreBtn}>
              Explore All Drives Across India →
            </Link>
          </div>
        </div>
      </div>

      {/* Campus Placement Metrics */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statTag}>[CAMPUS STORIES]</div>
          <div className={styles.statValue}>{totalVerifiedStories}</div>
          <div className={styles.statLabel}>Senior Stories from {campusName}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTag}>[VISITING COMPANIES]</div>
          <div className={styles.statValue}>{topCompanies.length}</div>
          <div className={styles.statLabel}>Recruiting Partners at {campusName}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTag}>[SELECTION RATE]</div>
          <div className={styles.statValue}>{selectionRate}%</div>
          <div className={styles.statLabel}>Offer Rate in Verified Drives</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTag}>[MY SUBMISSIONS]</div>
          <div className={styles.statValue}>{mySubmissionsCount}</div>
          <div className={styles.statLabel}>Stories Submitted by You</div>
        </div>
      </div>

      {/* Global Explore Callout */}
      <div className={styles.exploreBanner}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            PAN-INDIA PLACEMENT INTELLIGENCE
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.45rem', fontWeight: 600, color: '#ffffff', margin: '0.25rem 0' }}>
            Looking for interview experiences beyond {campusName}?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            Read real questions, online assessment tests, and technical interview breakdowns from IIT Delhi, BITS Pilani, NIT Trichy, IIT Bombay, and more.
          </p>
        </div>
        <Link href="/explore" className={styles.exploreBannerBtn}>
          Browse Pan-India Archive →
        </Link>
      </div>

      {/* Top Recruiting Companies on Campus */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Recruiting Partners at {campusName}</h2>
            <p className={styles.sectionSubtitle}>Top corporate partners actively hiring from your college</p>
          </div>
        </div>

        {topCompanies.length === 0 ? (
          <div className={styles.emptyCard}>
            No company placement drives logged for {campusName} yet.
          </div>
        ) : (
          <div className={styles.companyGrid}>
            {topCompanies.map((c) => (
              <div key={c.name} className={styles.companyCard}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--accent)', textTransform: 'uppercase' }}>
                  {c.drivesCount} Active Drive{c.drivesCount > 1 ? 's' : ''}
                </div>
                <h3 className={styles.companyCardTitle}>{c.name}</h3>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {c.selectionsCount} Verified Offer{c.selectionsCount !== 1 ? 's' : ''} Logged
                </div>
                <Link
                  href={`/explore?company=${encodeURIComponent(c.name)}`}
                  className={styles.companyLink}
                >
                  Read {c.name} Experiences →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verified Placement Stories from this Campus */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Placement Experiences from {campusName} Seniors</h2>
            <p className={styles.sectionSubtitle}>Real round-by-round interview debriefs from your college alumni and peers</p>
          </div>
          <Link href="/explore" className={styles.viewAllLink}>
            View All ({totalVerifiedStories}) Stories →
          </Link>
        </div>

        {campusVerifiedExperiences.length === 0 ? (
          <div className={styles.emptyCard}>
            No verified placement stories logged from {campusName} yet. Be the first senior to share your experience!
            <div style={{ marginTop: '1rem' }}>
              <Link href="/submit" className="btn btn-primary" style={{ fontSize: '0.75rem' }}>
                + Share Your Interview Story →
              </Link>
            </div>
          </div>
        ) : (
          <div className={styles.storiesGrid}>
            {campusVerifiedExperiences.slice(0, 6).map((item) => (
              <div key={item.id} className={styles.storyCard}>
                <div className={styles.storyHeader}>
                  <div>
                    <span className={styles.companyBadge}>{item.companyName}</span>
                    <h3 className={styles.storyRole}>{item.role}</h3>
                  </div>
                  <span className={`badge ${item.result === 'Selected' ? 'badge-selected' : 'badge-not-selected'}`}>
                    {item.result === 'Selected' ? '✓ SELECTED' : '✕ NOT SELECTED'}
                  </span>
                </div>

                <div className={styles.storyMeta}>
                  <span>BATCH: {item.year}</span>
                  <span>{item.rounds.length} ROUNDS</span>
                  <span>{item.isAnonymous ? 'ANONYMOUS SENIOR' : item.student.name}</span>
                </div>

                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', margin: '0.85rem 0' }}>
                  {item.rounds.slice(0, 3).map((r, idx) => (
                    <span key={idx} style={{
                      padding: '0.2rem 0.45rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.65rem',
                      color: 'var(--text-muted)'
                    }}>
                      R{r.roundNumber}: {r.type}
                    </span>
                  ))}
                </div>

                <Link href={`/experiences/${item.id}`} className={styles.readStoryBtn}>
                  Read Full Interview Breakdown →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
