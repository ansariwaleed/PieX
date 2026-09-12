import { prisma } from '@/lib/prisma'
import TpcManagementClient from './TpcManagementClient'

export default async function SuperAdminTpcPage() {
  const officers = await prisma.user.findMany({
    where: { role: 'TPC_ADMIN' },
    include: {
      campus: {
        include: {
          drives: {
            include: {
              experiences: {
                select: { id: true }
              }
            }
          }
        }
      }
    },
    orderBy: [
      { verificationStatus: 'asc' }, // PENDING comes first alphabetically
      { name: 'asc' }
    ]
  })

  // Format data for client component
  const formattedOfficers = officers.map(o => ({
    id: o.id,
    name: o.name,
    email: o.email,
    role: o.role,
    verificationStatus: o.verificationStatus as 'PENDING' | 'VERIFIED' | 'REJECTED',
    campus: o.campus ? {
      id: o.campus.id,
      name: o.campus.name,
      location: o.campus.location,
      status: o.campus.status,
      drives: o.campus.drives.map(d => ({
        id: d.id,
        experiences: d.experiences
      }))
    } : null
  }))

  return <TpcManagementClient initialOfficers={formattedOfficers} />
}
