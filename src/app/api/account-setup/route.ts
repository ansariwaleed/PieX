import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(request: Request) {
  try {
    const session = await auth()
    const body = await request.json()
    const {
      email: providedEmail,
      name,
      role = 'STUDENT',
      campusName,
      branch,
      rollNumber,
      graduationYear
    } = body

    const userEmail = (session?.user?.email || providedEmail)?.toLowerCase().trim()

    if (!userEmail) {
      return NextResponse.json({ error: "Authenticated user email is required." }, { status: 401 })
    }

    if (!campusName || !campusName.trim()) {
      return NextResponse.json({ error: "College / Campus name is required." }, { status: 400 })
    }

    // 1. Find or create the Campus record
    let campus = await prisma.campus.findFirst({
      where: { name: { equals: campusName.trim(), mode: 'insensitive' } }
    })

    if (!campus) {
      campus = await prisma.campus.create({
        data: {
          name: campusName.trim(),
          location: 'India',
          status: role === 'TPC_ADMIN' ? 'PENDING' : 'ACTIVE'
        }
      })
    }

    // 2. Find or create the User
    let user = await prisma.user.findFirst({
      where: { email: { equals: userEmail, mode: 'insensitive' } }
    })

    const isSuperAdminEmail = userEmail === 'admin@placementarchive.com'
    const finalRole = isSuperAdminEmail ? 'SUPER_ADMIN' : role
    const verificationStatus = finalRole === 'TPC_ADMIN' ? 'PENDING' : 'VERIFIED'

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userEmail,
          name: name || userEmail.split('@')[0],
          role: finalRole,
          campusId: campus.id,
          verificationStatus,
          branch: branch?.trim() || (role === 'STUDENT' ? 'Computer Science & Engineering' : null),
          rollNumber: rollNumber?.trim() || null,
          graduationYear: graduationYear ? parseInt(graduationYear.toString()) : (role === 'STUDENT' ? 2026 : null)
        }
      })
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: name || user.name,
          role: finalRole,
          campusId: campus.id,
          verificationStatus,
          branch: branch?.trim() || user.branch,
          rollNumber: rollNumber?.trim() || user.rollNumber,
          graduationYear: graduationYear ? parseInt(graduationYear.toString()) : user.graduationYear
        }
      })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        campusName: campus.name,
        verificationStatus: user.verificationStatus
      },
      redirectUrl: finalRole === 'SUPER_ADMIN'
        ? '/super-admin'
        : finalRole === 'TPC_ADMIN'
        ? '/admin/pending-notice'
        : '/dashboard'
    })
  } catch (error) {
    console.error("Account setup error:", error)
    return NextResponse.json({ error: "Failed to complete account setup" }, { status: 500 })
  }
}
