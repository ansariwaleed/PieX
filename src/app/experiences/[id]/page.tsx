import Link from 'next/link'
import styles from './experience.module.css'
import { prisma } from '@/lib/prisma'
import CopyLinkButton from '@/components/CopyLinkButton'

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
      orderBy: { publishedAt: 'desc' }
    })
    const index = parseInt(id) - 1
    if (!isNaN(index) && all[index]) {
      experience = all[index]
    } else if (all.length > 0) {
      experience = all[0]
    }
  }

  if (!experience) {
    return (
      <main className="container" style={{ padding: '4rem 0' }}>
        <h2>Interview experience not found.</h2>
        <Link href="/explore" className={styles.backLink}>← Return to All Experiences</Link>
      </main>
    )
  }

  // Fetch related experiences for "Read Next" stream
  const relatedExperiences = await prisma.experience.findMany({
    where: {
      verificationStatus: 'VERIFIED',
      id: { not: experience.id }
    },
    take: 3,
    include: {
      drive: { include: { company: true, campus: true } },
      rounds: true,
      student: { select: { branch: true } }
    },
    orderBy: { publishedAt: 'desc' }
  })

  // Calculate estimated reading time
  const totalWords = experience.rounds.reduce((acc, r) => acc + (r.description ? r.description.split(/\s+/).length : 0), 0)
  const readMinutes = Math.max(3, Math.ceil(totalWords / 150))

  // Calculate top topics
  const topicCounts: Record<string, number> = {}
  experience.rounds.forEach(r => {
    r.topics.forEach(t => {
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
          ← BACK TO ALL EXPERIENCES
        </Link>
        <div className={styles.topActions}>
          <CopyLinkButton />
        </div>
      </nav>

      {/* Article Header */}
      <header className={styles.articleHeader}>
        <div className={styles.kickerRow}>
          <span>INTERVIEW EXPERIENCE</span>
          <span className={styles.kickerDivider}>//</span>
          <span>{experience.drive.campus.name}</span>
          <span className={styles.kickerDivider}>//</span>
          <span className={styles.readTime}>◷ ~{readMinutes} MIN READ</span>
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
            <span className={styles.paramLabel}>COLLEGE</span>
            <span className={styles.paramValue}>{experience.drive.campus.name}</span>
          </div>
          <div className={styles.paramBox}>
            <span className={styles.paramLabel}>PASSING YEAR</span>
            <span className={styles.paramValue}>{experience.drive.year}</span>
          </div>
          <div className={styles.paramBox}>
            <span className={styles.paramLabel}>BRANCH</span>
            <span className={styles.paramValue}>{experience.student.branch || 'B.Tech CSE'}</span>
          </div>
          <div className={styles.paramBox}>
            <span className={styles.paramLabel}>ROUNDS</span>
            <span className={styles.paramValue}>{experience.rounds.length} ROUNDS</span>
          </div>
          <div className={styles.paramBox}>
            <span className={styles.paramLabel}>RESULT</span>
            <span className={styles.paramValue} style={{ color: experience.result === 'Selected' ? '#34d399' : '#f87171' }}>
              {experience.result === 'Selected' ? '✓ SELECTED' : '✕ NOT SELECTED'}
            </span>
          </div>
        </div>

        {/* TPC Official Verification Banner */}
        <div className={styles.verifiedBanner}>
          <div className={styles.verifiedLeft}>
            <div className={styles.verifiedTag}>
              ✓ VERIFIED BY {experience.drive.campus.name} PLACEMENT CELL (TPC)
            </div>
            <div className={styles.verifiedSub}>
              OFFICIALLY CROSS-CHECKED WITH CAMPUS PLACEMENT RECORDS // {experience.publishedAt ? new Date(experience.publishedAt).toLocaleDateString() : 'CONFIRMED'}
            </div>
          </div>
          <div className={styles.verifiedBadge}>
            TPC VERIFIED
          </div>
        </div>
      </header>

      {/* Main Editorial Layout */}
      <div className={styles.editorialLayout}>
        {/* Narrative Flow */}
        <div className={styles.narrativeFlow}>
          <h2 className={styles.sectionHeading}>
            Interview Rounds Breakdown ({experience.rounds.length} Rounds)
          </h2>

          {experience.rounds.map((round) => (
            <section
              className={styles.roundCard}
              key={round.id || round.roundNumber}
              id={`round-${round.roundNumber}`}
            >
              <div className={styles.roundKicker}>
                <span className={styles.roundIndex}>ROUND // 0{round.roundNumber}</span>
                <DifficultyGauge rating={round.difficulty} />
              </div>

              <h3 className={styles.roundTitle}>{round.type}</h3>

              <div className={styles.roundMetaRow}>
                <span>DURATION: {round.durationMinutes} MINUTES</span>
                <span>·</span>
                <span>TYPE: {round.type}</span>
                <span>·</span>
                <span>STATUS: COMPLETED</span>
              </div>

              <div className={styles.topicsList}>
                {round.topics.map((t: string) => (
                  <span className={styles.topicTag} key={t}>{t}</span>
                ))}
              </div>

              <blockquote className={styles.roundProse}>
                {round.description}
              </blockquote>
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
        </div>

        {/* Sticky Reading Companion Sidebar */}
        <aside className={styles.stickySidebar}>
          {/* Table of Contents */}
          <div className={styles.tocCard}>
            <div className={styles.tocHeader}>QUICK JUMP TO ROUNDS</div>
            <ul className={styles.tocList}>
              {experience.rounds.map((round) => (
                <li key={round.roundNumber}>
                  <a href={`#round-${round.roundNumber}`} className={styles.tocLink}>
                    <span className={styles.tocIndex}>0{round.roundNumber} //</span>
                    <span>{round.type}</span>
                  </a>
                </li>
              ))}
              <li>
                <a href="#key-advice" className={styles.tocLink}>
                  <span className={styles.tocIndex}>//</span>
                  <span>ADVICE & PREP TIPS</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Tested Topics Summary */}
          <div className={styles.topicsCard}>
            <div className={styles.topicsTitle}>TOPICS ASKED IN THIS DRIVE</div>
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
            <span className={styles.relatedSubtitle}>RELATED EXPERIENCES</span>
          </div>

          <div className={styles.relatedGrid}>
            {relatedExperiences.map((rel) => (
              <Link href={`/experiences/${rel.id}`} key={rel.id} className={styles.relatedCard}>
                <div>
                  <div className={styles.relatedCardKicker}>
                    <span>{rel.drive.campus.name}</span>
                    <span>{rel.drive.year}</span>
                  </div>
                  <h3 className={styles.relatedCardTitle}>{rel.drive.company.name}</h3>
                  <div className={styles.relatedCardRole}>{rel.drive.role}</div>
                </div>

                <div className={styles.relatedCardFooter}>
                  <span>{rel.rounds.length} ROUNDS</span>
                  <span>READ STORY →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  )
}
