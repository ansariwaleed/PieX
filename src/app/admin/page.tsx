import Link from 'next/link'
import styles from './admin.module.css'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import SuperAdminCampusSwitcher from '@/components/SuperAdminCampusSwitcher'
import TpcArchivesManager from './TpcArchivesManager'

export default async function AdminDashboard({
  searchParams
}: {
  searchParams?: Promise<{ campusId?: string }>
}) {
  const session = await auth()
  const role = (session?.user as any)?.role
  const resolvedParams = searchParams ? await searchParams : {}
  const requestedCampusId = resolvedParams?.campusId

  const allCampuses = await prisma.campus.findMany({
    orderBy: { name: 'asc' }
  })

  let activeCampus = null

  if (role === 'SUPER_ADMIN') {
    if (requestedCampusId) {
      activeCampus = allCampuses.find(c => c.id === requestedCampusId) || null
    }
    if (!activeCampus && allCampuses.length > 0) {
      activeCampus = allCampuses[0]
    }
  } else {
    // TPC Officer: get their assigned campus
    const dbUser = await prisma.user.findUnique({
      where: { id: session?.user?.id },
      include: { campus: true }
    })
    activeCampus = dbUser?.campus || allCampuses[0] || null
  }

  const activeCampusId = activeCampus?.id
  const campusFilter = activeCampusId ? { campusId: activeCampusId } : {}
  const driveCampusFilter = activeCampusId ? { drive: { campusId: activeCampusId } } : {}

  const [
    totalStudents,
    totalDrives,
    totalExperiences,
    pendingCount,
    allExperiences
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT', ...campusFilter } }),
    prisma.placementDrive.count({ where: campusFilter }),
    prisma.experience.count({ where: driveCampusFilter }),
    prisma.experience.count({ where: { verificationStatus: 'PENDING', ...driveCampusFilter } }),
    prisma.experience.findMany({
      where: driveCampusFilter,
      include: {
        student: true,
        drive: { include: { company: true, campus: true } },
        rounds: { select: { id: true } }
      },
      orderBy: { submittedAt: 'desc' }
    })
  ])

  // Format experiences for client manager component
  const formattedExperiences = allExperiences.map(e => ({
    id: e.id,
    submittedAt: e.submittedAt,
    publishedAt: e.publishedAt,
    verificationStatus: e.verificationStatus as 'PENDING' | 'VERIFIED' | 'REJECTED',
    result: e.result,
    student: {
      name: e.student.name,
      rollNumber: e.student.rollNumber,
      email: e.student.email,
      branch: e.student.branch,
      graduationYear: e.student.graduationYear
    },
    drive: {
      role: e.drive.role,
      year: e.drive.year,
      company: { name: e.drive.company.name },
      campus: { name: e.drive.campus.name }
    },
    rounds: e.rounds
  }))

  return (
    <>
      {/* Super Admin Inspection Banner */}
      {role === 'SUPER_ADMIN' && activeCampus && (
        <div style={{
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-strong)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              color: 'var(--accent)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '0.25rem'
            }}>
              SUPER ADMIN AUDIT // VIEWING AS COLLEGE TPC OFFICER
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 600, color: '#ffffff' }}>
              {activeCampus.name} Placement Cell
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Location: {activeCampus.location} · Operating in Official Campus Mode
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <SuperAdminCampusSwitcher
              campuses={allCampuses}
              currentCampusId={activeCampus.id}
            />
            <Link
              href="/super-admin/campuses"
              style={{
                padding: '0.45rem 0.85rem',
                background: 'transparent',
                border: '1px solid var(--border-strong)',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                textDecoration: 'none',
                textTransform: 'uppercase',
                letterSpacing: '0.06em'
              }}
            >
              ← All Campuses
            </Link>
          </div>
        </div>
      )}

      <h1 className={styles.pageTitle}>
        {activeCampus ? `${activeCampus.name} Placement Cell` : 'Dashboard'}
      </h1>
      <p className={styles.pageSubtitle}>
        Placement 2026 — Official Recruitment Intelligence & Candidate Verification
      </p>

      {/* Stats Scoped to this Campus */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>[STUDENTS]</div>
          <div className={styles.statValue}>{totalStudents}</div>
          <div className={styles.statLabel}>Enrolled at {activeCampus?.name || 'Campus'}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>[DRIVES]</div>
          <div className={styles.statValue}>{totalDrives}</div>
          <div className={styles.statLabel}>Campus Placement Drives</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>[STORIES]</div>
          <div className={styles.statValue}>{totalExperiences}</div>
          <div className={styles.statLabel}>Total Experiences</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>[PENDING]</div>
          <div className={styles.statValue} style={pendingCount > 0 ? { color: '#eab308' } : undefined}>
            {pendingCount}
          </div>
          <div className={styles.statLabel}>Awaiting Verification</div>
        </div>
      </div>

      {/* TPC Archives Manager with Company-wise, Year-wise, and Filtered Views */}
      <TpcArchivesManager
        initialExperiences={formattedExperiences}
        campusName={activeCampus?.name || 'College'}
      />
    </>
  )
}
