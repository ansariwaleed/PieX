import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')?.toLowerCase().trim()

    if (!email) {
      return NextResponse.json({ found: false })
    }

    let user = await prisma.user.findUnique({
      where: { email },
      include: { campus: { select: { name: true } } }
    })

    if (!user && (email === 'admin@piex.com' || email === 'admin@placementarchive.com' || email === 'superadmin@piex.com' || email === 'admin@piex.ac.in')) {
      user = await prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN' },
        include: { campus: { select: { name: true } } }
      })
    }

    if (!user) {
      return NextResponse.json({ found: false })
    }

    return NextResponse.json({
      found: true,
      role: user.role,
      verificationStatus: user.verificationStatus,
      campusName: user.campus?.name,
      isPendingTpc: user.role === 'TPC_ADMIN' && user.verificationStatus === 'PENDING',
      isRejectedTpc: user.role === 'TPC_ADMIN' && user.verificationStatus === 'REJECTED',
    })
  } catch {
    return NextResponse.json({ error: "Failed to check account status" }, { status: 500 })
  }
}
