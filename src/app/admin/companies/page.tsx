import styles from '../admin.module.css'
import { prisma } from '@/lib/prisma'

export default async function AdminCompaniesPage() {
  const companies = await prisma.company.findMany({
    include: {
      drives: {
        include: {
          campus: true,
          experiences: true
        }
      }
    },
    orderBy: { name: 'asc' }
  })

  return (
    <>
      <div className={styles.sectionHeader}>
        <div>
          <h1 className={styles.pageTitle}>Visiting Companies</h1>
          <p className={styles.pageSubtitle}>Placement partners, hiring drives, and intelligence archive</p>
        </div>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Company Name</th>
            <th>Drives Hosted</th>
            <th>Campuses Visited</th>
            <th>Roles Offered</th>
            <th>Experiences Shared</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((comp) => {
            const totalExp = comp.drives.reduce((acc, d) => acc + d.experiences.length, 0)
            const roles = Array.from(new Set(comp.drives.map(d => d.role))).join(', ') || 'Analyst'
            const campuses = Array.from(new Set(comp.drives.map(d => d.campus.name))).join(', ') || 'All Campuses'

            return (
              <tr key={comp.id}>
                <td className={styles.studentName}>{comp.name}</td>
                <td>{comp.drives.length}</td>
                <td>{campuses}</td>
                <td>{roles}</td>
                <td>{totalExp}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </>
  )
}
