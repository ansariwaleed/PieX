import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import AdminStudentsClient from './AdminStudentsClient'

export default async function StudentsPage({
  searchParams
}: {
  searchParams?: Promise<{ campusId?: string }>
}) {
  const session = await auth()
  const role = (session?.user as any)?.role
  const resolvedParams = searchParams ? await searchParams : {}
  const requestedCampusId = resolvedParams?.campusId

  let activeCampusId = requestedCampusId

  if (role === 'TPC_ADMIN') {
    const dbUser = await prisma.user.findUnique({
      where: { id: session?.user?.id }
    })
    activeCampusId = dbUser?.campusId || activeCampusId
  }

  const campusFilter = activeCampusId ? { campusId: activeCampusId } : {}

  const students = await prisma.user.findMany({
    where: {
      role: 'STUDENT',
      ...campusFilter
    },
    include: {
      campus: true,
      experiences: {
        select: { id: true, verificationStatus: true }
      }
    },
    orderBy: { name: 'asc' }
  })

  return <AdminStudentsClient initialStudents={students} />
}
