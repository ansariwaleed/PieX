import Link from 'next/link'
import styles from './super-admin.module.css'
import { prisma } from '@/lib/prisma'

export default async function SuperAdminDashboard() {
  const [
    totalStudents,
    totalTpcAdmins,
    pendingTpcRequests,
    pendingResetRequests,
    totalCampuses,
    totalExperiences,
    recentTpc,
    recentStudents,
    campuses
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.user.count({ where: { role: 'TPC_ADMIN' } }),
    prisma.user.count({ where: { role: 'TPC_ADMIN', verificationStatus: 'PENDING' } }),
    prisma.passwordResetRequest.count({ where: { status: 'PENDING' } }),
    prisma.campus.count(),
    prisma.experience.count(),
    prisma.user.findMany({
      where: { role: 'TPC_ADMIN' },
      include: { campus: true },
      take: 5,
      orderBy: [
        { verificationStatus: 'asc' },
        { name: 'asc' }
      ]
    }),
    prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: { campus: true, experiences: { select: { id: true } } },
      take: 5,
      orderBy: { name: 'asc' }
    }),
    prisma.campus.findMany({
      include: {
        users: { select: { role: true } },
        drives: { select: { id: true } }
      }
    })
  ])

  return (
    <>
      <div className={styles.pageHeader}>
        <div className={styles.kicker}>PLATFORM OVERVIEW</div>
        <h1 className={styles.pageTitle}>System Administration Console</h1>
        <p className={styles.pageSubtitle}>
          Central oversight of all college campuses, Training & Placement Cell officers, and registered students across India.
        </p>
      </div>

      {/* Pending Password Reset Banner */}
      {pendingResetRequests > 0 && (
        <div style={{
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          background: 'rgba(234, 179, 8, 0.08)',
          border: '1px solid rgba(234, 179, 8, 0.4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#eab308',
              letterSpacing: '0.08em',
              marginBottom: '0.25rem'
            }}>
              ACTION REQUIRED // PASSWORD RESET REQUESTS
            </div>
            <div style={{ color: '#ffffff', fontSize: '0.9rem', fontWeight: 500 }}>
              There {pendingResetRequests === 1 ? 'is' : 'are'} <strong>{pendingResetRequests}</strong> pending password reset request(s) awaiting administrative review.
            </div>
          </div>
          <Link
            href="/super-admin/resets"
            style={{
              padding: '0.65rem 1.25rem',
              background: '#eab308',
              color: '#08090b',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              textDecoration: 'none'
            }}
          >
            Review Reset Requests →
          </Link>
        </div>
      )}

      {/* Pending TPC Approval Banner */}
      {pendingTpcRequests > 0 && (
        <div style={{
          padding: '1.25rem 1.5rem',
          marginBottom: '2.5rem',
          background: 'rgba(234, 179, 8, 0.08)',
          border: '1px solid rgba(234, 179, 8, 0.4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#eab308',
              letterSpacing: '0.08em',
              marginBottom: '0.25rem'
            }}>
              ◇ ACTION REQUIRED // PENDING REGISTRATION
            </div>
            <div style={{ color: '#ffffff', fontSize: '0.9rem', fontWeight: 500 }}>
              There {pendingTpcRequests === 1 ? 'is' : 'are'} <strong>{pendingTpcRequests}</strong> college TPC registration request(s) awaiting your verification and acceptance.
            </div>
          </div>
          <Link
            href="/super-admin/tpc"
            style={{
              padding: '0.65rem 1.25rem',
              background: '#ffffff',
              color: '#08090b',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              textDecoration: 'none'
            }}
          >
            Review & Accept TPC Requests →
          </Link>
        </div>
      )}

      {/* Global Metrics */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statTag}>[CAMPUSES]</div>
          <div className={styles.statValue}>{totalCampuses}</div>
          <div className={styles.statLabel}>Partner Universities</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTag}>[TPC OFFICERS]</div>
          <div className={styles.statValue}>{totalTpcAdmins}</div>
          <div className={styles.statLabel} style={pendingTpcRequests > 0 ? { color: '#eab308' } : undefined}>
            {pendingTpcRequests > 0 ? `${pendingTpcRequests} Pending Acceptance` : 'Active Placement Admins'}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTag}>[STUDENTS]</div>
          <div className={styles.statValue}>{totalStudents}</div>
          <div className={styles.statLabel}>Registered Candidates</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTag}>[TOTAL STORIES]</div>
          <div className={styles.statValue}>{totalExperiences}</div>
          <div className={styles.statLabel}>Placement Experiences Logged</div>
        </div>
      </div>

      {/* Section: TPC Officers Overview */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Training & Placement Cell (TPC) Officers</h2>
          <Link href="/super-admin/tpc" className={styles.sectionLink}>
            View All ({totalTpcAdmins}) Officers →
          </Link>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>TPC Officer Name</th>
              <th>Official Email</th>
              <th>Assigned Campus</th>
              <th>System Role</th>
              <th>Account Status</th>
            </tr>
          </thead>
          <tbody>
            {recentTpc.map((officer) => (
              <tr key={officer.id}>
                <td className={styles.primaryCol}>{officer.name}</td>
                <td>{officer.email}</td>
                <td>{officer.campus?.name || 'Unassigned'}</td>
                <td><span className={styles.badgeRoleTpc}>TPC ADMIN</span></td>
                <td>
                  <span className={officer.verificationStatus === 'VERIFIED' ? styles.badgeVerified : styles.badgePending}>
                    {officer.verificationStatus === 'VERIFIED' ? '✓ ACTIVE' : '◇ PENDING'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Section: Students Across Campuses */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Registered Students Across Campuses</h2>
          <Link href="/super-admin/students" className={styles.sectionLink}>
            View All ({totalStudents}) Students →
          </Link>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Roll Number</th>
              <th>College / Campus</th>
              <th>Branch</th>
              <th>Submissions</th>
              <th>Roster Status</th>
            </tr>
          </thead>
          <tbody>
            {recentStudents.map((student) => (
              <tr key={student.id}>
                <td className={styles.primaryCol}>
                  <div>{student.name}</div>
                  <div className={styles.subText}>{student.email}</div>
                </td>
                <td>{student.rollNumber || 'N/A'}</td>
                <td>{student.campus?.name || 'IIT Delhi'}</td>
                <td>{student.branch || 'B.Tech CSE'}</td>
                <td>{student.experiences.length} stories</td>
                <td>
                  <span className={student.verificationStatus === 'VERIFIED' ? styles.badgeVerified : styles.badgePending}>
                    {student.verificationStatus === 'VERIFIED' ? '✓ ROSTER MATCH' : '◇ UNMATCHED'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Section: Campus Directory Summary */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Participating Colleges & Campuses</h2>
          <Link href="/super-admin/campuses" className={styles.sectionLink}>
            Manage Campuses →
          </Link>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Campus Name</th>
              <th>Location</th>
              <th>TPC Officers</th>
              <th>Students</th>
              <th>Placement Drives</th>
            </tr>
          </thead>
          <tbody>
            {campuses.map((c) => {
              const officers = c.users.filter(u => u.role === 'TPC_ADMIN').length
              const students = c.users.filter(u => u.role === 'STUDENT').length
              return (
                <tr key={c.id}>
                  <td className={styles.primaryCol}>{c.name}</td>
                  <td>{c.location}</td>
                  <td>{officers} Officers</td>
                  <td>{students} Students</td>
                  <td>{c.drives.length} Drives</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
