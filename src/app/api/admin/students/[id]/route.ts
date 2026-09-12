import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import bcrypt from "bcryptjs"

// Helper to check TPC or Super Admin role
async function checkAdminAuth() {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (!session?.user?.id || (role !== 'TPC_ADMIN' && role !== 'SUPER_ADMIN')) {
    return null
  }
  return session
}

// PATCH: Direct password update for a student by TPC Admin or Super Admin
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await checkAdminAuth()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized. TPC or Super Admin role required." }, { status: 403 })
    }

    const { id } = await params
    const role = (session.user as any)?.role
    const currentUserId = session.user.id
    const body = await request.json()
    const { newPassword } = body

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters long." }, { status: 400 })
    }

    const student = await prisma.user.findUnique({
      where: { id }
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 })
    }

    if (student.role !== 'STUDENT') {
      return NextResponse.json({ error: "Cannot update non-student password through this endpoint." }, { status: 400 })
    }

    // If TPC Admin, verify student belongs to their campus
    if (role === 'TPC_ADMIN') {
      const dbUser = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { campusId: true }
      })
      if (!dbUser?.campusId || student.campusId !== dbUser.campusId) {
        return NextResponse.json({ error: "Forbidden: You can only update passwords for students in your campus." }, { status: 403 })
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)

    // Update password and resolve any pending reset requests for this student
    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: { passwordHash }
      }),
      prisma.passwordResetRequest.updateMany({
        where: {
          userId: id,
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
      message: `Password updated successfully for student ${student.name} (${student.email}).`
    })
  } catch (error) {
    console.error("Error updating student password:", error)
    return NextResponse.json({ error: "Failed to update student password." }, { status: 500 })
  }
}

// DELETE: Delete a student and their entire submission history
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await checkAdminAuth()
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized access. TPC or Super Admin role required." }, { status: 403 })
    }

    const { id } = await params
    const role = (session.user as any)?.role

    const student = await prisma.user.findUnique({
      where: { id },
      include: {
        experiences: {
          select: { id: true }
        }
      }
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    if (student.role !== 'STUDENT') {
      return NextResponse.json({ error: "Cannot delete non-student user through this endpoint" }, { status: 400 })
    }

    // If TPC Admin, verify student belongs to their campus
    if (role === 'TPC_ADMIN') {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id }
      })
      if (!dbUser?.campusId || student.campusId !== dbUser.campusId) {
        return NextResponse.json({ error: "Forbidden: You can only delete students from your campus" }, { status: 403 })
      }
    }

    const experienceIds = student.experiences.map(e => e.id)

    if (experienceIds.length > 0) {
      // Delete questions in rounds belonging to these experiences
      await prisma.question.deleteMany({
        where: {
          round: {
            experienceId: { in: experienceIds }
          }
        }
      })

      // Delete interview rounds
      await prisma.interviewRound.deleteMany({
        where: {
          experienceId: { in: experienceIds }
        }
      })

      // Delete reports on these experiences
      await prisma.report.deleteMany({
        where: {
          experienceId: { in: experienceIds }
        }
      })

      // Delete experiences
      await prisma.experience.deleteMany({
        where: {
          id: { in: experienceIds }
        }
      })
    }

    // Delete reports submitted by this student
    await prisma.report.deleteMany({
      where: {
        reporterId: id
      }
    })

    // Delete password reset requests for this student
    await prisma.passwordResetRequest.deleteMany({
      where: {
        userId: id
      }
    })

    // Delete the student record
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: `Student ${student.name} and all associated records deleted successfully.`
    })
  } catch (error) {
    console.error("Error deleting student:", error)
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 })
  }
}
