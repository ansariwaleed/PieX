import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name, campusId, collegeName, rollNumber, branch, graduationYear, role } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    const userRole = role === 'TPC_ADMIN' ? 'TPC_ADMIN' : 'STUDENT'

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      )
    }

    let finalCampusId = campusId

    // For TPC registration: only college name is needed
    if (userRole === 'TPC_ADMIN') {
      const targetCollege = (collegeName || '').trim()

      if (!finalCampusId && !targetCollege) {
        return NextResponse.json(
          { error: "Please provide your college name" },
          { status: 400 }
        )
      }

      if (!finalCampusId && targetCollege) {
        // Find existing campus or create a pending campus record
        const existingCampus = await prisma.campus.findFirst({
          where: {
            name: {
              equals: targetCollege,
              mode: 'insensitive'
            }
          }
        })

        if (existingCampus) {
          finalCampusId = existingCampus.id
        } else {
          const newCampus = await prisma.campus.create({
            data: {
              name: targetCollege,
              location: 'Campus',
              status: 'PENDING'
            }
          })
          finalCampusId = newCampus.id
        }
      }
    } else {
      // Student registration requires campusId
      if (!finalCampusId) {
        return NextResponse.json(
          { error: "Please select your college/campus" },
          { status: 400 }
        )
      }
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const displayName = (name || '').trim() || (userRole === 'TPC_ADMIN' ? 'Training & Placement Cell' : 'Student')

    // TPC registration goes as a request that requires Super Admin acceptance
    const initialStatus = userRole === 'TPC_ADMIN' ? 'PENDING' : 'VERIFIED'

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name: displayName,
        passwordHash,
        role: userRole,
        campusId: finalCampusId,
        rollNumber: userRole === 'STUDENT' ? (rollNumber || null) : null,
        branch: userRole === 'STUDENT' ? (branch || null) : null,
        graduationYear: userRole === 'STUDENT' && graduationYear ? parseInt(graduationYear) : null,
        verificationStatus: initialStatus,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        verificationStatus: true,
        campus: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      user,
      pendingApproval: userRole === 'TPC_ADMIN',
      message: userRole === 'TPC_ADMIN'
        ? 'TPC Officer registration request submitted. Awaiting platform institutional verification.'
        : 'Student account created successfully.'
    }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: "Failed to register" },
      { status: 500 }
    )
  }
}
