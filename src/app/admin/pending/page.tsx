import Link from 'next/link'
import styles from '../admin.module.css'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export default async function PendingPage({
  searchParams
}: {
  searchParams?: Promise<{ campusId?: string }>
}) {
  const session = await auth()
  const role = (session?.user as any)?.role
  const resolvedParams = searchParams ? await searchParams : {}
  const requestedCampusId = resolvedParams?.campusId

  let activeCampusId = requestedCampusId

  if (role === 'TPC_ADMIN') {
    const dbUser = await prisma.user.findUnique({
      where: { id: session?.user?.id }
    })
    activeCampusId = dbUser?.campusId || activeCampusId
  }

  const driveCampusFilter = activeCampusId ? { drive: { campusId: activeCampusId } } : {}

  const pendingExperiences = await prisma.experience.findMany({
    where: {
      verificationStatus: 'PENDING',
      ...driveCampusFilter
    },
    include: {
      student: true,
      drive: {
        include: {
          company: true,
          campus: true
        }
      },
      rounds: true
    },
    orderBy: {
      submittedAt: 'desc'
    }
  })

  return (
    <>
      <h1 className={styles.pageTitle}>Pending Reviews</h1>
      <p className={styles.pageSubtitle}>{pendingExperiences.length} experiences waiting for TPC verification</p>

      {pendingExperiences.length === 0 ? (
        <div style={{ padding: '3rem 0', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
          ✓ No pending submissions for this placement cell. All experiences are reviewed!
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Student</th>
              <th>Roll No.</th>
              <th>Campus</th>
              <th>Company</th>
              <th>Role</th>
              <th>Rounds</th>
              <th>Result</th>
              <th>Status</th>
              <th>Submitted</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pendingExperiences.map((item) => (
              <tr key={item.id}>
                <td className={styles.studentName}>{item.student.name}</td>
                <td>{item.student.rollNumber || 'N/A'}</td>
                <td>{item.drive.campus.name}</td>
                <td>{item.drive.company.name}</td>
                <td>{item.drive.role}</td>
                <td>{item.rounds.length}</td>
                <td>
                  <span className={`badge ${item.result === 'Selected' ? 'badge-selected' : 'badge-not-selected'}`}>
                    {item.result}
                  </span>
                </td>
                <td>
                  <span className={styles.statusPending}>
                    ◇ PENDING REVIEW
                  </span>
                </td>
                <td suppressHydrationWarning>{new Date(item.submittedAt).toLocaleDateString()}</td>
                <td>
                  <Link href={`/admin/review/${item.id}`} className={styles.actionBtn}>
                    Review →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
