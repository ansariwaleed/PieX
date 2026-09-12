import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 })
    }

    const officers = await prisma.user.findMany({
      where: { role: 'TPC_ADMIN' },
      include: {
        campus: true
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(officers)
  } catch (error) {
    console.error("Error fetching TPC officers:", error)
    return NextResponse.json({ error: "Failed to fetch TPC officers" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session || !session.user?.id || (session.user as any)?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: "Unauthorized. Super Admin role required." }, { status: 403 })
    }

    const currentUserId = session.user.id
    const body = await request.json()
    const { userId, action, newPassword } = body

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    // Direct password update for TPC Admin by Super Admin
    if (action === 'UPDATE_PASSWORD') {
      if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
        return NextResponse.json({ error: "New password must be at least 6 characters long." }, { status: 400 })
      }

      const officer = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!officer || officer.role !== 'TPC_ADMIN') {
        return NextResponse.json({ error: "TPC Officer not found." }, { status: 404 })
      }

      const passwordHash = await bcrypt.hash(newPassword, 10)

      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { passwordHash }
        }),
        prisma.passwordResetRequest.updateMany({
          where: {
            userId,
            status: 'PENDING'
          },
          data: {
            status: 'APPROVED',
            resolvedAt: new Date(),
            resolvedById: currentUserId
          }
        })
      ])

      return NextResponse.json({
        success: true,
        message: `Password updated successfully for TPC Officer ${officer.name} (${officer.email}).`
      })
    }

    // Approval / Rejection of TPC registration
    if (!['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: "Valid action (APPROVE, REJECT, or UPDATE_PASSWORD) is required" }, { status: 400 })
    }

    const newStatus = action === 'APPROVE' ? 'VERIFIED' : 'REJECTED'

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { verificationStatus: newStatus },
      include: { campus: true }
    })

    // If campus is also pending and action is approve, activate the campus
    if (action === 'APPROVE' && updatedUser.campusId && updatedUser.campus?.status === 'PENDING') {
      await prisma.campus.update({
        where: { id: updatedUser.campusId },
        data: { status: 'ACTIVE' }
      })
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: action === 'APPROVE' 
        ? `TPC Officer request for ${updatedUser.campus?.name || updatedUser.name} has been accepted.`
        : `TPC Officer request declined.`
    })
  } catch (error) {
    console.error("Error updating TPC officer:", error)
    return NextResponse.json({ error: "Failed to update TPC officer" }, { status: 500 })
  }
}
