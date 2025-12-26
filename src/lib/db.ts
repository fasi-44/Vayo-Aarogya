import { type User, type SafeUser, type UserRole } from '@/types'
import prisma from './prisma'
import type { User as PrismaUser, Assessment as PrismaAssessment, Prisma, RiskLevel, AssessmentStatus } from '@prisma/client'

// ============================================
// TYPE CONVERTERS
// ============================================

// Convert Prisma User to application User type
function prismaUserToAppUser(prismaUser: PrismaUser): User {
  return {
    id: prismaUser.id,
    email: prismaUser.email,
    password: prismaUser.password,
    name: prismaUser.name,
    phone: prismaUser.phone ?? undefined,
    role: prismaUser.role as UserRole,
    avatar: prismaUser.avatar ?? undefined,
    isActive: prismaUser.isActive,
    emailVerified: prismaUser.emailVerified,
    createdAt: prismaUser.createdAt.toISOString(),
    updatedAt: prismaUser.updatedAt.toISOString(),
    lastLogin: prismaUser.lastLogin?.toISOString(),
    // Elderly-specific fields
    vayoId: prismaUser.vayoId ?? undefined,
    age: prismaUser.age ?? undefined,
    gender: prismaUser.gender ?? undefined,
    address: prismaUser.address ?? undefined,
    emergencyContact: prismaUser.emergencyContact ?? undefined,
    dateOfBirth: prismaUser.dateOfBirth?.toISOString(),
    // Location fields
    stateName: prismaUser.stateName ?? undefined,
    districtName: prismaUser.districtName ?? undefined,
    talukName: prismaUser.talukName ?? undefined,
    villageName: prismaUser.villageName ?? undefined,
    // Caregiver fields
    caregiverName: prismaUser.caregiverName ?? undefined,
    caregiverPhone: prismaUser.caregiverPhone ?? undefined,
    caregiverRelation: prismaUser.caregiverRelation ?? undefined,
    // Relationships
    assignedVolunteer: prismaUser.assignedVolunteerId ?? undefined,
    maxAssignments: prismaUser.maxAssignments,
  }
}

// Helper to remove password from user object
function toSafeUser(user: User): SafeUser {
  const { password, ...safeUser } = user
  return safeUser
}

// ============================================
// DATABASE CLASS
// ============================================

class Database {
  // ==========================================
  // USER METHODS
  // ==========================================

  async findUserByEmail(email: string): Promise<User | undefined> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })
    return user ? prismaUserToAppUser(user) : undefined
  }

  async getHighestVayoIdByPrefix(prefix: string): Promise<string | null> {
    const result = await prisma.user.findFirst({
      where: {
        vayoId: { startsWith: prefix }
      },
      orderBy: { vayoId: 'desc' },
      select: { vayoId: true }
    })
    return result?.vayoId ?? null
  }

  async findUserById(id: string): Promise<User | undefined> {
    const user = await prisma.user.findUnique({
      where: { id },
    })
    return user ? prismaUserToAppUser(user) : undefined
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const user = await prisma.user.create({
      data: {
        email: userData.email.toLowerCase(),
        password: userData.password,
        name: userData.name,
        phone: userData.phone,
        role: userData.role as Prisma.UserCreateInput['role'],
        avatar: userData.avatar,
        isActive: userData.isActive ?? true,
        emailVerified: userData.emailVerified ?? false,
        lastLogin: userData.lastLogin ? new Date(userData.lastLogin) : null,
        // Elderly-specific fields
        vayoId: userData.vayoId,
        age: userData.age,
        gender: userData.gender as Prisma.UserCreateInput['gender'],
        address: userData.address,
        emergencyContact: userData.emergencyContact,
        dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : null,
        // Location fields
        stateName: userData.stateName,
        districtName: userData.districtName,
        talukName: userData.talukName,
        villageName: userData.villageName,
        // Caregiver fields
        caregiverName: userData.caregiverName,
        caregiverPhone: userData.caregiverPhone,
        caregiverRelation: userData.caregiverRelation,
        // Relationships
        assignedVolunteerId: userData.assignedVolunteer,
        assignedFamilyId: userData.assignedFamily,
        maxAssignments: userData.maxAssignments ?? 10,
      },
    })
    return prismaUserToAppUser(user)
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    try {
      const updateData: Prisma.UserUncheckedUpdateInput = {}

      if (updates.email !== undefined) updateData.email = updates.email.toLowerCase()
      if (updates.password !== undefined) updateData.password = updates.password
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.phone !== undefined) updateData.phone = updates.phone
      if (updates.role !== undefined) updateData.role = updates.role as Prisma.UserUpdateInput['role']
      if (updates.avatar !== undefined) updateData.avatar = updates.avatar
      if (updates.isActive !== undefined) updateData.isActive = updates.isActive
      if (updates.emailVerified !== undefined) updateData.emailVerified = updates.emailVerified
      if (updates.lastLogin !== undefined) updateData.lastLogin = new Date(updates.lastLogin)
      // Elderly-specific fields
      if (updates.vayoId !== undefined) updateData.vayoId = updates.vayoId
      if (updates.age !== undefined) updateData.age = updates.age
      if (updates.gender !== undefined) updateData.gender = updates.gender as Prisma.UserUpdateInput['gender']
      if (updates.address !== undefined) updateData.address = updates.address
      if (updates.emergencyContact !== undefined) updateData.emergencyContact = updates.emergencyContact
      if (updates.dateOfBirth !== undefined) updateData.dateOfBirth = new Date(updates.dateOfBirth)
      // Location fields
      if (updates.stateName !== undefined) updateData.stateName = updates.stateName
      if (updates.districtName !== undefined) updateData.districtName = updates.districtName
      if (updates.talukName !== undefined) updateData.talukName = updates.talukName
      if (updates.villageName !== undefined) updateData.villageName = updates.villageName
      // Caregiver fields
      if (updates.caregiverName !== undefined) updateData.caregiverName = updates.caregiverName
      if (updates.caregiverPhone !== undefined) updateData.caregiverPhone = updates.caregiverPhone
      if (updates.caregiverRelation !== undefined) updateData.caregiverRelation = updates.caregiverRelation
      // Relationships
      if (updates.assignedVolunteer !== undefined) updateData.assignedVolunteerId = updates.assignedVolunteer
      if (updates.assignedFamily !== undefined) updateData.assignedFamilyId = updates.assignedFamily
      if (updates.maxAssignments !== undefined) updateData.maxAssignments = updates.maxAssignments

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
      })
      return prismaUserToAppUser(user)
    } catch {
      return undefined
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      await prisma.user.delete({
        where: { id },
      })
      return true
    } catch {
      return false
    }
  }

  async getAllUsers(options?: {
    role?: string
    search?: string
    page?: number
    limit?: number
    isActive?: boolean
    assignedVolunteerId?: string
    assignedFamilyId?: string
  }): Promise<{ users: SafeUser[]; total: number }> {
    const where: Prisma.UserWhereInput = {}

    if (options?.role) {
      where.role = options.role as Prisma.UserWhereInput['role']
    }

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive
    }

    // Filter by assigned volunteer (for volunteers viewing their elderly)
    if (options?.assignedVolunteerId) {
      where.assignedVolunteerId = options.assignedVolunteerId
    }

    // Filter by assigned family (for family viewing their elderly)
    if (options?.assignedFamilyId) {
      where.assignedFamilyId = options.assignedFamilyId
    }

    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { email: { contains: options.search, mode: 'insensitive' } },
      ]
    }

    const page = options?.page ?? 1
    const limit = options?.limit ?? 10
    const skip = (page - 1) * limit

    // Build query based on role
    const isVolunteer = options?.role === 'volunteer'
    const isElderly = options?.role === 'elderly'
    const isFamily = options?.role === 'family'

    // Define include based on role
    const include = isVolunteer
      ? {
        assignedElderly: {
          select: { id: true, name: true, vayoId: true, age: true, villageName: true }
        }
      }
      : isElderly
        ? {
          assignedFamily: {
            select: { id: true, name: true, phone: true, email: true }
          },
          assignedVolunteer: {
            select: { id: true, name: true, phone: true }
          }
        }
        : isFamily
          ? {
            familyElders: {
              select: { id: true, name: true, vayoId: true, age: true, villageName: true, gender: true }
            }
          }
          : undefined

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        ...(include && { include }),
      }),
      prisma.user.count({ where }),
    ])

    return {
      users: users.map(u => {
        const safeUser = toSafeUser(prismaUserToAppUser(u))
        // Add related data to the safe user based on role
        const userWithRelations = u as Record<string, unknown>
        if ('assignedElderly' in u && Array.isArray(userWithRelations.assignedElderly)) {
          (safeUser as any).assignedElderly = userWithRelations.assignedElderly as unknown[]
        }
        if ('familyElders' in u && Array.isArray(userWithRelations.familyElders)) {
          (safeUser as any).familyElders = userWithRelations.familyElders as unknown[]
        }
        if ('assignedFamily' in u && userWithRelations.assignedFamily) {
          (safeUser as any).assignedFamily = userWithRelations.assignedFamily
        }
        if ('assignedVolunteer' in u && userWithRelations.assignedVolunteer) {
          (safeUser as any).assignedVolunteer = userWithRelations.assignedVolunteer
        }
        return safeUser
      }),
      total,
    }
  }

  async getUsersByRole(role: string): Promise<SafeUser[]> {
    const users = await prisma.user.findMany({
      where: { role: role as Prisma.UserWhereInput['role'] },
      orderBy: { createdAt: 'desc' },
    })
    return users.map(u => toSafeUser(prismaUserToAppUser(u)))
  }

  async getElderlyByVolunteer(volunteerId: string): Promise<SafeUser[]> {
    const users = await prisma.user.findMany({
      where: {
        role: 'elderly',
        assignedVolunteerId: volunteerId,
      },
      orderBy: { name: 'asc' },
    })
    return users.map(u => toSafeUser(prismaUserToAppUser(u)))
  }

  async getElderlyByFamily(familyId: string): Promise<SafeUser[]> {
    const users = await prisma.user.findMany({
      where: {
        role: 'elderly',
        assignedFamilyId: familyId,
      },
      orderBy: { name: 'asc' },
      include: {
        assignedVolunteer: {
          select: { id: true, name: true, phone: true }
        },
        assessmentsAsSubject: {
          take: 1,
          orderBy: { assessedAt: 'desc' },
          select: { id: true, overallRisk: true, assessedAt: true }
        }
      }
    })
    return users.map(u => {
      const safeUser = toSafeUser(prismaUserToAppUser(u))
      const userWithRelations = u as Record<string, unknown>
      if (userWithRelations.assignedVolunteer) {
        (safeUser as any).assignedVolunteer = userWithRelations.assignedVolunteer
      }
      if (userWithRelations.assessmentsAsSubject) {
        (safeUser as SafeUser & { latestAssessment: unknown }).latestAssessment = (userWithRelations.assessmentsAsSubject as unknown[])[0] || null
      }
      return safeUser
    })
  }

  // ==========================================
  // REFRESH TOKEN METHODS
  // ==========================================

  async storeRefreshToken(token: string, userId: string, expiresAt: Date): Promise<void> {
    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    })
  }

  async getRefreshTokenUserId(token: string): Promise<string | undefined> {
    const refreshToken = await prisma.refreshToken.findUnique({
      where: { token },
    })

    if (!refreshToken || refreshToken.expiresAt < new Date()) {
      if (refreshToken) {
        await prisma.refreshToken.delete({ where: { token } })
      }
      return undefined
    }

    return refreshToken.userId
  }

  async revokeRefreshToken(token: string): Promise<void> {
    try {
      await prisma.refreshToken.delete({
        where: { token },
      })
    } catch {
      // Token may not exist
    }
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { userId },
    })
  }

  // ==========================================
  // PASSWORD RESET TOKEN METHODS
  // ==========================================

  async storePasswordResetToken(token: string, userId: string, expiresInMs: number = 3600000): Promise<void> {
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId,
        expiresAt: new Date(Date.now() + expiresInMs),
      },
    })
  }

  async getPasswordResetToken(token: string): Promise<{ userId: string; expiresAt: number } | undefined> {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    })

    if (!resetToken || resetToken.expiresAt < new Date()) {
      if (resetToken) {
        await prisma.passwordResetToken.delete({ where: { token } })
      }
      return undefined
    }

    return {
      userId: resetToken.userId,
      expiresAt: resetToken.expiresAt.getTime(),
    }
  }

  async deletePasswordResetToken(token: string): Promise<void> {
    try {
      await prisma.passwordResetToken.delete({
        where: { token },
      })
    } catch {
      // Token may not exist
    }
  }

  // ==========================================
  // ASSESSMENT METHODS
  // ==========================================

  async createAssessment(data: {
    subjectId: string
    assessorId: string
    overallRisk?: RiskLevel
    status?: AssessmentStatus
    currentStep?: number
    notes?: string
    domainScores?: Prisma.InputJsonValue
  }) {
    return prisma.assessment.create({
      data: {
        subjectId: data.subjectId,
        assessorId: data.assessorId,
        overallRisk: data.overallRisk || 'healthy',
        status: data.status || 'completed',
        currentStep: data.currentStep,
        notes: data.notes,
        domainScores: data.domainScores,
      },
      include: {
        subject: { select: { id: true, name: true, email: true } },
        assessor: { select: { id: true, name: true, email: true } },
        domains: true,
        interventions: true,
      },
    })
  }

  async getAssessmentById(id: string) {
    return prisma.assessment.findUnique({
      where: { id },
      include: {
        subject: { select: { id: true, name: true, email: true, age: true, gender: true, address: true, vayoId: true } },
        assessor: { select: { id: true, name: true, email: true, role: true } },
        domains: true,
        interventions: true,
      },
    })
  }

  async getAllAssessments(options?: {
    subjectId?: string
    assessorId?: string
    overallRisk?: RiskLevel
    status?: AssessmentStatus
    startDate?: Date
    endDate?: Date
    page?: number
    limit?: number
  }) {
    const where: Prisma.AssessmentWhereInput = {}

    if (options?.subjectId) where.subjectId = options.subjectId
    if (options?.assessorId) where.assessorId = options.assessorId
    if (options?.overallRisk) where.overallRisk = options.overallRisk
    if (options?.status) where.status = options.status
    if (options?.startDate || options?.endDate) {
      where.assessedAt = {}
      if (options?.startDate) where.assessedAt.gte = options.startDate
      if (options?.endDate) where.assessedAt.lte = options.endDate
    }

    const page = options?.page ?? 1
    const limit = options?.limit ?? 10
    const skip = (page - 1) * limit

    const [assessments, total] = await Promise.all([
      prisma.assessment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { assessedAt: 'desc' },
        include: {
          subject: { select: { id: true, name: true, email: true, vayoId: true } },
          assessor: { select: { id: true, name: true, email: true, role: true } },
          domains: true,
        },
      }),
      prisma.assessment.count({ where }),
    ])

    return { assessments, total }
  }

  // Get draft assessments for a specific subject (to check if there's an existing draft to resume)
  async getDraftAssessment(subjectId: string, assessorId: string) {
    return prisma.assessment.findFirst({
      where: {
        subjectId,
        assessorId,
        status: 'draft',
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        subject: { select: { id: true, name: true, email: true, vayoId: true } },
        assessor: { select: { id: true, name: true, email: true, role: true } },
        domains: true,
      },
    })
  }

  // Get all draft assessments for an assessor
  async getDraftAssessments(assessorId: string) {
    return prisma.assessment.findMany({
      where: {
        assessorId,
        status: 'draft',
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        subject: { select: { id: true, name: true, email: true, vayoId: true, age: true, villageName: true } },
        domains: true,
      },
    })
  }

  async updateAssessment(id: string, data: {
    overallRisk?: RiskLevel
    status?: AssessmentStatus
    currentStep?: number
    notes?: string
    domainScores?: Prisma.InputJsonValue
  }) {
    return prisma.assessment.update({
      where: { id },
      data: {
        overallRisk: data.overallRisk,
        status: data.status,
        currentStep: data.currentStep,
        notes: data.notes,
        domainScores: data.domainScores,
      },
      include: {
        subject: { select: { id: true, name: true, email: true } },
        assessor: { select: { id: true, name: true, email: true } },
        domains: true,
        interventions: true,
      },
    })
  }

  async deleteAssessment(id: string): Promise<boolean> {
    try {
      await prisma.assessment.delete({ where: { id } })
      return true
    } catch {
      return false
    }
  }

  // ==========================================
  // ASSESSMENT DOMAIN METHODS
  // ==========================================

  async createAssessmentDomain(data: {
    assessmentId: string
    domain: string
    riskLevel?: RiskLevel
    score?: number
    answers?: Record<string, unknown>
    notes?: string
  }) {
    return prisma.assessmentDomain.create({
      data: {
        assessmentId: data.assessmentId,
        domain: data.domain,
        riskLevel: data.riskLevel || 'healthy',
        score: data.score,
        answers: data.answers as any,
        notes: data.notes,
      },
    })
  }

  async getAssessmentDomains(assessmentId: string) {
    return prisma.assessmentDomain.findMany({
      where: { assessmentId },
      orderBy: { domain: 'asc' },
    })
  }

  async updateAssessmentDomain(id: string, data: {
    riskLevel?: RiskLevel
    score?: number
    answers?: Record<string, unknown>
    notes?: string
  }) {
    return prisma.assessmentDomain.update({
      where: { id },
      data: {
        riskLevel: data.riskLevel,
        score: data.score,
        answers: data.answers as any,
        notes: data.notes,
      },
    })
  }

  async deleteAssessmentDomain(id: string): Promise<boolean> {
    try {
      await prisma.assessmentDomain.delete({ where: { id } })
      return true
    } catch {
      return false
    }
  }

  async upsertAssessmentDomains(assessmentId: string, domains: Array<{
    domain: string
    riskLevel?: RiskLevel
    score?: number
    answers?: Record<string, unknown>
    notes?: string
  }>) {
    const results = await Promise.all(
      domains.map(d =>
        prisma.assessmentDomain.upsert({
          where: {
            assessmentId_domain: {
              assessmentId,
              domain: d.domain,
            },
          },
          create: {
            assessmentId,
            domain: d.domain,
            riskLevel: d.riskLevel || 'healthy',
            score: d.score,
            answers: d.answers as any,
            notes: d.notes,
          },
          update: {
            riskLevel: d.riskLevel,
            score: d.score,
            answers: d.answers as any,
            notes: d.notes,
          },
        })
      )
    )
    return results
  }

  // ==========================================
  // INTERVENTION METHODS
  // ==========================================

  async createIntervention(data: {
    userId: string
    assessmentId?: string
    title: string
    description?: string
    domain: string
    priority?: string
    status?: string
    dueDate?: Date
    notes?: string
  }) {
    return prisma.intervention.create({
      data: {
        userId: data.userId,
        assessmentId: data.assessmentId,
        title: data.title,
        description: data.description,
        domain: data.domain,
        priority: data.priority || 'medium',
        status: data.status || 'pending',
        dueDate: data.dueDate,
        notes: data.notes,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        assessment: { select: { id: true, assessedAt: true, overallRisk: true } },
      },
    })
  }

  async getInterventionById(id: string) {
    return prisma.intervention.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, age: true, address: true } },
        assessment: { select: { id: true, assessedAt: true, overallRisk: true } },
      },
    })
  }

  async getAllInterventions(options?: {
    userId?: string
    assessmentId?: string
    domain?: string
    priority?: string
    status?: string
    page?: number
    limit?: number
  }) {
    const where: Prisma.InterventionWhereInput = {}

    if (options?.userId) where.userId = options.userId
    if (options?.assessmentId) where.assessmentId = options.assessmentId
    if (options?.domain) where.domain = options.domain
    if (options?.priority) where.priority = options.priority
    if (options?.status) where.status = options.status

    const page = options?.page ?? 1
    const limit = options?.limit ?? 10
    const skip = (page - 1) * limit

    const [interventions, total] = await Promise.all([
      prisma.intervention.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
        include: {
          user: { select: { id: true, name: true, email: true, vayoId: true } },
          assessment: { select: { id: true, assessedAt: true, overallRisk: true } },
        },
      }),
      prisma.intervention.count({ where }),
    ])

    return { interventions, total }
  }

  async updateIntervention(id: string, data: {
    title?: string
    description?: string
    domain?: string
    priority?: string
    status?: string
    dueDate?: Date | null
    completedAt?: Date | null
    notes?: string
  }) {
    return prisma.intervention.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        domain: data.domain,
        priority: data.priority,
        status: data.status,
        dueDate: data.dueDate,
        completedAt: data.completedAt,
        notes: data.notes,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        assessment: { select: { id: true, assessedAt: true, overallRisk: true } },
      },
    })
  }

  async deleteIntervention(id: string): Promise<boolean> {
    try {
      await prisma.intervention.delete({ where: { id } })
      return true
    } catch {
      return false
    }
  }

  async completeIntervention(id: string, notes?: string) {
    return prisma.intervention.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        notes: notes,
      },
    })
  }

  // ==========================================
  // AUDIT LOG METHODS
  // ==========================================

  async createAuditLog(data: {
    userId?: string
    action: string
    entity: string
    entityId?: string
    details?: Record<string, unknown>
    ipAddress?: string
    userAgent?: string
  }): Promise<void> {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        details: data.details as any,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    })
  }

  async getAuditLogs(options?: {
    userId?: string
    action?: string
    entity?: string
    entityId?: string
    startDate?: Date
    endDate?: Date
    page?: number
    limit?: number
  }) {
    const where: Prisma.AuditLogWhereInput = {}

    if (options?.userId) where.userId = options.userId
    if (options?.action) where.action = options.action
    if (options?.entity) where.entity = options.entity
    if (options?.entityId) where.entityId = options.entityId
    if (options?.startDate || options?.endDate) {
      where.createdAt = {}
      if (options?.startDate) where.createdAt.gte = options.startDate
      if (options?.endDate) where.createdAt.lte = options.endDate
    }

    const page = options?.page ?? 1
    const limit = options?.limit ?? 50
    const skip = (page - 1) * limit

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ])

    return { logs, total }
  }

  // ==========================================
  // DASHBOARD STATS
  // ==========================================

  async getDashboardStats() {
    const [
      totalUsers,
      totalElderly,
      totalAssessments,
      totalInterventions,
      pendingInterventions,
      riskDistribution,
    ] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'elderly', isActive: true } }),
      prisma.assessment.count(),
      prisma.intervention.count(),
      prisma.intervention.count({ where: { status: 'pending' } }),
      prisma.assessment.groupBy({
        by: ['overallRisk'],
        _count: { id: true },
      }),
    ])

    return {
      totalUsers,
      totalElderly,
      totalAssessments,
      totalInterventions,
      pendingInterventions,
      riskDistribution: riskDistribution.reduce((acc, item) => {
        acc[item.overallRisk] = item._count.id
        return acc
      }, {} as Record<string, number>),
    }
  }

  // ==========================================
  // LOCATION METHODS
  // ==========================================

  async getAllLocations(options?: {
    type?: string
    parentId?: string | null
  }) {
    const where: Prisma.LocationWhereInput = {}

    if (options?.type) where.type = options.type
    if (options?.parentId !== undefined) where.parentId = options.parentId

    return prisma.location.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        parent: { select: { id: true, name: true, type: true } },
      },
    })
  }

  async getLocationById(id: string) {
    return prisma.location.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true, type: true } },
        children: { select: { id: true, name: true, type: true } },
      },
    })
  }

  async createLocation(data: {
    type: string
    name: string
    parentId?: string
  }) {
    return prisma.location.create({
      data: {
        type: data.type,
        name: data.name,
        parentId: data.parentId,
      },
    })
  }

  async deleteLocation(id: string): Promise<boolean> {
    try {
      await prisma.location.delete({ where: { id } })
      return true
    } catch {
      return false
    }
  }

  // ==========================================
  // FOLLOW-UP METHODS
  // ==========================================

  async createFollowUp(data: {
    elderlyId: string
    assigneeId?: string | null
    type: string
    title: string
    description?: string
    scheduledDate: Date
    assessmentId?: string
    notes?: string
  }) {
    return prisma.followUp.create({
      data: {
        elderlyId: data.elderlyId,
        // Convert empty string to null for optional foreign key
        assigneeId: data.assigneeId || null,
        type: data.type,
        title: data.title,
        description: data.description,
        scheduledDate: data.scheduledDate,
        assessmentId: data.assessmentId,
        notes: data.notes,
      },
      include: {
        elderly: { select: { id: true, name: true, vayoId: true } },
        assignee: { select: { id: true, name: true, role: true } },
      },
    })
  }

  async getFollowUpById(id: string) {
    return prisma.followUp.findUnique({
      where: { id },
      include: {
        elderly: { select: { id: true, name: true, vayoId: true, phone: true, address: true } },
        assignee: { select: { id: true, name: true, role: true, phone: true } },
      },
    })
  }

  async getAllFollowUps(options?: {
    elderlyId?: string
    assigneeId?: string
    type?: string
    status?: string
    startDate?: Date
    endDate?: Date
    page?: number
    limit?: number
  }) {
    const where: Prisma.FollowUpWhereInput = {}

    if (options?.elderlyId) where.elderlyId = options.elderlyId
    if (options?.assigneeId) where.assigneeId = options.assigneeId
    if (options?.type) where.type = options.type
    if (options?.status) where.status = options.status
    if (options?.startDate || options?.endDate) {
      where.scheduledDate = {}
      if (options?.startDate) where.scheduledDate.gte = options.startDate
      if (options?.endDate) where.scheduledDate.lte = options.endDate
    }

    const page = options?.page ?? 1
    const limit = options?.limit ?? 10
    const skip = (page - 1) * limit

    const [followUps, total] = await Promise.all([
      prisma.followUp.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledDate: 'asc' },
        include: {
          elderly: { select: { id: true, name: true, vayoId: true } },
          assignee: { select: { id: true, name: true, role: true } },
        },
      }),
      prisma.followUp.count({ where }),
    ])

    return { followUps, total }
  }

  async updateFollowUp(id: string, data: {
    assigneeId?: string | null
    type?: string
    title?: string
    description?: string
    scheduledDate?: Date
    completedDate?: Date | null
    status?: string
    notes?: string
  }) {
    // Build update data, only including fields that are provided
    // Handle assigneeId specially - convert empty string to null
    const updateData: Record<string, unknown> = {}
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId || null
    if (data.type !== undefined) updateData.type = data.type
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.scheduledDate !== undefined) updateData.scheduledDate = data.scheduledDate
    if (data.completedDate !== undefined) updateData.completedDate = data.completedDate
    if (data.status !== undefined) updateData.status = data.status
    if (data.notes !== undefined) updateData.notes = data.notes

    return prisma.followUp.update({
      where: { id },
      data: updateData,
      include: {
        elderly: { select: { id: true, name: true, vayoId: true } },
        assignee: { select: { id: true, name: true, role: true } },
      },
    })
  }

  async completeFollowUp(id: string, notes?: string) {
    return prisma.followUp.update({
      where: { id },
      data: {
        status: 'completed',
        completedDate: new Date(),
        notes: notes,
      },
    })
  }

  async deleteFollowUp(id: string): Promise<boolean> {
    try {
      await prisma.followUp.delete({ where: { id } })
      return true
    } catch {
      return false
    }
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  toSafeUser(user: User): SafeUser {
    return toSafeUser(user)
  }
}

// Singleton instance
export const db = new Database()
