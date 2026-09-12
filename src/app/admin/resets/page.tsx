import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import TpcResetsClient from "./TpcResetsClient"

export default async function TpcPasswordResetsPage() {
  const session = await auth()
  const role = (session?.user as any)?.role

  if (!session?.user || (role !== 'TPC_ADMIN' && role !== 'SUPER_ADMIN')) {
    redirect('/login')
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { campus: true }
  })

  // If SUPER_ADMIN is viewing, or TPC with no campus
  const campusId = dbUser?.campusId

  const whereClause: any = {
    user: {
      role: 'STUDENT',
      ...(campusId ? { campusId } : {})
    }
  }

  const [pendingRequests, resolvedRequests] = await Promise.all([
    prisma.passwordResetRequest.findMany({
      where: {
        ...whereClause,
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            rollNumber: true,
            branch: true,
            graduationYear: true,
            campus: { select: { name: true } }
          }
        }
      },
      orderBy: { requestedAt: 'desc' }
    }),
    prisma.passwordResetRequest.findMany({
      where: {
        ...whereClause,
        status: { in: ['APPROVED', 'REJECTED'] }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            rollNumber: true,
            branch: true
          }
        },
        resolvedBy: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { resolvedAt: 'desc' },
      take: 15
    })
  ])

  return (
    <TpcResetsClient
      campusName={dbUser?.campus?.name || 'Campus'}
      initialPending={JSON.parse(JSON.stringify(pendingRequests))}
      initialResolved={JSON.parse(JSON.stringify(resolvedRequests))}
    />
  )
}
