import styles from '../super-admin.module.css'
import { prisma } from '@/lib/prisma'
import SuperAdminCampusesClient from './SuperAdminCampusesClient'

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

  return <SuperAdminCampusesClient initialCampuses={campuses} />
}

