import Link from 'next/link'
import styles from './review.module.css'
import { prisma } from '@/lib/prisma'
import ReviewActions from './ReviewActions'

function DifficultyIndicator({ rating }: { rating: number }) {
  const diamonds = []
  for (let i = 1; i <= 5; i++) {
    diamonds.push(i <= rating ? '◆' : '◇')
  }
  return (
    <div style={{
      fontFamily: 'var(--font-mono)',
      fontSize: '0.75rem',
      color: 'var(--accent)',
      letterSpacing: '0.08em',
      textTransform: 'uppercase'
    }}>
      {diamonds.join(' ')} · LEVEL {rating} / 5
    </div>
  )
}

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Look up experience by ID or fallback to first matching or first experience
  let exp = await prisma.experience.findUnique({
    where: { id },
    include: {
      drive: { include: { company: true, campus: true } },
      student: true,
      rounds: { orderBy: { roundNumber: 'asc' } }
    }
  })

  if (!exp) {
    // If integer ID like '1' or '2' was passed in URL, grab from list
    const all = await prisma.experience.findMany({
      include: {
        drive: { include: { company: true, campus: true } },
        student: true,
        rounds: { orderBy: { roundNumber: 'asc' } }
      },
      orderBy: { submittedAt: 'desc' }
    })
    const index = parseInt(id) - 1
    if (!isNaN(index) && all[index]) {
      exp = all[index]
    } else if (all.length > 0) {
      exp = all[0]
    }
  }

  if (!exp) {
    return (
      <div className="container" style={{ padding: '3rem 0' }}>
        <h2>No experience found to review.</h2>
        <Link href="/admin/pending" className={styles.backLink}>← Back to Pending Reviews</Link>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <Link href="/admin/pending" className={styles.backLink} style={{ margin: 0 }}>
          ← Back to Reviews
        </Link>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link
            href={`/admin/experiences/${exp.id}/edit`}
            style={{
              padding: '0.45rem 0.9rem',
              background: '#ffffff',
              color: '#08090b',
              border: '1px solid #ffffff',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              textDecoration: 'none'
            }}
          >
            Edit Story Details →
          </Link>
        </div>
      </div>

      <div className={styles.reviewLayout}>
        {/* Main Content */}
        <div>
          {/* Student Identity Card */}
          <div className={styles.studentCard}>
            <div className={styles.studentCardTitle}>Student Identity (Internal Verification Only)</div>
            <div className={styles.studentGrid}>
              <div className={styles.studentField}>
                <span className={styles.fieldLabel}>Name</span>
                <span className={styles.fieldValue}>{exp.student.name}</span>
              </div>
              <div className={styles.studentField}>
                <span className={styles.fieldLabel}>Roll No.</span>
                <span className={styles.fieldValue}>{exp.student.rollNumber || 'N/A'}</span>
              </div>
              <div className={styles.studentField}>
                <span className={styles.fieldLabel}>Email</span>
                <span className={styles.fieldValue}>{exp.student.email}</span>
              </div>
              <div className={styles.studentField}>
                <span className={styles.fieldLabel}>Branch</span>
                <span className={styles.fieldValue}>{exp.student.branch || 'B.Tech CSE'}</span>
              </div>
              <div className={styles.studentField}>
                <span className={styles.fieldLabel}>Graduation</span>
                <span className={styles.fieldValue}>{exp.student.graduationYear || 2026}</span>
              </div>
              <div className={styles.studentField}>
                <span className={styles.fieldLabel}>Current Status</span>
                <span className={`badge ${exp.verificationStatus === 'VERIFIED' ? 'badge-verified' : 'badge-pending'}`}>
                  {exp.verificationStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Experience Content */}
          <div className={styles.experienceCard}>
            <div className={styles.experienceTitle}>
              {exp.drive.company.name} — {exp.drive.role}
            </div>

            <div className={styles.metaRow}>
              <div className={styles.metaChip}>CAMPUS: {exp.drive.campus.name}</div>
              <div className={styles.metaChip}>DRIVE: {exp.drive.year}</div>
              <div className={styles.metaChip}>ROUNDS: {exp.rounds.length}</div>
              <span className={`badge ${exp.result === 'Selected' ? 'badge-selected' : 'badge-not-selected'}`}>
                {exp.result}
              </span>
            </div>

            {exp.rounds.map((round) => (
              <div className={styles.roundSection} key={round.id || round.roundNumber}>
                <div className={styles.roundNumber}>Round {round.roundNumber}</div>
                <div className={styles.roundHeader}>
                  <h3 className={styles.roundType}>{round.type}</h3>
                  <DifficultyIndicator rating={round.difficulty} />
                </div>
                <div className={styles.roundMeta}>
                  <span>DURATION: {round.durationMinutes} MIN</span>
                  <span>ASSESSMENT LEVEL: {round.difficulty} / 5</span>
                </div>
                <div className={styles.topicsList}>
                  {round.topics.map((t) => (
                    <span className={styles.topicTag} key={t}>{t}</span>
                  ))}
                </div>
                <blockquote className={styles.roundDescription}>
                  {round.description}
                </blockquote>
              </div>
            ))}
          </div>
        </div>

        {/* Actions Sidebar */}
        <div className={styles.actionsSidebar}>
          <ReviewActions experienceId={exp.id} currentStatus={exp.verificationStatus} />

          <div className={styles.auditCard}>
            <div className={styles.actionsTitle}>Audit Trail</div>
            <div className={styles.auditItem}>
              <span className={styles.auditIcon}>SUBMIT</span>
              <div>
                <div className={styles.auditText}>Submitted by {exp.student.name}</div>
                <div className={styles.auditTime} suppressHydrationWarning>{new Date(exp.submittedAt).toLocaleDateString()}</div>
              </div>
            </div>
            <div className={styles.auditItem}>
              <span className={styles.auditIcon}>{exp.verificationStatus === 'VERIFIED' ? '✓ VERIFIED' : '◇ PENDING'}</span>
              <div>
                <div className={styles.auditText}>
                  {exp.verificationStatus === 'VERIFIED' ? 'Verified & Published to Public Archive' : 'Awaiting TPC roster review'}
                </div>
                <div className={styles.auditTime} suppressHydrationWarning>{exp.publishedAt ? new Date(exp.publishedAt).toLocaleDateString() : 'Pending'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
