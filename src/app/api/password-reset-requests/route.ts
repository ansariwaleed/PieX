import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

// POST: Create a new password reset request (public — user submits with their email)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = body.email?.toLowerCase().trim()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json({ error: "No account found with this email address." }, { status: 404 })
    }

    // Super admins cannot request resets through this system
    if (user.role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: "Please contact the system administrator directly." }, { status: 403 })
    }

    // Check if there's already a pending request
    const existingRequest = await prisma.passwordResetRequest.findFirst({
      where: {
        userId: user.id,
        status: 'PENDING'
      }
    })

    if (existingRequest) {
      return NextResponse.json({ error: "You already have a pending password reset request. Please wait for it to be reviewed." }, { status: 409 })
    }

    // Create the reset request
    const resetRequest = await prisma.passwordResetRequest.create({
      data: {
        userId: user.id,
        status: 'PENDING'
      }
    })

    return NextResponse.json({
      success: true,
      requestId: resetRequest.id,
      message: "Password reset request submitted. Your campus TPC or admin will review it."
    }, { status: 201 })
  } catch (error) {
    console.error("Password reset request error:", error)
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 })
  }
}

// GET: Fetch password reset requests (for TPC Admin / Super Admin)
export async function GET() {
  try {
    const session = await auth()
    const role = (session?.user as any)?.role
    const userId = session?.user?.id

    if (!session?.user || !['TPC_ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let whereClause: any = { status: 'PENDING' }

    if (role === 'TPC_ADMIN') {
      // TPC Admin sees only student reset requests from their campus
      const tpcUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { campusId: true }
      })

      if (!tpcUser?.campusId) {
        return NextResponse.json([])
      }

      whereClause = {
        status: 'PENDING',
        user: {
          role: 'STUDENT',
          campusId: tpcUser.campusId
        }
      }
    }
    // Super Admin sees ALL pending requests (students + TPC admins)

    const requests = await prisma.passwordResetRequest.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            campus: { select: { name: true } },
            branch: true,
            rollNumber: true
          }
        }
      },
      orderBy: { requestedAt: 'desc' }
    })

    return NextResponse.json(requests)
  } catch (error) {
    console.error("Fetch reset requests error:", error)
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 })
  }
}
