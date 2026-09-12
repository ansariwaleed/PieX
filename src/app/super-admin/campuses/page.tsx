import Link from 'next/link'
import styles from '../super-admin.module.css'
import { prisma } from '@/lib/prisma'

export default async function SuperAdminCampusesPage() {
  const campuses = await prisma.campus.findMany({
    include: {
      users: {
        select: { id: true, name: true, role: true, email: true }
      },
      drives: {
        include: {
          company: true,
          experiences: { select: { id: true, verificationStatus: true } }
        }
      }
    },
    orderBy: { name: 'asc' }
  })

  return (
    <>
      <div className={styles.pageHeader}>
        <div className={styles.kicker}>INSTITUTIONAL DIRECTORY</div>
        <h1 className={styles.pageTitle}>Colleges & Partner Campuses</h1>
        <p className={styles.pageSubtitle}>
          Institutions participating in the verified placement archive with official Training & Placement Cells. Click any college to view its dedicated TPC dashboard.
        </p>
      </div>

      <div className={styles.section}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>College / Campus</th>
              <th>Location</th>
              <th>TPC Coordinators</th>
              <th>Enrolled Students</th>
              <th>Placement Drives</th>
              <th>Total Experiences</th>
              <th style={{ textAlign: 'right' }}>TPC View</th>
            </tr>
          </thead>
          <tbody>
            {campuses.map((c) => {
              const officers = c.users.filter(u => u.role === 'TPC_ADMIN')
              const students = c.users.filter(u => u.role === 'STUDENT')
              const totalExp = c.drives.reduce((acc, d) => acc + d.experiences.length, 0)
              const verifiedExp = c.drives.reduce((acc, d) => acc + d.experiences.filter(e => e.verificationStatus === 'VERIFIED').length, 0)

              return (
                <tr key={c.id}>
                  <td className={styles.primaryCol}>
                    <Link
                      href={`/admin?campusId=${c.id}`}
                      style={{ color: '#ffffff', fontWeight: 600, textDecoration: 'none' }}
                      title="Click to view TPC Dashboard for this college"
                    >
                      {c.name}
                    </Link>
                    <div className={styles.subText}>ID: {c.id.slice(0, 8)}...</div>
                  </td>
                  <td>{c.location}</td>
                  <td>
                    {officers.map(o => (
                      <div key={o.id} style={{ fontSize: '0.8rem' }}>
                        {o.name} <span style={{ color: 'var(--text-muted)' }}>({o.email})</span>
                      </div>
                    ))}
                    {officers.length === 0 && <span style={{ color: 'var(--text-muted)' }}>No officer assigned</span>}
                  </td>
                  <td>{students.length} Students</td>
                  <td>{c.drives.length} Drives</td>
                  <td>
                    {totalExp} ({verifiedExp} verified)
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link
                      href={`/admin?campusId=${c.id}`}
                      style={{
                        display: 'inline-block',
                        padding: '0.4rem 0.8rem',
                        background: '#ffffff',
                        color: '#08090b',
                        border: '1px solid #ffffff',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        textDecoration: 'none',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      View TPC Console →
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
