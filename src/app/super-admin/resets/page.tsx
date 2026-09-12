import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import SuperAdminResetsClient from "./SuperAdminResetsClient"

export default async function SuperAdminResetsPage() {
  const session = await auth()
  const role = (session?.user as any)?.role

  if (!session?.user || role !== 'SUPER_ADMIN') {
    redirect('/login')
  }

  const [pendingRequests, resolvedRequests] = await Promise.all([
    prisma.passwordResetRequest.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            rollNumber: true,
            branch: true,
            campus: { select: { id: true, name: true, location: true } }
          }
        }
      },
      orderBy: { requestedAt: 'desc' }
    }),
    prisma.passwordResetRequest.findMany({
      where: {
        status: { in: ['APPROVED', 'REJECTED'] }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            campus: { select: { name: true } }
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
      take: 20
    })
  ])

  return (
    <SuperAdminResetsClient
      initialPending={JSON.parse(JSON.stringify(pendingRequests))}
      initialResolved={JSON.parse(JSON.stringify(resolvedRequests))}
    />
  )
}
