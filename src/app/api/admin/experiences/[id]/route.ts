import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

// Helper to check TPC or Super Admin role
async function checkAdminAuth() {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (!session?.user || (role !== 'TPC_ADMIN' && role !== 'SUPER_ADMIN')) {
    return null
  }
  return session
}

// GET: Fetch single experience for review or edit
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await checkAdminAuth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 })
    }

    const { id } = await params

    let experience = await prisma.experience.findUnique({
      where: { id },
      include: {
        drive: { include: { company: true, campus: true } },
        student: { select: { id: true, name: true, rollNumber: true, email: true, branch: true, graduationYear: true } },
        rounds: {
          orderBy: { roundNumber: 'asc' },
          include: { questions: true }
        }
      }
    }).catch(() => null)

    if (!experience) {
      const index = parseInt(id) - 1
      if (!isNaN(index) && index >= 0) {
        const all = await prisma.experience.findMany({
          include: {
            drive: { include: { company: true, campus: true } },
            student: { select: { id: true, name: true, rollNumber: true, email: true, branch: true, graduationYear: true } },
            rounds: {
              orderBy: { roundNumber: 'asc' },
              include: { questions: true }
            }
          },
          orderBy: { submittedAt: 'desc' }
        })
        if (all[index]) {
          experience = all[index]
        }
      }
    }

    if (!experience) {
      return NextResponse.json({ error: "Experience not found" }, { status: 404 })
    }

    return NextResponse.json(experience)
  } catch (error) {
    console.error("Error fetching experience:", error)
    return NextResponse.json({ error: "Failed to fetch experience" }, { status: 500 })
  }
}

// PUT / PATCH: Update status OR edit full content of experience even after verification
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await checkAdminAuth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { action, role, result, companyName, verificationStatus, isAnonymous, rounds } = body

    // 1. Status action change (verify, reject, unpublish, revert_pending, request_changes)
    if (action) {
      if (!['verify', 'reject', 'unpublish', 'revert_pending', 'request_changes'].includes(action)) {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
      }

      const updateData: any = {}

      if (action === 'verify') {
        updateData.verificationStatus = 'VERIFIED'
        updateData.publishedAt = new Date()
      } else if (action === 'reject') {
        updateData.verificationStatus = 'REJECTED'
      } else if (action === 'unpublish' || action === 'revert_pending') {
        updateData.verificationStatus = 'PENDING'
        updateData.publishedAt = null
      }

      const experience = await prisma.experience.update({
        where: { id },
        data: updateData,
        include: {
          drive: { include: { company: true, campus: true } },
          student: true,
          rounds: true
        }
      })

      return NextResponse.json({ success: true, experience })
    }

    // 2. Full content update / edit
    let exp = await prisma.experience.findUnique({
      where: { id },
      include: { drive: true }
    }).catch(() => null)

    if (!exp) {
      const index = parseInt(id) - 1
      if (!isNaN(index) && index >= 0) {
        const all = await prisma.experience.findMany({
          include: { drive: true },
          orderBy: { submittedAt: 'desc' }
        })
        if (all[index]) {
          exp = all[index]
        }
      }
    }

    if (!exp) {
      return NextResponse.json({ error: "Experience not found" }, { status: 404 })
    }

    // Update company if companyName provided
    if (companyName && companyName.trim()) {
      let company = await prisma.company.findUnique({
        where: { name: companyName.trim() }
      })
      if (!company) {
        company = await prisma.company.create({
          data: { name: companyName.trim() }
        })
      }
      await prisma.placementDrive.update({
        where: { id: exp.driveId },
        data: {
          companyId: company.id,
          ...(role ? { role: role.trim() } : {})
        }
      })
    } else if (role && role.trim()) {
      await prisma.placementDrive.update({
        where: { id: exp.driveId },
        data: { role: role.trim() }
      })
    }

    // Update experience fields
    const expUpdateData: any = {}
    if (result) expUpdateData.result = result
    if (verificationStatus) {
      expUpdateData.verificationStatus = verificationStatus
      if (verificationStatus === 'VERIFIED' && !exp.publishedAt) {
        expUpdateData.publishedAt = new Date()
      } else if (verificationStatus === 'PENDING') {
        expUpdateData.publishedAt = null
      }
    }
    if (typeof isAnonymous === 'boolean') expUpdateData.isAnonymous = isAnonymous

    // If rounds are provided, replace rounds
    if (Array.isArray(rounds)) {
      // Delete existing questions & rounds
      await prisma.question.deleteMany({
        where: { round: { experienceId: id } }
      })
      await prisma.interviewRound.deleteMany({
        where: { experienceId: id }
      })

      // Create new rounds
      for (let i = 0; i < rounds.length; i++) {
        const r = rounds[i]
        await prisma.interviewRound.create({
          data: {
            experienceId: id,
            roundNumber: i + 1,
            type: r.type || 'Technical Interview',
            durationMinutes: parseInt(r.durationMinutes) || 45,
            difficulty: parseInt(r.difficulty) || 3,
            description: r.description || '',
            topics: Array.isArray(r.topics) ? r.topics : []
          }
        })
      }
    }

    const updatedExperience = await prisma.experience.update({
      where: { id },
      data: expUpdateData,
      include: {
        drive: { include: { company: true, campus: true } },
        student: true,
        rounds: { orderBy: { roundNumber: 'asc' } }
      }
    })

    return NextResponse.json({
      success: true,
      message: "Experience updated successfully.",
      experience: updatedExperience
    })
  } catch (error) {
    console.error("Error updating experience:", error)
    return NextResponse.json({ error: "Failed to update experience" }, { status: 500 })
  }
}

// DELETE: Delete an experience permanently (even after accepted/verified)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await checkAdminAuth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access. TPC or Super Admin role required." }, { status: 403 })
    }

    const { id } = await params

    let experience = await prisma.experience.findUnique({
      where: { id }
    }).catch(() => null)

    if (!experience) {
      const index = parseInt(id) - 1
      if (!isNaN(index) && index >= 0) {
        const all = await prisma.experience.findMany({
          orderBy: { submittedAt: 'desc' }
        })
        if (all[index]) {
          experience = all[index]
        }
      }
    }

    if (!experience) {
      return NextResponse.json({ error: "Experience not found" }, { status: 404 })
    }

    const expId = experience.id

    // 1. Delete associated questions safely
    await prisma.question.deleteMany({
      where: { round: { experienceId: expId } }
    }).catch(() => null)

    // 2. Delete interview rounds safely
    await prisma.interviewRound.deleteMany({
      where: { experienceId: expId }
    }).catch(() => null)

    // 3. Delete reports safely
    await prisma.report.deleteMany({
      where: { experienceId: expId }
    }).catch(() => null)

    // 4. Delete experience record
    await prisma.experience.delete({
      where: { id: expId }
    })

    return NextResponse.json({
      success: true,
      message: "Experience record has been permanently deleted from the archive."
    })
  } catch (error) {
    console.error("Error deleting experience:", error)
    return NextResponse.json({ error: "Failed to delete experience" }, { status: 500 })
  }
}
