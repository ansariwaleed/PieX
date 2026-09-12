import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import styles from './my-submissions.module.css'

export default async function MySubmissionsPage() {
  const session = await auth()

  if (!session?.user) {
    return (
      <main className="container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ maxWidth: '480px', padding: '2rem' }}>
          <h2>Please sign in to view your submissions</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '1rem 0 1.5rem' }}>
            Track the status of your interview contributions and TPC verification badges.
          </p>
          <Link href="/login" className="btn btn-primary">Sign In →</Link>
        </div>
      </main>
    )
  }

  const experiences = await prisma.experience.findMany({
    where: {
      studentId: session.user.id
    },
    include: {
      drive: {
        include: {
          company: true,
          campus: true
        }
      },
      rounds: {
        orderBy: { roundNumber: 'asc' }
      }
    },
    orderBy: {
      submittedAt: 'desc'
    }
  })

  return (
    <main className="container" style={{ padding: '3.5rem 0' }}>
      <div className={styles.header}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            STUDENT DASHBOARD // MY EXPERIENCES
          </div>
          <h1 className={styles.title}>My Interview Submissions</h1>
          <p className={styles.subtitle}>
            Tracking contributions and official verification status for {session.user.name}
          </p>
        </div>
        <Link href="/submit" className="btn btn-primary">
          + Share Another Experience
        </Link>
      </div>

      {experiences.length === 0 ? (
        <div className={styles.emptyCard}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '1rem' }}>
            [NO ARCHIVED SUBMISSIONS FOUND]
          </div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', color: '#ffffff' }}>No experiences shared yet</h3>
          <p style={{ color: 'var(--text-secondary)', margin: '0.75rem auto 2rem', maxWidth: '440px', fontSize: '0.9rem' }}>
            You haven't submitted any interview journey records. Help batchmates and juniors by sharing what you faced during campus placements!
          </p>
          <Link href="/submit" className="btn btn-primary">
            Submit Your Placement Journey →
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {experiences.map((exp) => (
            <div key={exp.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div>
                  <h3 className={styles.companyName}>{exp.drive.company.name}</h3>
                  <div className={styles.roleName}>{exp.drive.role} · {exp.drive.campus.name} ({exp.drive.year})</div>
                </div>
                <div>
                  {exp.verificationStatus === 'VERIFIED' ? (
                    <span className="badge badge-verified">• TPC VERIFIED</span>
                  ) : exp.verificationStatus === 'REJECTED' ? (
                    <span className="badge badge-not-selected">• REJECTED</span>
                  ) : (
                    <span className="badge badge-pending">• IN TPC REVIEW</span>
                  )}
                </div>
              </div>

              <div className={styles.roundsRow}>
                {exp.rounds.map((r) => (
                  <span key={r.id} className={styles.roundChip}>
                    ROUND 0{r.roundNumber} // {r.type}
                  </span>
                ))}
              </div>

              <div className={styles.cardFooter}>
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  RECORDED ON {new Date(exp.submittedAt).toLocaleDateString()}
                </span>
                {exp.verificationStatus === 'VERIFIED' && (
                  <Link href={`/experiences/${exp.id}`} className={styles.viewLink}>
                    View Live in Archive →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
