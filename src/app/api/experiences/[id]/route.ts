import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const experience = await prisma.experience.findUnique({
      where: { id },
      include: {
        drive: {
          include: {
            company: true,
            campus: true,
          }
        },
        rounds: {
          orderBy: { roundNumber: 'asc' },
          include: {
            questions: true
          }
        },
        student: {
          select: {
            name: true,
            branch: true,
            graduationYear: true,
            rollNumber: true,
            email: true,
            verificationStatus: true
          }
        }
      }
    })

    if (!experience) {
      return NextResponse.json({ error: "Experience not found" }, { status: 404 })
    }

    return NextResponse.json(experience)
  } catch (error) {
    console.error("Fetch single experience error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
