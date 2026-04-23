import { PrismaClient, UserRole, Gender, RiskLevel } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

async function main() {
  console.log('🌱 Starting database seed...')

  // Clean existing data (in reverse order of dependencies)
  console.log('🧹 Cleaning existing data...')
  await prisma.auditLog.deleteMany()
  await prisma.assessmentDomain.deleteMany()
  await prisma.intervention.deleteMany()
  await prisma.assessment.deleteMany()
  await prisma.followUp.deleteMany()
  await prisma.passwordResetToken.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.document.deleteMany()
  await prisma.user.deleteMany()
  await prisma.location.deleteMany()

  // ========================================
  // 0. SEED LOCATIONS (State → District → Taluk → Village)
  // ========================================
  console.log('📍 Creating locations...')

  // States
  const karnataka = await prisma.location.create({
    data: { type: 'state', name: 'Karnataka' },
  })
  const tamilNadu = await prisma.location.create({
    data: { type: 'state', name: 'Tamil Nadu' },
  })
  const kerala = await prisma.location.create({
    data: { type: 'state', name: 'Kerala' },
  })
  const maharashtra = await prisma.location.create({
    data: { type: 'state', name: 'Maharashtra' },
  })

  // Karnataka Districts
  const bangalore = await prisma.location.create({
    data: { type: 'district', name: 'Bangalore Urban', parentId: karnataka.id },
  })
  const mysore = await prisma.location.create({
    data: { type: 'district', name: 'Mysore', parentId: karnataka.id },
  })
  const belgaum = await prisma.location.create({
    data: { type: 'district', name: 'Belgaum', parentId: karnataka.id },
  })

  // Tamil Nadu Districts
  const chennai = await prisma.location.create({
    data: { type: 'district', name: 'Chennai', parentId: tamilNadu.id },
  })
  const coimbatore = await prisma.location.create({
    data: { type: 'district', name: 'Coimbatore', parentId: tamilNadu.id },
  })
  const madurai = await prisma.location.create({
    data: { type: 'district', name: 'Madurai', parentId: tamilNadu.id },
  })

  // Kerala Districts
  const thiruvananthapuram = await prisma.location.create({
    data: { type: 'district', name: 'Thiruvananthapuram', parentId: kerala.id },
  })
  const kochi = await prisma.location.create({
    data: { type: 'district', name: 'Ernakulam', parentId: kerala.id },
  })

  // Maharashtra Districts
  const mumbai = await prisma.location.create({
    data: { type: 'district', name: 'Mumbai', parentId: maharashtra.id },
  })
  const pune = await prisma.location.create({
    data: { type: 'district', name: 'Pune', parentId: maharashtra.id },
  })

  // Bangalore Taluks
  const bnNorth = await prisma.location.create({
    data: { type: 'taluk', name: 'Bangalore North', parentId: bangalore.id },
  })
  const bnSouth = await prisma.location.create({
    data: { type: 'taluk', name: 'Bangalore South', parentId: bangalore.id },
  })
  const bnEast = await prisma.location.create({
    data: { type: 'taluk', name: 'Bangalore East', parentId: bangalore.id },
  })

  // Mysore Taluks
  const mysoreCity = await prisma.location.create({
    data: { type: 'taluk', name: 'Mysore City', parentId: mysore.id },
  })
  const nanjanagud = await prisma.location.create({
    data: { type: 'taluk', name: 'Nanjanagud', parentId: mysore.id },
  })

  // Chennai Taluks
  const egmore = await prisma.location.create({
    data: { type: 'taluk', name: 'Egmore', parentId: chennai.id },
  })
  const mylapore = await prisma.location.create({
    data: { type: 'taluk', name: 'Mylapore', parentId: chennai.id },
  })

  // Coimbatore Taluks
  const coimbatoreNorth = await prisma.location.create({
    data: { type: 'taluk', name: 'Coimbatore North', parentId: coimbatore.id },
  })
  const coimbatoreSouth = await prisma.location.create({
    data: { type: 'taluk', name: 'Coimbatore South', parentId: coimbatore.id },
  })

  // Villages - Bangalore North
  await prisma.location.createMany({
    data: [
      { type: 'village', name: 'Yelahanka', parentId: bnNorth.id },
      { type: 'village', name: 'Hebbal', parentId: bnNorth.id },
      { type: 'village', name: 'Sahakara Nagar', parentId: bnNorth.id },
      { type: 'village', name: 'Vidyaranyapura', parentId: bnNorth.id },
    ],
  })

  // Villages - Bangalore South
  await prisma.location.createMany({
    data: [
      { type: 'village', name: 'Jayanagar', parentId: bnSouth.id },
      { type: 'village', name: 'JP Nagar', parentId: bnSouth.id },
      { type: 'village', name: 'Banashankari', parentId: bnSouth.id },
      { type: 'village', name: 'BTM Layout', parentId: bnSouth.id },
    ],
  })

  // Villages - Bangalore East
  await prisma.location.createMany({
    data: [
      { type: 'village', name: 'Indiranagar', parentId: bnEast.id },
      { type: 'village', name: 'Whitefield', parentId: bnEast.id },
      { type: 'village', name: 'Marathahalli', parentId: bnEast.id },
    ],
  })

  // Villages - Mysore City
  await prisma.location.createMany({
    data: [
      { type: 'village', name: 'Vijayanagar', parentId: mysoreCity.id },
      { type: 'village', name: 'Kuvempunagar', parentId: mysoreCity.id },
      { type: 'village', name: 'Gokulam', parentId: mysoreCity.id },
    ],
  })

  // Villages - Nanjanagud
  await prisma.location.createMany({
    data: [
      { type: 'village', name: 'Nanjanagud Town', parentId: nanjanagud.id },
      { type: 'village', name: 'Hedathale', parentId: nanjanagud.id },
    ],
  })

  // Villages - Chennai Egmore
  await prisma.location.createMany({
    data: [
      { type: 'village', name: 'Egmore Ward', parentId: egmore.id },
      { type: 'village', name: 'Purasawalkam', parentId: egmore.id },
      { type: 'village', name: 'Kilpauk', parentId: egmore.id },
    ],
  })

  // Villages - Chennai Mylapore
  await prisma.location.createMany({
    data: [
      { type: 'village', name: 'Mylapore Ward', parentId: mylapore.id },
      { type: 'village', name: 'Adyar', parentId: mylapore.id },
      { type: 'village', name: 'Thiruvanmiyur', parentId: mylapore.id },
    ],
  })

  // Villages - Coimbatore North
  await prisma.location.createMany({
    data: [
      { type: 'village', name: 'Gandhipuram', parentId: coimbatoreNorth.id },
      { type: 'village', name: 'RS Puram', parentId: coimbatoreNorth.id },
    ],
  })

  // Villages - Coimbatore South
  await prisma.location.createMany({
    data: [
      { type: 'village', name: 'Singanallur', parentId: coimbatoreSouth.id },
      { type: 'village', name: 'Peelamedu', parentId: coimbatoreSouth.id },
    ],
  })

  console.log(`✅ Created locations (4 states, 10 districts, 9 taluks, 27 villages)`)

  // ========================================
  // 1. SEED USERS
  // ========================================
  console.log('👥 Creating users...')

  // Super Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@vayo.health',
      password: await hashPassword('1234'),
      name: 'Dr. Rajesh Kumar',
      phone: '9000000001',
      role: UserRole.super_admin,
      isActive: true,
      emailVerified: true,
      vayoId: 'VAAD0001',
      age: 45,
      gender: Gender.male,
      stateName: 'Karnataka',
      districtName: 'Bangalore Urban',
    },
  })

  // Professionals (Doctors/Healthcare Workers)
  const doctor1 = await prisma.user.create({
    data: {
      email: 'coreclinicalteam@vayo.health',
      password: await hashPassword('1234'),
      name: 'Dr. Priya Sharma',
      phone: '9000000002',
      role: UserRole.professional,
      isActive: true,
      emailVerified: true,
      vayoId: 'VAHP0001',
      age: 38,
      gender: Gender.female,
      stateName: 'Karnataka',
      districtName: 'Bangalore Urban',
    },
  })

  const doctor2 = await prisma.user.create({
    data: {
      email: 'dr.anita@vayo.health',
      password: await hashPassword('1234'),
      name: 'Dr. Anita Verma',
      phone: '9000000005',
      role: UserRole.professional,
      isActive: true,
      emailVerified: true,
      vayoId: 'VAHP0002',
      age: 42,
      gender: Gender.female,
      stateName: 'Karnataka',
      districtName: 'Mysore',
    },
  })

  const doctor3 = await prisma.user.create({
    data: {
      email: 'dr.suresh@vayo.health',
      password: await hashPassword('1234'),
      name: 'Dr. Suresh Patel',
      phone: '9000000006',
      role: UserRole.professional,
      isActive: true,
      emailVerified: true,
      vayoId: 'VAHP0003',
      age: 50,
      gender: Gender.male,
      stateName: 'Tamil Nadu',
      districtName: 'Chennai',
    },
  })

  // Volunteers
  const volunteer1 = await prisma.user.create({
    data: {
      email: 'volunteer@vayo.health',
      password: await hashPassword('1234'),
      name: 'Amit Singh',
      phone: '9000000003',
      role: UserRole.volunteer,
      isActive: true,
      emailVerified: true,
      maxAssignments: 10,
      vayoId: 'VAVL0001',
      age: 28,
      gender: Gender.male,
      stateName: 'Karnataka',
      districtName: 'Bangalore Urban',
      talukName: 'Bangalore North',
      villageName: 'Yelahanka',
    },
  })

  const volunteer2 = await prisma.user.create({
    data: {
      email: 'meera.volunteer@vayo.health',
      password: await hashPassword('1234'),
      name: 'Meera Kumari',
      phone: '9000000007',
      role: UserRole.volunteer,
      isActive: true,
      emailVerified: true,
      maxAssignments: 8,
      vayoId: 'VAVL0002',
      age: 32,
      gender: Gender.female,
      stateName: 'Karnataka',
      districtName: 'Mysore',
      talukName: 'Mysore City',
      villageName: 'Vijayanagar',
    },
  })

  const volunteer3 = await prisma.user.create({
    data: {
      email: 'rahul.volunteer@vayo.health',
      password: await hashPassword('1234'),
      name: 'Rahul Gupta',
      phone: '9000000008',
      role: UserRole.volunteer,
      isActive: true,
      emailVerified: true,
      maxAssignments: 12,
      vayoId: 'VAVL0003',
      age: 35,
      gender: Gender.male,
      stateName: 'Tamil Nadu',
      districtName: 'Coimbatore',
      talukName: 'Coimbatore North',
      villageName: 'Gandhipuram',
    },
  })

  // Family Members
  const family1 = await prisma.user.create({
    data: {
      email: 'family@vayo.health',
      password: await hashPassword('1234'),
      name: 'Sunita Devi',
      phone: '9000000004',
      role: UserRole.family,
      isActive: true,
      emailVerified: true,
      vayoId: 'VAFM0001',
      age: 45,
      gender: Gender.female,
      stateName: 'Karnataka',
      districtName: 'Bangalore Urban',
      talukName: 'Bangalore North',
      villageName: 'Yelahanka',
    },
  })

  const family2 = await prisma.user.create({
    data: {
      email: 'vikram.family@vayo.health',
      password: await hashPassword('1234'),
      name: 'Vikram Prasad',
      phone: '9000000009',
      role: UserRole.family,
      isActive: true,
      emailVerified: true,
      vayoId: 'VAFM0002',
      age: 40,
      gender: Gender.male,
      stateName: 'Karnataka',
      districtName: 'Bangalore Urban',
      talukName: 'Bangalore South',
      villageName: 'JP Nagar',
    },
  })

  const family3 = await prisma.user.create({
    data: {
      email: 'neha.family@vayo.health',
      password: await hashPassword('1234'),
      name: 'Neha Sharma',
      phone: '9000000010',
      role: UserRole.family,
      isActive: true,
      emailVerified: true,
      vayoId: 'VAFM0003',
      age: 38,
      gender: Gender.female,
      stateName: 'Karnataka',
      districtName: 'Mysore',
      talukName: 'Mysore City',
      villageName: 'Vijayanagar',
    },
  })

  // Elderly Users
  // NOTE: elderly1 shares phone with family1 (Sunita Devi) - demonstrates multi-profile login
  const elderly1 = await prisma.user.create({
    data: {
      email: 'elderly@vayo.health',
      password: await hashPassword('1234'),
      name: 'Shri Ram Prasad',
      phone: '9000000004', // Same phone as family1 (Sunita Devi) - her father
      role: UserRole.elderly,
      isActive: true,
      emailVerified: true,
      vayoId: 'VAEL0001',
      age: 72,
      gender: Gender.male,
      address: 'Block A, Yelahanka, Bangalore 560064',
      emergencyContact: '9000000004',
      dateOfBirth: new Date('1952-05-15'),
      stateName: 'Karnataka',
      districtName: 'Bangalore Urban',
      talukName: 'Bangalore North',
      villageName: 'Yelahanka',
      caregiverName: 'Sunita Devi',
      caregiverPhone: '9000000004',
      caregiverRelation: 'daughter',
      assignedVolunteerId: volunteer1.id,
      assignedFamilyId: family1.id,
    },
  })

  // NOTE: elderly2 shares phone with family2 (Vikram Prasad) - demonstrates multi-profile login with 2 elders
  const elderly2 = await prisma.user.create({
    data: {
      email: 'kamla.devi@vayo.health',
      password: await hashPassword('1234'),
      name: 'Kamla Devi',
      phone: '9000000009', // Same phone as family2 (Vikram Prasad) - his mother
      role: UserRole.elderly,
      isActive: true,
      emailVerified: true,
      vayoId: 'VAEL0002',
      age: 68,
      gender: Gender.female,
      address: '45, JP Nagar 7th Phase, Bangalore 560078',
      emergencyContact: '9000000009',
      dateOfBirth: new Date('1956-08-20'),
      stateName: 'Karnataka',
      districtName: 'Bangalore Urban',
      talukName: 'Bangalore South',
      villageName: 'JP Nagar',
      caregiverName: 'Vikram Prasad',
      caregiverPhone: '9000000009',
      caregiverRelation: 'son',
      assignedVolunteerId: volunteer1.id,
      assignedFamilyId: family2.id,
    },
  })

  // elderly7 - Vikram's father, also shares phone 9000000009 (3 profiles on one phone)
  const elderly7 = await prisma.user.create({
    data: {
      email: 'gopal.prasad@vayo.health',
      password: await hashPassword('1234'),
      name: 'Gopal Prasad',
      phone: '9000000009', // Same phone as family2 (Vikram) and elderly2 (Kamla) - his father
      role: UserRole.elderly,
      isActive: true,
      emailVerified: true,
      vayoId: 'VAEL0007',
      age: 74,
      gender: Gender.male,
      address: '45, JP Nagar 7th Phase, Bangalore 560078',
      emergencyContact: '9000000009',
      dateOfBirth: new Date('1950-02-14'),
      stateName: 'Karnataka',
      districtName: 'Bangalore Urban',
      talukName: 'Bangalore South',
      villageName: 'JP Nagar',
      caregiverName: 'Vikram Prasad',
      caregiverPhone: '9000000009',
      caregiverRelation: 'son',
      assignedVolunteerId: volunteer1.id,
      assignedFamilyId: family2.id,
    },
  })

  const elderly3 = await prisma.user.create({
    data: {
      email: 'hari.om@vayo.health',
      password: await hashPassword('1234'),
      name: 'Hari Om Sharma',
      phone: '9000000013',
      role: UserRole.elderly,
      isActive: true,
      emailVerified: true,
      vayoId: 'VAEL0003',
      age: 75,
      gender: Gender.male,
      address: '12/B, Vijayanagar, Mysore 570017',
      emergencyContact: '+91 98765 43225',
      dateOfBirth: new Date('1949-03-10'),
      stateName: 'Karnataka',
      districtName: 'Mysore',
      talukName: 'Mysore City',
      villageName: 'Vijayanagar',
      caregiverName: 'Neha Sharma',
      caregiverPhone: '+91 98765 43225',
      caregiverRelation: 'daughter-in-law',
      assignedVolunteerId: volunteer2.id,
    },
  })

  const elderly4 = await prisma.user.create({
    data: {
      email: 'savitri.singh@vayo.health',
      password: await hashPassword('1234'),
      name: 'Savitri Singh',
      phone: '9000000014',
      role: UserRole.elderly,
      isActive: true,
      emailVerified: true,
      vayoId: 'VAEL0004',
      age: 70,
      gender: Gender.female,
      address: 'Flat 302, Adyar, Chennai 600020',
      emergencyContact: '+91 98765 43229',
      dateOfBirth: new Date('1954-11-25'),
      stateName: 'Tamil Nadu',
      districtName: 'Chennai',
      talukName: 'Mylapore',
      villageName: 'Adyar',
      caregiverName: 'Ravi Kumar',
      caregiverPhone: '+91 98765 43229',
      caregiverRelation: 'son',
      assignedVolunteerId: volunteer2.id,
    },
  })

  const elderly5 = await prisma.user.create({
    data: {
      email: 'mohan.lal@vayo.health',
      password: await hashPassword('1234'),
      name: 'Mohan Lal Agarwal',
      phone: '9000000015',
      role: UserRole.elderly,
      isActive: true,
      emailVerified: true,
      vayoId: 'VAEL0005',
      age: 78,
      gender: Gender.male,
      address: '78, Gandhipuram, Coimbatore 641012',
      emergencyContact: '+91 98765 43231',
      dateOfBirth: new Date('1946-07-04'),
      stateName: 'Tamil Nadu',
      districtName: 'Coimbatore',
      talukName: 'Coimbatore North',
      villageName: 'Gandhipuram',
      caregiverName: 'Priya Agarwal',
      caregiverPhone: '+91 98765 43231',
      caregiverRelation: 'daughter',
      assignedVolunteerId: volunteer3.id,
    },
  })

  const elderly6 = await prisma.user.create({
    data: {
      email: 'parvati.mishra@vayo.health',
      password: await hashPassword('1234'),
      name: 'Parvati Mishra',
      phone: '9000000016',
      role: UserRole.elderly,
      isActive: true,
      emailVerified: true,
      vayoId: 'VAEL0006',
      age: 66,
      gender: Gender.female,
      address: '23, Indiranagar, Bangalore 560038',
      emergencyContact: '+91 98765 43233',
      dateOfBirth: new Date('1958-12-18'),
      stateName: 'Karnataka',
      districtName: 'Bangalore Urban',
      talukName: 'Bangalore East',
      villageName: 'Indiranagar',
      caregiverName: 'Arun Mishra',
      caregiverPhone: '+91 98765 43233',
      caregiverRelation: 'spouse',
      assignedVolunteerId: volunteer3.id,
    },
  })

  console.log(`✅ Created ${17} users (including multi-profile demo accounts)`)

  // ========================================
  // 2. SEED ASSESSMENTS (new ICOPE 6-domain structure)
  // ========================================
  console.log('📋 Creating assessments...')

  type Answers = Record<string, number>
  type DomainData = Record<string, { answers: Answers; notes?: string }>
  const DOMAIN_IDS = ['cognitive', 'psychological', 'locomotor', 'sensory', 'vitality', 'social'] as const

  // Helper: compute risk level from summed answers (matches assessment-scoring.ts)
  const riskFromScore = (score: number): RiskLevel =>
    score <= 1 ? RiskLevel.healthy : score <= 3 ? RiskLevel.at_risk : RiskLevel.intervention

  const sumAnswers = (a: Answers) => Object.values(a).reduce((s, v) => s + v, 0)

  // Assessment 1 — Ram Prasad: mild cognitive + mobility issues
  const a1Domains: DomainData = {
    cognitive:     { answers: { cog_1: 1, cog_2: 1, cog_3: 1, cog_4: 0 }, notes: 'Mild short-term memory issues.' },
    psychological: { answers: { psy_1: 0, psy_2: 0, psy_3: 1, psy_4: 0, psy_5: 0 } },
    locomotor:     { answers: { loc_1: 1, loc_2: 0, loc_3: 1 }, notes: 'Uses walking stick occasionally.' },
    sensory:       { answers: { sen_1: 1, sen_2: 1, sen_3: 0 }, notes: 'Uses reading glasses.' },
    vitality:      { answers: { vit_1: 0, vit_2: 0, vit_3: 1 } },
    social:        { answers: { soc_1: 0, soc_2: 0, soc_3: 0, soc_4: 0 } },
  }
  const assessment1 = await prisma.assessment.create({
    data: {
      subjectId: elderly1.id,
      assessorId: volunteer1.id,
      assessedAt: new Date('2024-12-01'),
      overallRisk: RiskLevel.at_risk,
      notes: 'Initial ICOPE screening. Mild cognitive slip and reduced mobility.',
      domainScores: a1Domains,
    },
  })

  // Assessment 2 — Kamla Devi: healthy
  const a2Domains: DomainData = {
    cognitive:     { answers: { cog_1: 0, cog_2: 0, cog_3: 0, cog_4: 0 } },
    psychological: { answers: { psy_1: 0, psy_2: 0, psy_3: 0, psy_4: 0, psy_5: 0 } },
    locomotor:     { answers: { loc_1: 0, loc_2: 0, loc_3: 0 } },
    sensory:       { answers: { sen_1: 1, sen_2: 0, sen_3: 0 } },
    vitality:      { answers: { vit_1: 0, vit_2: 0, vit_3: 0 } },
    social:        { answers: { soc_1: 0, soc_2: 0, soc_3: 0, soc_4: 0 } },
  }
  const assessment2 = await prisma.assessment.create({
    data: {
      subjectId: elderly2.id,
      assessorId: doctor1.id,
      assessedAt: new Date('2024-11-15'),
      overallRisk: RiskLevel.healthy,
      notes: 'Good overall health. Minor hearing note.',
      domainScores: a2Domains,
    },
  })

  // Assessment 3 — Hari Om Sharma: significant cognitive, fall risk, nutrition concerns
  const a3Domains: DomainData = {
    cognitive:     { answers: { cog_1: 2, cog_2: 2, cog_3: 1, cog_4: 0 }, notes: 'Dementia screening recommended.' },
    psychological: { answers: { psy_1: 1, psy_2: 1, psy_3: 1, psy_4: 0, psy_5: 0 } },
    locomotor:     { answers: { loc_1: 2, loc_2: 2, loc_3: 1 }, notes: 'High fall risk — recent fall reported.' },
    sensory:       { answers: { sen_1: 1, sen_2: 2, sen_3: 0 }, notes: 'Cataract suspected.' },
    vitality:      { answers: { vit_1: 2, vit_2: 1, vit_3: 1 }, notes: 'Unintentional weight loss noted.' },
    social:        { answers: { soc_1: 1, soc_2: 0, soc_3: 1, soc_4: 0 } },
  }
  const assessment3 = await prisma.assessment.create({
    data: {
      subjectId: elderly3.id,
      assessorId: volunteer2.id,
      assessedAt: new Date('2024-11-20'),
      overallRisk: RiskLevel.intervention,
      notes: 'Needs immediate intervention. Cognitive decline and fall risk.',
      domainScores: a3Domains,
    },
  })

  // Assessment 4 — Savitri Singh: depression symptoms + appetite loss
  const a4Domains: DomainData = {
    cognitive:     { answers: { cog_1: 0, cog_2: 1, cog_3: 0, cog_4: 0 } },
    psychological: { answers: { psy_1: 2, psy_2: 2, psy_3: 1, psy_4: 1, psy_5: 0 }, notes: 'Depression symptoms prominent.' },
    locomotor:     { answers: { loc_1: 1, loc_2: 0, loc_3: 0 } },
    sensory:       { answers: { sen_1: 0, sen_2: 1, sen_3: 0 } },
    vitality:      { answers: { vit_1: 2, vit_2: 2, vit_3: 2 }, notes: 'Loss of appetite, fatigue.' },
    social:        { answers: { soc_1: 2, soc_2: 2, soc_3: 1, soc_4: 0 } },
  }
  const assessment4 = await prisma.assessment.create({
    data: {
      subjectId: elderly4.id,
      assessorId: doctor2.id,
      assessedAt: new Date('2024-12-05'),
      overallRisk: RiskLevel.intervention,
      notes: 'Depression screening positive. Nutritional support needed.',
      domainScores: a4Domains,
    },
  })

  // Assessment 5 — Mohan Lal: multiple severe concerns
  const a5Domains: DomainData = {
    cognitive:     { answers: { cog_1: 2, cog_2: 2, cog_3: 2, cog_4: 0 }, notes: 'Severe cognitive impairment.' },
    psychological: { answers: { psy_1: 1, psy_2: 1, psy_3: 1, psy_4: 1, psy_5: 0 } },
    locomotor:     { answers: { loc_1: 2, loc_2: 2, loc_3: 2 }, notes: 'Cannot walk independently.' },
    sensory:       { answers: { sen_1: 2, sen_2: 2, sen_3: 0 }, notes: 'Significant vision and hearing loss.' },
    vitality:      { answers: { vit_1: 2, vit_2: 2, vit_3: 2 }, notes: 'Malnutrition risk.' },
    social:        { answers: { soc_1: 2, soc_2: 2, soc_3: 2, soc_4: 0 } },
  }
  const assessment5 = await prisma.assessment.create({
    data: {
      subjectId: elderly5.id,
      assessorId: volunteer3.id,
      assessedAt: new Date('2024-10-25'),
      overallRisk: RiskLevel.intervention,
      notes: 'Multiple severe concerns. Comprehensive care plan required.',
      domainScores: a5Domains,
    },
  })

  // Assessment 6 — Parvati Mishra: healthy, active lifestyle
  const a6Domains: DomainData = {
    cognitive:     { answers: { cog_1: 0, cog_2: 0, cog_3: 0, cog_4: 0 } },
    psychological: { answers: { psy_1: 0, psy_2: 0, psy_3: 0, psy_4: 0, psy_5: 0 } },
    locomotor:     { answers: { loc_1: 0, loc_2: 0, loc_3: 0 } },
    sensory:       { answers: { sen_1: 1, sen_2: 0, sen_3: 0 } },
    vitality:      { answers: { vit_1: 0, vit_2: 0, vit_3: 0 } },
    social:        { answers: { soc_1: 0, soc_2: 0, soc_3: 0, soc_4: 0 } },
  }
  const assessment6 = await prisma.assessment.create({
    data: {
      subjectId: elderly6.id,
      assessorId: doctor3.id,
      assessedAt: new Date('2024-12-10'),
      overallRisk: RiskLevel.healthy,
      notes: 'Good overall health. Active lifestyle.',
      domainScores: a6Domains,
    },
  })

  // Assessment 7 — Follow-up for Ram Prasad: slight improvement
  const a7Domains: DomainData = {
    cognitive:     { answers: { cog_1: 1, cog_2: 0, cog_3: 1, cog_4: 0 } },
    psychological: { answers: { psy_1: 0, psy_2: 0, psy_3: 0, psy_4: 0, psy_5: 0 } },
    locomotor:     { answers: { loc_1: 1, loc_2: 0, loc_3: 0 }, notes: 'Improvement after physiotherapy.' },
    sensory:       { answers: { sen_1: 1, sen_2: 1, sen_3: 0 } },
    vitality:      { answers: { vit_1: 0, vit_2: 0, vit_3: 0 } },
    social:        { answers: { soc_1: 0, soc_2: 0, soc_3: 0, soc_4: 0 } },
  }
  const assessment7 = await prisma.assessment.create({
    data: {
      subjectId: elderly1.id,
      assessorId: doctor1.id,
      assessedAt: new Date('2024-12-15'),
      overallRisk: RiskLevel.at_risk,
      notes: 'Follow-up assessment. Slight improvement in mobility.',
      domainScores: a7Domains,
    },
  })

  console.log(`✅ Created ${7} assessments`)

  // ========================================
  // 3. SEED ASSESSMENT DOMAINS (one row per domain per assessment)
  // ========================================
  console.log('🏥 Creating assessment domains...')

  const allAssessmentDomains: Array<[string, DomainData]> = [
    [assessment1.id, a1Domains],
    [assessment2.id, a2Domains],
    [assessment3.id, a3Domains],
    [assessment4.id, a4Domains],
    [assessment5.id, a5Domains],
    [assessment6.id, a6Domains],
    [assessment7.id, a7Domains],
  ]

  for (const [assessmentId, domains] of allAssessmentDomains) {
    await prisma.assessmentDomain.createMany({
      data: DOMAIN_IDS.map(domainId => {
        const d = domains[domainId]
        const score = sumAnswers(d.answers)
        return {
          assessmentId,
          domain: domainId,
          riskLevel: riskFromScore(score),
          score,
          answers: d.answers,
          notes: d.notes,
        }
      }),
    })
  }

  console.log(`✅ Created assessment domains`)

  // ========================================
  // 4. SEED INTERVENTIONS
  // ========================================
  console.log('💊 Creating interventions...')

  await prisma.intervention.createMany({
    data: [
      // Interventions for Elderly 1 (Ram Prasad)
      {
        userId: elderly1.id,
        assessmentId: assessment1.id,
        title: 'Daily Cognitive Exercises',
        description: 'Complete brain training exercises including puzzles, memory games, and reading for 30 minutes daily.',
        domain: 'cognitive',
        priority: 'medium',
        status: 'in_progress',
        dueDate: new Date('2025-01-15'),
        notes: 'Family to assist with exercises.',
      },
      {
        userId: elderly1.id,
        assessmentId: assessment1.id,
        title: 'Physiotherapy Sessions',
        description: 'Attend physiotherapy twice a week for mobility improvement and fall prevention.',
        domain: 'locomotor',
        priority: 'high',
        status: 'in_progress',
        dueDate: new Date('2025-02-01'),
        notes: 'Sessions at community health center.',
      },
      {
        userId: elderly1.id,
        assessmentId: assessment1.id,
        title: 'Hearing Assessment',
        description: 'Schedule appointment with audiologist for hearing aid evaluation.',
        domain: 'sensory',
        priority: 'medium',
        status: 'pending',
        dueDate: new Date('2025-01-20'),
      },
      // Interventions for Elderly 3 (Hari Om Sharma) - High priority
      {
        userId: elderly3.id,
        assessmentId: assessment3.id,
        title: 'Urgent Neurologist Consultation',
        description: 'Refer to neurologist for comprehensive cognitive assessment and dementia screening.',
        domain: 'cognitive',
        priority: 'urgent',
        status: 'pending',
        dueDate: new Date('2024-12-20'),
        notes: 'Priority appointment needed.',
      },
      {
        userId: elderly3.id,
        assessmentId: assessment3.id,
        title: 'Home Safety Modifications',
        description: 'Install grab bars, non-slip mats, remove trip hazards, improve lighting.',
        domain: 'locomotor',
        priority: 'urgent',
        status: 'in_progress',
        dueDate: new Date('2024-12-25'),
        notes: 'Volunteer team to assist with installations.',
      },
      {
        userId: elderly3.id,
        assessmentId: assessment3.id,
        title: 'Walker/Wheelchair Assessment',
        description: 'Evaluate need for mobility aids - walker or wheelchair.',
        domain: 'locomotor',
        priority: 'high',
        status: 'pending',
        dueDate: new Date('2024-12-22'),
      },
      {
        userId: elderly3.id,
        assessmentId: assessment3.id,
        title: 'Nutritional Support Program',
        description: 'Enroll in community nutrition program. Dietitian to create meal plan.',
        domain: 'vitality',
        priority: 'high',
        status: 'pending',
        dueDate: new Date('2025-01-05'),
      },
      {
        userId: elderly3.id,
        assessmentId: assessment3.id,
        title: 'Ophthalmologist Referral',
        description: 'Cataract evaluation and treatment planning.',
        domain: 'sensory',
        priority: 'medium',
        status: 'pending',
        dueDate: new Date('2025-01-10'),
      },
      // Interventions for Elderly 4 (Savitri Singh)
      {
        userId: elderly4.id,
        assessmentId: assessment4.id,
        title: 'Mental Health Counseling',
        description: 'Weekly counseling sessions for depression management.',
        domain: 'psychological',
        priority: 'high',
        status: 'in_progress',
        dueDate: new Date('2025-02-28'),
        notes: 'Telehealth sessions available.',
      },
      {
        userId: elderly4.id,
        assessmentId: assessment4.id,
        title: 'Social Engagement Activities',
        description: 'Join community senior center activities twice a week.',
        domain: 'psychological',
        priority: 'medium',
        status: 'pending',
        dueDate: new Date('2025-01-15'),
      },
      {
        userId: elderly4.id,
        assessmentId: assessment4.id,
        title: 'Nutritional Counseling',
        description: 'Dietitian consultation for appetite improvement strategies.',
        domain: 'vitality',
        priority: 'medium',
        status: 'pending',
        dueDate: new Date('2025-01-08'),
      },
      // Interventions for Elderly 5 (Mohan Lal)
      {
        userId: elderly5.id,
        assessmentId: assessment5.id,
        title: 'Comprehensive Geriatric Assessment',
        description: 'Full multi-disciplinary assessment at geriatric clinic.',
        domain: 'cognitive',
        priority: 'urgent',
        status: 'pending',
        dueDate: new Date('2024-12-18'),
      },
      {
        userId: elderly5.id,
        assessmentId: assessment5.id,
        title: '24-Hour Care Evaluation',
        description: 'Assess need for full-time caregiver or assisted living.',
        domain: 'locomotor',
        priority: 'urgent',
        status: 'in_progress',
        dueDate: new Date('2024-12-20'),
        notes: 'Family meeting scheduled.',
      },
      {
        userId: elderly5.id,
        assessmentId: assessment5.id,
        title: 'Low Vision Rehabilitation',
        description: 'Enroll in low vision rehabilitation program.',
        domain: 'sensory',
        priority: 'high',
        status: 'pending',
        dueDate: new Date('2025-01-15'),
      },
      {
        userId: elderly5.id,
        assessmentId: assessment5.id,
        title: 'Cochlear Implant Evaluation',
        description: 'ENT specialist evaluation for cochlear implant candidacy.',
        domain: 'sensory',
        priority: 'high',
        status: 'pending',
        dueDate: new Date('2025-01-25'),
      },
      // Completed interventions
      {
        userId: elderly2.id,
        assessmentId: assessment2.id,
        title: 'Eye Examination',
        description: 'Annual comprehensive eye examination.',
        domain: 'sensory',
        priority: 'medium',
        status: 'completed',
        dueDate: new Date('2024-12-01'),
        completedAt: new Date('2024-11-28'),
        notes: 'New prescription glasses ordered.',
      },
      {
        userId: elderly6.id,
        assessmentId: assessment6.id,
        title: 'Hearing Screening',
        description: 'Basic hearing screening at community health camp.',
        domain: 'sensory',
        priority: 'low',
        status: 'completed',
        dueDate: new Date('2024-12-15'),
        completedAt: new Date('2024-12-12'),
        notes: 'Mild hearing loss detected. Monitoring recommended.',
      },
    ],
  })

  console.log(`✅ Created ${18} interventions`)

  // ========================================
  // 5. SEED AUDIT LOGS
  // ========================================
  console.log('📝 Creating audit logs...')

  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'login',
        entity: 'User',
        entityId: admin.id,
        details: { method: 'password', browser: 'Chrome', platform: 'Windows' },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        createdAt: new Date('2024-12-15T08:30:00'),
      },
      {
        userId: admin.id,
        action: 'create',
        entity: 'User',
        entityId: volunteer1.id,
        details: { role: 'volunteer', email: 'volunteer@vayo.health' },
        ipAddress: '192.168.1.100',
        createdAt: new Date('2024-12-15T08:35:00'),
      },
      {
        userId: doctor1.id,
        action: 'login',
        entity: 'User',
        entityId: doctor1.id,
        details: { method: 'password', browser: 'Firefox', platform: 'macOS' },
        ipAddress: '192.168.1.101',
        createdAt: new Date('2024-12-15T09:00:00'),
      },
      {
        userId: doctor1.id,
        action: 'create',
        entity: 'Assessment',
        entityId: assessment2.id,
        details: { subjectId: elderly2.id, overallRisk: 'healthy' },
        ipAddress: '192.168.1.101',
        createdAt: new Date('2024-12-15T09:30:00'),
      },
      {
        userId: volunteer1.id,
        action: 'login',
        entity: 'User',
        entityId: volunteer1.id,
        details: { method: 'password', browser: 'Chrome', platform: 'Android' },
        ipAddress: '192.168.1.102',
        createdAt: new Date('2024-12-15T10:00:00'),
      },
      {
        userId: volunteer1.id,
        action: 'create',
        entity: 'Assessment',
        entityId: assessment1.id,
        details: { subjectId: elderly1.id, overallRisk: 'at_risk' },
        ipAddress: '192.168.1.102',
        createdAt: new Date('2024-12-15T10:30:00'),
      },
      {
        userId: volunteer2.id,
        action: 'update',
        entity: 'Intervention',
        details: { field: 'status', oldValue: 'pending', newValue: 'in_progress' },
        ipAddress: '192.168.1.103',
        createdAt: new Date('2024-12-15T11:00:00'),
      },
      {
        userId: admin.id,
        action: 'update',
        entity: 'User',
        entityId: elderly3.id,
        details: { field: 'assignedVolunteerId', newValue: volunteer2.id },
        ipAddress: '192.168.1.100',
        createdAt: new Date('2024-12-15T11:30:00'),
      },
      {
        userId: doctor2.id,
        action: 'login',
        entity: 'User',
        entityId: doctor2.id,
        details: { method: 'password' },
        ipAddress: '192.168.1.104',
        createdAt: new Date('2024-12-15T14:00:00'),
      },
      {
        userId: doctor2.id,
        action: 'create',
        entity: 'Intervention',
        details: { domain: 'psychological', priority: 'high' },
        ipAddress: '192.168.1.104',
        createdAt: new Date('2024-12-15T14:30:00'),
      },
      {
        userId: null,
        action: 'system',
        entity: 'Database',
        details: { operation: 'backup', status: 'completed' },
        createdAt: new Date('2024-12-15T03:00:00'),
      },
      {
        userId: family1.id,
        action: 'login',
        entity: 'User',
        entityId: family1.id,
        details: { method: 'password', browser: 'Safari', platform: 'iOS' },
        ipAddress: '192.168.1.105',
        createdAt: new Date('2024-12-15T18:00:00'),
      },
      {
        userId: family1.id,
        action: 'read',
        entity: 'Assessment',
        entityId: assessment1.id,
        details: { view: 'report' },
        ipAddress: '192.168.1.105',
        createdAt: new Date('2024-12-15T18:05:00'),
      },
      {
        userId: admin.id,
        action: 'logout',
        entity: 'User',
        entityId: admin.id,
        details: {},
        ipAddress: '192.168.1.100',
        createdAt: new Date('2024-12-15T19:00:00'),
      },
    ],
  })

  console.log(`✅ Created ${14} audit log entries`)

  // ========================================
  // SUMMARY
  // ========================================
  console.log('\n🎉 Database seeding completed!')
  console.log('=====================================')
  console.log('📊 Seed Data Summary:')
  console.log('-------------------------------------')
  console.log(`👤 Users: 17 (1 admin, 3 doctors, 3 volunteers, 3 family, 7 elderly)`)
  console.log(`📋 Assessments: 7`)
  console.log(`🏥 Assessment Domains: 21`)
  console.log(`💊 Interventions: 18`)
  console.log(`📝 Audit Logs: 14`)
  console.log('=====================================')
  console.log('\n🔐 Demo Login Credentials (All PINs: 1234):')
  console.log('-------------------------------------')
  console.log('Super Admin:    9000000001 / 1234')
  console.log('Professional:   9000000002 / 1234')
  console.log('Volunteer:      9000000003 / 1234')
  console.log('-------------------------------------')
  console.log('📱 Multi-Profile Login Demos:')
  console.log('')
  console.log('Phone 9000000004 → 2 profiles (Profile Selection):')
  console.log('  • Sunita Devi    [Family]')
  console.log('  • Shri Ram Prasad [Elder] VAEL0001')
  console.log('')
  console.log('Phone 9000000009 → 3 profiles (Profile Selection):')
  console.log('  • Vikram Prasad  [Family]')
  console.log('  • Kamla Devi     [Elder] VAEL0002')
  console.log('  • Gopal Prasad   [Elder] VAEL0007')
  console.log('')
  console.log('Phone 9000000010 → 1 profile (Direct Login):')
  console.log('  • Neha Sharma    [Family]')
  console.log('=====================================\n')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
