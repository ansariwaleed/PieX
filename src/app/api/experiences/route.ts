import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { enforceRateLimit } from "@/lib/rateLimit"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const company = searchParams.get('company')
    const year = searchParams.get('year')
    const campus = searchParams.get('campus')
    const result = searchParams.get('result')

    const whereClause: any = {
      verificationStatus: 'VERIFIED'
    }

    if (result) {
      whereClause.result = result
    }

    if (company || year || campus) {
      whereClause.drive = {}
      if (company) {
        whereClause.drive.company = { name: { equals: company, mode: 'insensitive' } }
      }
      if (year) {
        whereClause.drive.year = parseInt(year)
      }
      if (campus) {
        whereClause.drive.campus = { name: { equals: campus, mode: 'insensitive' } }
      }
    }

    const experiences = await prisma.experience.findMany({
      where: whereClause,
      include: {
        drive: {
          include: {
            company: true,
            campus: true
          }
        },
        rounds: {
          orderBy: { roundNumber: 'asc' }
        },
        student: {
          select: {
            name: true,
            branch: true,
            graduationYear: true
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      }
    })

    return NextResponse.json(experiences)
  } catch (error) {
    console.error("Fetch experiences error:", error)
    return NextResponse.json({ error: "Failed to fetch experiences" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Rate limit: 10 experience submissions per hour per IP
    const rateLimitError = enforceRateLimit(request, 'submit-experience', { limit: 10, windowSeconds: 3600 })
    if (rateLimitError) return rateLimitError

    const session = await auth()
    let studentId = session?.user?.id

    if (!studentId) {
      const demoStudent = await prisma.user.findFirst({
        where: { role: 'STUDENT' }
      })
      if (demoStudent) {
        studentId = demoStudent.id
      } else {
        return NextResponse.json({ error: "Authentication required to submit placement experience" }, { status: 401 })
      }
    }

    const body = await request.json()
    const {
      driveId: providedDriveId,
      companyName,
      campusName,
      role,
      year,
      result = 'Selected',
      isAnonymous = true,
      rounds = []
    } = body

    if (!providedDriveId && (!companyName?.trim() || !campusName?.trim())) {
      return NextResponse.json({ error: "Company name and College/Campus are required." }, { status: 400 })
    }

    if (!role?.trim()) {
      return NextResponse.json({ error: "Job role / title is required." }, { status: 400 })
    }

    if (!year) {
      return NextResponse.json({ error: "Placement year is required." }, { status: 400 })
    }

    let driveId = providedDriveId

    if (!driveId) {
      // Find or create Company
      const compName = companyName.trim()
      let company = await prisma.company.findFirst({
        where: { name: { equals: compName, mode: 'insensitive' } }
      })
      if (!company) {
        company = await prisma.company.create({ data: { name: compName } })
      }

      // Find or create Campus
      const campName = campusName.trim()
      let campus = await prisma.campus.findFirst({
        where: { name: { equals: campName, mode: 'insensitive' } }
      })
      if (!campus) {
        campus = await prisma.campus.create({ data: { name: campName, location: 'India' } })
      }

      // Find or create Placement Drive
      let drive = await prisma.placementDrive.findFirst({
        where: {
          campusId: campus.id,
          companyId: company.id,
          year: parseInt(year.toString()),
          role: role
        }
      })

      if (!drive) {
        drive = await prisma.placementDrive.create({
          data: {
            campusId: campus.id,
            companyId: company.id,
            year: parseInt(year.toString()),
            role: role
          }
        })
      }

      driveId = drive.id
    }

    const experience = await prisma.experience.create({
      data: {
        driveId,
        studentId,
        result,
        isAnonymous: isAnonymous ?? true,
        verificationStatus: 'PENDING',
        rounds: {
          create: rounds.map((round: any, index: number) => ({
            roundNumber: round.roundNumber || index + 1,
            type: round.type || 'Technical Interview',
            durationMinutes: parseInt(round.durationMinutes?.toString() || round.duration?.toString() || '45'),
            difficulty: parseInt(round.difficulty?.toString() || '3'),
            description: round.description || 'Detailed interview round experience.',
            topics: Array.isArray(round.topics)
              ? round.topics
              : typeof round.topics === 'string'
              ? round.topics.split(',').map((t: string) => t.trim()).filter(Boolean)
              : ['General']
          }))
        }
      },
      include: {
        rounds: true,
        drive: {
          include: {
            company: true,
            campus: true
          }
        }
      }
    })

    return NextResponse.json(experience)
  } catch (error) {
    console.error("Experience submission error:", error)
    return NextResponse.json({ error: "Failed to submit experience" }, { status: 500 })
  }
}
