import { NextResponse } from "next/server"
import { getCachedCompanies } from "@/lib/data-cache"

export async function GET() {
  try {
    const companies = await getCachedCompanies()
    return NextResponse.json(companies, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      }
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 })
  }
}
