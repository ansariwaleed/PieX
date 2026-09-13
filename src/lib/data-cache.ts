import { prisma } from './prisma'
import { unstable_cache } from 'next/cache'

/**
 * Cached fetch for all companies.
 * Revalidates every 1 hour (3600 seconds) or on demand.
 */
export const getCachedCompanies = unstable_cache(
  async () => {
    return prisma.company.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true }
    })
  },
  ['all-companies-cache'],
  { revalidate: 3600, tags: ['companies'] }
)

/**
 * Cached fetch for all campuses.
 * Revalidates every 1 hour (3600 seconds) or on demand.
 */
export const getCachedCampuses = unstable_cache(
  async () => {
    return prisma.campus.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, location: true }
    })
  },
  ['all-campuses-cache'],
  { revalidate: 3600, tags: ['campuses'] }
)
