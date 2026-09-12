import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import bcrypt from "bcryptjs"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const role = (session?.user as any)?.role
    const currentUserId = session?.user?.id

    if (!session?.user || !['TPC_ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, newPassword } = body

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: "Invalid status. Must be APPROVED or REJECTED" }, { status: 400 })
    }

    if (status === 'APPROVED' && (!newPassword || newPassword.length < 6)) {
      return NextResponse.json({ error: "A new password of at least 6 characters is required for approval." }, { status: 400 })
    }

    // Find the reset request
    const resetReq = await prisma.passwordResetRequest.findUnique({
      where: { id },
      include: {
        user: true
      }
    })

    if (!resetReq) {
      return NextResponse.json({ error: "Password reset request not found" }, { status: 404 })
    }

    if (resetReq.status !== 'PENDING') {
      return NextResponse.json({ error: `Request has already been ${resetReq.status.toLowerCase()}` }, { status: 400 })
    }

    // Role-based permissions
    if (role === 'TPC_ADMIN') {
      // TPC admin can only resolve student requests in their own campus
      const tpcUser = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { campusId: true }
      })

      if (!tpcUser?.campusId || resetReq.user.campusId !== tpcUser.campusId || resetReq.user.role !== 'STUDENT') {
        return NextResponse.json({ error: "You can only handle reset requests for students in your campus." }, { status: 403 })
      }
    }

    if (status === 'APPROVED') {
      const passwordHash = await bcrypt.hash(newPassword, 10)

      // Update both the user's password and the request status
      await prisma.$transaction([
        prisma.user.update({
          where: { id: resetReq.userId },
          data: { passwordHash }
        }),
        prisma.passwordResetRequest.update({
          where: { id },
          data: {
            status: 'APPROVED',
            resolvedAt: new Date(),
            resolvedById: currentUserId
          }
        })
      ])

      return NextResponse.json({
        success: true,
        message: `Password updated successfully for ${resetReq.user.name} (${resetReq.user.email}).`
      })
    } else {
      // REJECTED
      await prisma.passwordResetRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          resolvedAt: new Date(),
          resolvedById: currentUserId
        }
      })

      return NextResponse.json({
        success: true,
        message: `Password reset request rejected for ${resetReq.user.name} (${resetReq.user.email}).`
      })
    }
  } catch (error) {
    console.error("Resolve reset request error:", error)
    return NextResponse.json({ error: "Failed to resolve reset request" }, { status: 500 })
  }
}
