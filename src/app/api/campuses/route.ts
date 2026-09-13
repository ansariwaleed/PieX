import { NextResponse } from "next/server"
import { getCachedCampuses } from "@/lib/data-cache"

export async function GET() {
  try {
    const campuses = await getCachedCampuses()
    return NextResponse.json(campuses, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      }
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch campuses" }, { status: 500 })
  }
}
