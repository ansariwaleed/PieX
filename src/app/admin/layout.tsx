import Link from 'next/link'
import styles from './admin.module.css'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const role = (session?.user as any)?.role

  // Strict Authorization: Only TPC_ADMIN or SUPER_ADMIN can access
  if (!session?.user || (role !== 'TPC_ADMIN' && role !== 'SUPER_ADMIN')) {
    return (
      <div className="container" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem' }}>
        <div style={{
          maxWidth: '540px',
          width: '100%',
          background: 'var(--bg-card)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          padding: '3rem 2.5rem',
          textAlign: 'left'
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--danger)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '1rem' }}>
            [ACCESS RESTRICTED // TPC CREDENTIALS REQUIRED]
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            Official Placement Cell Area
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            {session?.user ? (
              <>
                You are currently signed in as <strong>{session.user.name}</strong> (<span style={{ color: '#e2e4e9', fontFamily: 'var(--font-mono)' }}>STUDENT ACCOUNT</span>). This section is strictly restricted to verified Training & Placement Cell officers to verify candidate records.
              </>
            ) : (
              <>
                You must be logged in as an authorized <strong>Training & Placement Cell (TPC) Administrator</strong> to access candidate verification and records.
              </>
            )}
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/" className="btn btn-secondary">
              ← Return to Archive
            </Link>
            <Link href="/login" className="btn btn-primary">
              Sign In as TPC Admin →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  let campusName = 'Placement Cell'
  let userCampusId: string | undefined
  if (role === 'TPC_ADMIN' && session?.user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { campus: true }
    })
    if (dbUser?.campus) {
      campusName = `${dbUser.campus.name} Placement Cell`
      userCampusId = dbUser.campusId || undefined
    }
  } else if (role === 'SUPER_ADMIN') {
    campusName = 'Institutional Console (Super Admin)'
  }

  const [pendingCount, pendingResetsCount] = await Promise.all([
    prisma.experience.count({
      where: { verificationStatus: 'PENDING' }
    }),
    prisma.passwordResetRequest.count({
      where: {
        status: 'PENDING',
        user: {
          role: 'STUDENT',
          ...(userCampusId ? { campusId: userCampusId } : {})
        }
      }
    })
  ])

  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarTitle}>PIEX TPC CONSOLE // OFFICIAL</div>
          <div className={styles.campusName}>{campusName}</div>
        </div>

        {role === 'SUPER_ADMIN' && (
          <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            <Link
              href="/super-admin/campuses"
              style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                color: 'var(--accent)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                textDecoration: 'none'
              }}
            >
              ← Super Admin Campuses
            </Link>
          </div>
        )}

        <ul className={styles.navList}>
          <li>
            <Link href="/admin" className={styles.navItem}>
              <span className={styles.navIcon}>01</span>
              Placement Experiences
            </Link>
          </li>
          <li>
            <Link href="/admin/pending" className={styles.navItem}>
              <span className={styles.navIcon}>02</span>
              Pending Verification
              {pendingCount > 0 && <span className={styles.navBadge}>{pendingCount}</span>}
            </Link>
          </li>
          <li>
            <Link href="/admin/analytics" className={styles.navItem}>
              <span className={styles.navIcon}>03</span>
              Placement Intelligence
            </Link>
          </li>
          <li>
            <Link href="/admin/companies" className={styles.navItem}>
              <span className={styles.navIcon}>04</span>
              Visiting Companies
            </Link>
          </li>
          <li style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <Link href="/explore" className={styles.navItem} style={{ color: 'var(--text-muted)' }}>
              <span className={styles.navIcon}>←</span>
              Public Archives
            </Link>
          </li>
        </ul>
      </aside>

      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  )
}
