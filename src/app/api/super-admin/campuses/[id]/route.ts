import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: "Unauthorized. Super Admin role required to delete a campus." },
        { status: 403 }
      )
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: "Campus ID is required" }, { status: 400 })
    }

    const campus = await prisma.campus.findUnique({
      where: { id },
      include: {
        drives: {
          select: { id: true }
        },
        users: {
          select: { id: true, role: true }
        }
      }
    })

    if (!campus) {
      return NextResponse.json({ error: "Campus not found" }, { status: 404 })
    }

    const driveIds = campus.drives.map(d => d.id)

    // 1. Find all experiences associated with this campus's drives
    const experiences = await prisma.experience.findMany({
      where: {
        OR: [
          { driveId: { in: driveIds } },
          { student: { campusId: id } }
        ]
      },
      select: { id: true }
    })
    const expIds = experiences.map(e => e.id)

    if (expIds.length > 0) {
      // Delete questions in rounds belonging to these experiences
      await prisma.question.deleteMany({
        where: {
          round: {
            experienceId: { in: expIds }
          }
        }
      })

      // Delete interview rounds
      await prisma.interviewRound.deleteMany({
        where: {
          experienceId: { in: expIds }
        }
      })

      // Delete reports on these experiences
      await prisma.report.deleteMany({
        where: {
          experienceId: { in: expIds }
        }
      })

      // Delete experiences
      await prisma.experience.deleteMany({
        where: {
          id: { in: expIds }
        }
      })
    }

    // 2. Delete placement drives
    if (driveIds.length > 0) {
      await prisma.placementDrive.deleteMany({
        where: {
          id: { in: driveIds }
        }
      })
    }

    // 3. Clear or delete users associated with this campus
    const userIds = campus.users.map(u => u.id)
    if (userIds.length > 0) {
      // Clear password reset requests for these users
      await prisma.passwordResetRequest.deleteMany({
        where: {
          userId: { in: userIds }
        }
      })

      // Delete TPC admins registered specifically for this campus, and unlink students
      await prisma.user.deleteMany({
        where: {
          campusId: id,
          role: 'TPC_ADMIN'
        }
      })

      await prisma.user.updateMany({
        where: { campusId: id },
        data: { campusId: null }
      })
    }

    // 4. Finally, delete the campus record
    await prisma.campus.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: `Campus "${campus.name}" and all associated placement records have been permanently deleted.`
    })
  } catch (error) {
    console.error("Delete campus error:", error)
    return NextResponse.json(
      { error: "An error occurred while deleting the campus." },
      { status: 500 }
    )
  }
}
