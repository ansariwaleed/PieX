import Link from 'next/link'
import styles from './super-admin.module.css'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export default async function SuperAdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const role = (session?.user as any)?.role

  // Strict role check: Only SUPER_ADMIN is permitted
  if (!session?.user || role !== 'SUPER_ADMIN') {
    return (
      <div className={styles.restrictedContainer}>
        <div className={styles.restrictedCard}>
          <div className={styles.restrictedIcon}>ACCESS RESTRICTED</div>
          <h1 className={styles.restrictedTitle}>Super Administrator Access Only</h1>
          <p className={styles.restrictedText}>
            This section is restricted to platform super administrators.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link href="/" className="btn btn-secondary">
              ← Return Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Count metrics for sidebar badges
  const [tpcCount, studentCount, campusCount, pendingResetsCount] = await Promise.all([
    prisma.user.count({ where: { role: 'TPC_ADMIN' } }),
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.campus.count(),
    prisma.passwordResetRequest.count({ where: { status: 'PENDING' } })
  ])

  return (
    <div className={styles.superLayout}>
      {/* Super Admin Command Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.kicker}>PIEX (πX) // CENTRAL AUTHORITY</div>
          <div className={styles.portalTitle}>PieX Super Admin</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {session.user.name || session.user.email}
          </div>
        </div>

        <nav>
          <ul className={styles.navList}>
            <li>
              <Link href="/super-admin" className={styles.navItem}>
                <span className={styles.navIndex}>01</span>
                <span>Overview</span>
              </Link>
            </li>
            <li>
              <Link href="/super-admin/experiences" className={styles.navItem}>
                <span className={styles.navIndex}>02</span>
                <span>Placement Experiences</span>
              </Link>
            </li>
            <li>
              <Link href="/super-admin/tpc" className={styles.navItem}>
                <span className={styles.navIndex}>03</span>
                <span>TPC Officers</span>
                <span className={styles.navBadge}>{tpcCount}</span>
              </Link>
            </li>
            <li style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <Link href="/admin" className={styles.navItem} style={{ color: 'var(--text-muted)' }}>
                <span className={styles.navIndex}>✦</span>
                <span>TPC Review Console</span>
              </Link>
            </li>
            <li>
              <Link href="/" className={styles.navItem} style={{ color: 'var(--text-muted)' }}>
                <span className={styles.navIndex}>←</span>
                <span>Exit to Main Site</span>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Portal Main Content */}
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  )
}
