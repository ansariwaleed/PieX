import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

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
    const session = await auth()
    let studentId = session?.user?.id

    // If not logged in, find a default demo student so submission succeeds smoothly
    if (!studentId) {
      const demoStudent = await prisma.user.findFirst({
        where: { role: 'STUDENT' }
      })
      if (demoStudent) {
        studentId = demoStudent.id
      } else {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 })
      }
    }

    const body = await request.json()
    const {
      driveId: providedDriveId,
      companyName,
      campusName,
      role = 'Analyst',
      year = 2026,
      result = 'Selected',
      isAnonymous = true,
      rounds = []
    } = body

    let driveId = providedDriveId

    if (!driveId) {
      // Find or create Company
      const compName = companyName || 'Deloitte'
      let company = await prisma.company.findFirst({
        where: { name: { equals: compName, mode: 'insensitive' } }
      })
      if (!company) {
        company = await prisma.company.create({ data: { name: compName } })
      }

      // Find or create Campus
      const campName = campusName || 'IIT Delhi'
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
