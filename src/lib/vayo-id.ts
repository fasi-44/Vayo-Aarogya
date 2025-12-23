import prisma from './prisma'

/**
 * Generate the next sequential Vayo ID
 * Format: VA00001, VA00002, etc.
 */
export async function generateVayoId(): Promise<string> {
  // Find the latest vayoId
  const latestUser = await prisma.user.findFirst({
    where: {
      vayoId: {
        not: null,
      },
    },
    orderBy: {
      vayoId: 'desc',
    },
    select: {
      vayoId: true,
    },
  })

  let nextNumber = 1

  if (latestUser?.vayoId) {
    // Extract number from VA00001 format
    const match = latestUser.vayoId.match(/VA(\d+)/)
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1
    }
  }

  // Format as VA00001
  return `VA${nextNumber.toString().padStart(5, '0')}`
}

/**
 * Check if a Vayo ID is valid format
 */
export function isValidVayoId(vayoId: string): boolean {
  return /^VA\d{5}$/.test(vayoId)
}
