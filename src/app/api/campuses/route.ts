import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const campuses = await prisma.campus.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, location: true },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(campuses)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch campuses" }, { status: 500 })
  }
}
