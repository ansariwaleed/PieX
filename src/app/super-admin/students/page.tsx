import { prisma } from '@/lib/prisma'
import SuperAdminStudentsClient from './SuperAdminStudentsClient'

export default async function SuperAdminStudentsPage() {
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    include: {
      campus: true,
      experiences: {
        select: { id: true, verificationStatus: true }
      }
    },
    orderBy: { name: 'asc' }
  })

  return <SuperAdminStudentsClient initialStudents={students} />
}
