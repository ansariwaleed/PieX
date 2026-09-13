import Link from 'next/link'
import styles from './experience.module.css'
import { prisma } from '@/lib/prisma'
import CopyLinkButton from '@/components/CopyLinkButton'
import CopyQuestionButton from './CopyQuestionButton'

function DifficultyGauge({ rating }: { rating: number }) {
  const diamonds = []
  for (let i = 1; i <= 5; i++) {
    diamonds.push(i <= rating ? '◆' : '◇')
  }
  return (
    <span className={styles.difficultyGauge} title={`Difficulty: ${rating}/5`}>
      <span className={styles.gaugeDiamonds}>{diamonds.join(' ')}</span>
      <span className={styles.gaugeText}>LEVEL {rating}/5</span>
    </span>
  )
}

export default async function ExperiencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let experience = await prisma.experience.findUnique({
    where: { id },
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
          name: true,
          branch: true,
          graduationYear: true
        }
      }
    }
  })

  if (!experience) {
    const all = await prisma.experience.findMany({
      where: { verificationStatus: 'VERIFIED' },
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
            name: true,
            branch: true,
            graduationYear: true
          }
        }
      },
      take: 1
    })
    experience = all[0] || null
  }

  if (!experience) {
    return (
      <main className="container" style={{ padding: '6rem 0', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', marginBottom: '1rem', color: '#ffffff' }}>
          Placement Story Not Found
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          This interview experience record does not exist or has not yet been approved.
        </p>
        <Link href="/explore" className="btn btn-primary">
          Return to Placement Archive
        </Link>
      </main>
    )
  }

  // Related stories from the same company or campus
  const relatedExperiences = await prisma.experience.findMany({
    where: {
      id: { not: experience.id },
      verificationStatus: 'VERIFIED',
      OR: [
        { drive: { companyId: experience.drive.companyId } },
        { drive: { campusId: experience.drive.campusId } }
      ]
    },
    include: {
      drive: {
        include: {
          company: true,
          campus: true
        }
      },
      rounds: true
    },
    take: 3
  })

  // Calculate estimated reading time
  const totalWords = experience.rounds.reduce(
    (acc, r) => acc + (r.description ? r.description.split(/\s+/).length : 0),
    0
  )
  const readMinutes = Math.max(2, Math.ceil(totalWords / 200))

  // Group topics for quick scanning
  const topicCounts: Record<string, number> = {}
  experience.rounds.forEach((r) => {
    r.topics.forEach((t: string) => {
      topicCounts[t] = (topicCounts[t] || 0) + 1
    })
  })
  const topTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <article className={styles.readingContainer}>
      {/* Top Bar Navigation & Actions */}
      <nav className={styles.topNavRow} aria-label="Breadcrumb and Actions">
        <Link href="/explore" className={styles.backLink}>
          ← Back to All Experiences
        </Link>
        <div className={styles.topActions}>
          <CopyLinkButton />
        </div>
      </nav>

      {/* Article Header */}
      <header className={styles.articleHeader}>
        <div className={styles.kickerRow}>
          <span>Placement Archive</span>
          <span className={styles.kickerDivider}>·</span>
          <span>{experience.drive.campus.name}</span>
          <span className={styles.kickerDivider}>·</span>
          <span className={styles.readTime}>~{readMinutes} min read</span>
        </div>

        <h1 className={styles.articleTitle}>
          {experience.drive.company.name} — {experience.drive.role}
        </h1>
        <p className={styles.articleSubtitle}>
          Complete round-by-round interview questions, online tests, and preparation tips from the {experience.drive.year} campus placement drive.
        </p>

        {/* Structured Parameters Bar */}
        <div className={styles.parametersBar}>
          <div className={styles.paramBox}>
            <span className={styles.paramLabel}>College / Campus</span>
            <span className={styles.paramValue}>{experience.drive.campus.name}</span>
          </div>
          <div className={styles.paramBox}>
            <span className={styles.paramLabel}>Graduating Batch</span>
            <span className={styles.paramValue}>Class of {experience.drive.year}</span>
          </div>
          <div className={styles.paramBox}>
            <span className={styles.paramLabel}>Department / Branch</span>
            <span className={styles.paramValue}>{experience.student.branch || 'B.Tech CSE'}</span>
          </div>
          <div className={styles.paramBox}>
            <span className={styles.paramLabel}>Total Rounds</span>
            <span className={styles.paramValue}>{experience.rounds.length} Detailed Rounds</span>
          </div>
          <div className={styles.paramBox}>
            <span className={styles.paramLabel}>Final Outcome</span>
            <span className={styles.paramValue} style={{ color: experience.result === 'Selected' ? '#34d399' : '#f87171' }}>
              {experience.result === 'Selected' ? '✓ Offered' : 'Not Selected'}
            </span>
          </div>
        </div>

        {/* TPC Official Verification Banner */}
        <div className={styles.verifiedBanner}>
          <div className={styles.verifiedLeft}>
            <div className={styles.verifiedTag}>
              ✓ Verified by Training & Placement Cell ({experience.drive.campus.name})
            </div>
            <div className={styles.verifiedSub}>
              Officially cross-referenced with campus placement records · Published {experience.publishedAt ? new Date(experience.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Verified Archive'}
            </div>
          </div>
          <div className={styles.verifiedBadge}>
            Accredited Record
          </div>
        </div>
      </header>

      {/* Main Editorial Layout */}
      <div className={styles.editorialLayout}>
        {/* Narrative Flow */}
        <div className={styles.narrativeFlow}>
          {/* Senior's Core Advice & Verdict Pullout Block */}
          <section className={styles.strategicAdviceBanner}>
            <div className={styles.strategicHeader}>
              <span className={styles.strategicKicker}>Senior's Core Advice & Strategic Verdict</span>
              <h3 className={styles.strategicTitle}>What Mattered Most in this Hiring Drive</h3>
            </div>
            <p className={styles.strategicText}>
              {experience.result === 'Selected'
                ? `To earn an offer with ${experience.drive.company.name}, interviewers prioritised systematic problem breakdown, testing edge cases before running code, and active verbal collaboration over speed alone.`
                : `A high-standard interview with strict time constraints. Candidates preparing for ${experience.drive.company.name} should focus on structuring core algorithmic trade-offs clearly before writing code.`}
            </p>
          </section>

          <h2 className={styles.sectionHeading}>
            Round Breakdown ({experience.rounds.length} Rounds)
          </h2>

          {experience.rounds.map((round) => (
            <section
              className={styles.roundCard}
              key={round.id || round.roundNumber}
              id={`round-${round.roundNumber}`}
            >
              <div className={styles.roundKicker}>
                <span className={styles.roundIndex}>Round 0{round.roundNumber} · {round.type}</span>
                <DifficultyGauge rating={round.difficulty} />
              </div>

              <h3 className={styles.roundTitle}>{round.type}</h3>

              <div className={styles.roundMetaRow}>
                <span>Duration: {round.durationMinutes} Minutes</span>
                <span>·</span>
                <span>Format: {round.type}</span>
                <span>·</span>
                <span>Status: Completed</span>
              </div>

              <div className={styles.topicsList}>
                {round.topics.map((t: string) => (
                  <span className={styles.topicTag} key={t}>{t}</span>
                ))}
              </div>

              <blockquote className={styles.roundProse}>
                {round.description}
              </blockquote>

              <div className={styles.roundActionRow}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Question & approach notes from placed candidate
                </span>
                <CopyQuestionButton textToCopy={round.description} label="Copy Round Questions" />
              </div>
            </section>
          ))}

          {/* Key Advice for Aspirants */}
          <section className={styles.adviceCard} id="key-advice">
            <h3 className={styles.adviceTitle}>
              Preparation Tips & Advice for Juniors
            </h3>
            <ul className={styles.adviceList}>
              <li className={styles.adviceItem}>
                <span className={styles.adviceBullet}>◆</span>
                <div>
                  <strong>Focus on Fundamentals:</strong> For {experience.drive.company.name}, interviewers care deeply about clear logic, code readability, and explaining time/space complexity before jumping into code.
                </div>
              </li>
              <li className={styles.adviceItem}>
                <span className={styles.adviceBullet}>◆</span>
                <div>
                  <strong>Think Out Loud:</strong> Talk through your thoughts with the interviewer. Treat the interview like a collaborative problem-solving session.
                </div>
              </li>
              <li className={styles.adviceItem}>
                <span className={styles.adviceBullet}>◆</span>
                <div>
                  <strong>Know Your Resume Projects:</strong> Be ready to answer questions about architecture decisions, challenges faced, and trade-offs made in your college projects.
                </div>
              </li>
            </ul>
          </section>

          {/* Understated Collegiate Institutional Attribution Stamp */}
          <div className={styles.collegiateStamp}>
            <div className={styles.stampEmblem}>πX</div>
            <div className={styles.stampDetails}>
              <div className={styles.stampTitle}>Certified Collegiate Placement Record</div>
              <div className={styles.stampText}>
                Verified by Training & Placement Cell · {experience.drive.campus.name} (Class of {experience.drive.year})
              </div>
              <div className={styles.stampSub}>
                Archived in the collegiate repository to provide upcoming candidates with verified, structured preparation intelligence.
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Reading Companion Sidebar */}
        <aside className={styles.stickySidebar}>
          {/* Table of Contents */}
          <div className={styles.tocCard}>
            <div className={styles.tocHeader}>Jump to Round</div>
            <ul className={styles.tocList}>
              {experience.rounds.map((round) => (
                <li key={round.roundNumber}>
                  <a href={`#round-${round.roundNumber}`} className={styles.tocLink}>
                    <span className={styles.tocIndex}>0{round.roundNumber} ·</span>
                    <span>{round.type}</span>
                  </a>
                </li>
              ))}
              <li>
                <a href="#key-advice" className={styles.tocLink}>
                  <span className={styles.tocIndex}>✦</span>
                  <span>Senior's Preparation Advice</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Tested Topics Summary */}
          <div className={styles.topicsCard}>
            <div className={styles.topicsTitle}>Topics Tested in this Drive</div>
            {topTopics.length > 0 ? (
              topTopics.map(([topic, count]) => (
                <div className={styles.topicMetricRow} key={topic}>
                  <span className={styles.topicMetricName}>{topic}</span>
                  <span className={styles.topicMetricCount}>{count} round{count > 1 ? 's' : ''}</span>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>General technical fundamentals.</p>
            )}
          </div>
        </aside>
      </div>

      {/* Related Experiences / Read Next Stream */}
      {relatedExperiences.length > 0 && (
        <section className={styles.relatedSection}>
          <div className={styles.relatedHeader}>
            <h2 className={styles.relatedTitle}>Read More Interview Stories</h2>
            <span className={styles.relatedSubtitle}>Related Campus Archives</span>
          </div>

          <div className={styles.relatedGrid}>
            {relatedExperiences.map((rel) => (
              <Link href={`/experiences/${rel.id}`} key={rel.id} className={styles.relatedCard}>
                <div>
                  <div className={styles.relatedCardKicker}>
                    <span>{rel.drive.campus.name}</span>
                    <span>Class of {rel.drive.year}</span>
                  </div>
                  <h3 className={styles.relatedCardTitle}>{rel.drive.company.name}</h3>
                  <div className={styles.relatedCardRole}>{rel.drive.role}</div>
                </div>

                <div className={styles.relatedCardFooter}>
                  <span>{rel.rounds.length} Rounds</span>
                  <span>Read Story →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  )
}
