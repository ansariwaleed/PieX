import styles from '../admin.module.css'
import { prisma } from '@/lib/prisma'

export default async function ReportsPage() {
  const reports = await prisma.report.findMany({
    include: {
      experience: {
        include: {
          drive: { include: { company: true } }
        }
      },
      reporter: true
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <>
      <h1 className={styles.pageTitle}>Reports & Flagged Experiences</h1>
      <p className={styles.pageSubtitle}>Content moderation and accuracy reports from students & faculty</p>

      {reports.length === 0 ? (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '0px',
          padding: '3rem 2rem',
          textAlign: 'center',
          marginTop: '1.5rem'
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'var(--accent)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '1rem'
          }}>[ZERO VIOLATIONS LOGGED]</div>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)', fontSize: '1.5rem' }}>No Reports Flagged</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>All published placement experiences adhere strictly to institutional verification standards.</p>
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Reported By</th>
              <th>Company</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id}>
                <td className={styles.studentName}>{r.reporter.name}</td>
                <td>{r.experience.drive.company.name}</td>
                <td>{r.reason}</td>
                <td><span className={styles.statusPending}>{r.status}</span></td>
                <td>{new Date(r.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
