import { prisma } from '@/lib/prisma'
import SuperAdminExperiencesClient from './SuperAdminExperiencesClient'

export default async function SuperAdminExperiencesPage() {
  const experiences = await prisma.experience.findMany({
    include: {
      student: true,
      drive: {
        include: {
          company: true,
          campus: true
        }
      },
      rounds: { select: { id: true } }
    },
    orderBy: { submittedAt: 'desc' }
  })

  const formatted = experiences.map(e => ({
    id: e.id,
    submittedAt: e.submittedAt,
    verificationStatus: e.verificationStatus as 'PENDING' | 'VERIFIED' | 'REJECTED',
    result: e.result,
    student: {
      name: e.student.name,
      rollNumber: e.student.rollNumber,
      email: e.student.email
    },
    drive: {
      role: e.drive.role,
      company: { name: e.drive.company.name },
      campus: { name: e.drive.campus.name }
    },
    rounds: e.rounds
  }))

  return <SuperAdminExperiencesClient initialExperiences={formatted} />
}
