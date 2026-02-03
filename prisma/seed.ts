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
      password: await hashPassword('Admin@123'),
      name: 'Dr. Rajesh Kumar',
      phone: '+91 98765 43210',
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
      password: await hashPassword('Doctor@123'),
      name: 'Dr. Priya Sharma',
      phone: '+91 98765 43211',
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
      password: await hashPassword('Doctor@123'),
      name: 'Dr. Anita Verma',
      phone: '+91 98765 43220',
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
      password: await hashPassword('Doctor@123'),
      name: 'Dr. Suresh Patel',
      phone: '+91 98765 43221',
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
      password: await hashPassword('Volunteer@123'),
      name: 'Amit Singh',
      phone: '+91 98765 43212',
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
      password: await hashPassword('Volunteer@123'),
      name: 'Meera Kumari',
      phone: '+91 98765 43222',
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
      password: await hashPassword('Volunteer@123'),
      name: 'Rahul Gupta',
      phone: '+91 98765 43223',
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
      password: await hashPassword('Family@123'),
      name: 'Sunita Devi',
      phone: '+91 98765 43213',
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
      password: await hashPassword('Family@123'),
      name: 'Vikram Prasad',
      phone: '+91 98765 43224',
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
      password: await hashPassword('Family@123'),
      name: 'Neha Sharma',
      phone: '+91 98765 43225',
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
  const elderly1 = await prisma.user.create({
    data: {
      email: 'elderly@vayo.health',
      password: await hashPassword('Elderly@123'),
      name: 'Shri Ram Prasad',
      phone: '+91 98765 43214',
      role: UserRole.elderly,
      isActive: true,
      emailVerified: true,
      vayoId: 'VAEL0001',
      age: 72,
      gender: Gender.male,
      address: 'Block A, Yelahanka, Bangalore 560064',
      emergencyContact: '+91 98765 43213',
      dateOfBirth: new Date('1952-05-15'),
      stateName: 'Karnataka',
      districtName: 'Bangalore Urban',
      talukName: 'Bangalore North',
      villageName: 'Yelahanka',
      caregiverName: 'Sunita Devi',
      caregiverPhone: '+91 98765 43213',
      caregiverRelation: 'daughter',
      assignedVolunteerId: volunteer1.id,
    },
  })

  const elderly2 = await prisma.user.create({
    data: {
      email: 'kamla.devi@vayo.health',
      password: await hashPassword('Elderly@123'),
      name: 'Kamla Devi',
      phone: '+91 98765 43226',
      role: UserRole.elderly,
      isActive: true,
      emailVerified: true,
      vayoId: 'VAEL0002',
      age: 68,
      gender: Gender.female,
      address: '45, JP Nagar 7th Phase, Bangalore 560078',
      emergencyContact: '+91 98765 43224',
      dateOfBirth: new Date('1956-08-20'),
      stateName: 'Karnataka',
      districtName: 'Bangalore Urban',
      talukName: 'Bangalore South',
      villageName: 'JP Nagar',
      caregiverName: 'Vikram Prasad',
      caregiverPhone: '+91 98765 43224',
      caregiverRelation: 'son',
      assignedVolunteerId: volunteer1.id,
    },
  })

  const elderly3 = await prisma.user.create({
    data: {
      email: 'hari.om@vayo.health',
      password: await hashPassword('Elderly@123'),
      name: 'Hari Om Sharma',
      phone: '+91 98765 43227',
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
      password: await hashPassword('Elderly@123'),
      name: 'Savitri Singh',
      phone: '+91 98765 43228',
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
      password: await hashPassword('Elderly@123'),
      name: 'Mohan Lal Agarwal',
      phone: '+91 98765 43230',
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
      password: await hashPassword('Elderly@123'),
      name: 'Parvati Mishra',
      phone: '+91 98765 43232',
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

  console.log(`✅ Created ${16} users`)

  // ========================================
  // 2. SEED ASSESSMENTS
  // ========================================
  console.log('📋 Creating assessments...')

  // Assessment 1 - Elderly 1 (Ram Prasad) - Recent assessment
  const assessment1 = await prisma.assessment.create({
    data: {
      subjectId: elderly1.id,
      assessorId: volunteer1.id,
      assessedAt: new Date('2024-12-01'),
      overallRisk: RiskLevel.at_risk,
      notes: 'Initial ICOPE assessment. Patient shows mild cognitive decline and mobility issues.',
      domainScores: {
        cognition: 65,
        mobility: 55,
        nutrition: 80,
        vision: 70,
        hearing: 60,
        mentalHealth: 75,
      },
    },
  })

  // Assessment 2 - Elderly 2 (Kamla Devi)
  const assessment2 = await prisma.assessment.create({
    data: {
      subjectId: elderly2.id,
      assessorId: doctor1.id,
      assessedAt: new Date('2024-11-15'),
      overallRisk: RiskLevel.healthy,
      notes: 'Overall good health condition. Minor vision issues addressed.',
      domainScores: {
        cognition: 85,
        mobility: 80,
        nutrition: 90,
        vision: 60,
        hearing: 85,
        mentalHealth: 88,
      },
    },
  })

  // Assessment 3 - Elderly 3 (Hari Om Sharma)
  const assessment3 = await prisma.assessment.create({
    data: {
      subjectId: elderly3.id,
      assessorId: volunteer2.id,
      assessedAt: new Date('2024-11-20'),
      overallRisk: RiskLevel.intervention,
      notes: 'Requires immediate intervention for mobility and fall risk. Cognitive function declining.',
      domainScores: {
        cognition: 45,
        mobility: 35,
        nutrition: 65,
        vision: 50,
        hearing: 55,
        mentalHealth: 50,
      },
    },
  })

  // Assessment 4 - Elderly 4 (Savitri Singh)
  const assessment4 = await prisma.assessment.create({
    data: {
      subjectId: elderly4.id,
      assessorId: doctor2.id,
      assessedAt: new Date('2024-12-05'),
      overallRisk: RiskLevel.at_risk,
      notes: 'Depression symptoms observed. Nutritional support needed.',
      domainScores: {
        cognition: 75,
        mobility: 70,
        nutrition: 55,
        vision: 80,
        hearing: 75,
        mentalHealth: 45,
      },
    },
  })

  // Assessment 5 - Elderly 5 (Mohan Lal)
  const assessment5 = await prisma.assessment.create({
    data: {
      subjectId: elderly5.id,
      assessorId: volunteer3.id,
      assessedAt: new Date('2024-10-25'),
      overallRisk: RiskLevel.intervention,
      notes: 'Multiple domain concerns. Comprehensive care plan required.',
      domainScores: {
        cognition: 40,
        mobility: 30,
        nutrition: 50,
        vision: 40,
        hearing: 35,
        mentalHealth: 55,
      },
    },
  })

  // Assessment 6 - Elderly 6 (Parvati Mishra)
  const assessment6 = await prisma.assessment.create({
    data: {
      subjectId: elderly6.id,
      assessorId: doctor3.id,
      assessedAt: new Date('2024-12-10'),
      overallRisk: RiskLevel.healthy,
      notes: 'Good overall health. Active lifestyle. Minor hearing support recommended.',
      domainScores: {
        cognition: 90,
        mobility: 85,
        nutrition: 88,
        vision: 82,
        hearing: 65,
        mentalHealth: 92,
      },
    },
  })

  // Follow-up assessment for Elderly 1
  const assessment7 = await prisma.assessment.create({
    data: {
      subjectId: elderly1.id,
      assessorId: doctor1.id,
      assessedAt: new Date('2024-12-15'),
      overallRisk: RiskLevel.at_risk,
      notes: 'Follow-up assessment. Slight improvement in mobility after interventions.',
      domainScores: {
        cognition: 68,
        mobility: 62,
        nutrition: 82,
        vision: 72,
        hearing: 62,
        mentalHealth: 78,
      },
    },
  })

  console.log(`✅ Created ${7} assessments`)

  // ========================================
  // 3. SEED ASSESSMENT DOMAINS
  // ========================================
  console.log('🏥 Creating assessment domains...')

  // Assessment 1 Domains
  await prisma.assessmentDomain.createMany({
    data: [
      {
        assessmentId: assessment1.id,
        domain: 'cognition',
        riskLevel: RiskLevel.at_risk,
        score: 65,
        answers: { memoryTest: 6, orientation: 8, recall: 5 },
        notes: 'Mild short-term memory issues. Recommend cognitive exercises.',
      },
      {
        assessmentId: assessment1.id,
        domain: 'mobility',
        riskLevel: RiskLevel.at_risk,
        score: 55,
        answers: { walkingSpeed: 'slow', balanceTest: 'fair', chairStand: 3 },
        notes: 'Slow gait, uses walking stick. Fall risk moderate.',
      },
      {
        assessmentId: assessment1.id,
        domain: 'nutrition',
        riskLevel: RiskLevel.healthy,
        score: 80,
        answers: { bmi: 23.5, appetiteLoss: false, weightLoss: false },
        notes: 'Good nutritional status.',
      },
      {
        assessmentId: assessment1.id,
        domain: 'vision',
        riskLevel: RiskLevel.at_risk,
        score: 70,
        answers: { visionTest: 'fair', usesGlasses: true, lastEyeCheck: '6 months ago' },
        notes: 'Uses reading glasses. Distance vision declining.',
      },
      {
        assessmentId: assessment1.id,
        domain: 'hearing',
        riskLevel: RiskLevel.at_risk,
        score: 60,
        answers: { hearingTest: 'moderate loss', usesHearingAid: false },
        notes: 'Moderate hearing loss. Hearing aid recommended.',
      },
      {
        assessmentId: assessment1.id,
        domain: 'mental_health',
        riskLevel: RiskLevel.healthy,
        score: 75,
        answers: { depressionScreen: 3, anxietyScreen: 2, socialSupport: 'good' },
        notes: 'Good mental health. Active social life.',
      },
    ],
  })

  // Assessment 3 Domains (High Risk)
  await prisma.assessmentDomain.createMany({
    data: [
      {
        assessmentId: assessment3.id,
        domain: 'cognition',
        riskLevel: RiskLevel.intervention,
        score: 45,
        answers: { memoryTest: 3, orientation: 5, recall: 2 },
        notes: 'Significant cognitive decline. Specialist referral needed.',
      },
      {
        assessmentId: assessment3.id,
        domain: 'mobility',
        riskLevel: RiskLevel.intervention,
        score: 35,
        answers: { walkingSpeed: 'very slow', balanceTest: 'poor', chairStand: 1 },
        notes: 'High fall risk. Requires mobility aids and home modifications.',
      },
      {
        assessmentId: assessment3.id,
        domain: 'nutrition',
        riskLevel: RiskLevel.at_risk,
        score: 65,
        answers: { bmi: 19.2, appetiteLoss: true, weightLoss: true },
        notes: 'Underweight. Nutritional supplementation required.',
      },
      {
        assessmentId: assessment3.id,
        domain: 'vision',
        riskLevel: RiskLevel.at_risk,
        score: 50,
        answers: { visionTest: 'poor', usesGlasses: true, lastEyeCheck: '2 years ago' },
        notes: 'Cataract suspected. Ophthalmologist referral.',
      },
      {
        assessmentId: assessment3.id,
        domain: 'hearing',
        riskLevel: RiskLevel.at_risk,
        score: 55,
        answers: { hearingTest: 'moderate loss', usesHearingAid: true },
        notes: 'Hearing aid needs adjustment.',
      },
      {
        assessmentId: assessment3.id,
        domain: 'mental_health',
        riskLevel: RiskLevel.at_risk,
        score: 50,
        answers: { depressionScreen: 8, anxietyScreen: 6, socialSupport: 'limited' },
        notes: 'Signs of depression. Social isolation concerns.',
      },
    ],
  })

  // Assessment 4 Domains
  await prisma.assessmentDomain.createMany({
    data: [
      {
        assessmentId: assessment4.id,
        domain: 'cognition',
        riskLevel: RiskLevel.healthy,
        score: 75,
        answers: { memoryTest: 7, orientation: 9, recall: 6 },
        notes: 'Cognitive function within normal range.',
      },
      {
        assessmentId: assessment4.id,
        domain: 'mobility',
        riskLevel: RiskLevel.healthy,
        score: 70,
        answers: { walkingSpeed: 'normal', balanceTest: 'good', chairStand: 4 },
        notes: 'Good mobility for age.',
      },
      {
        assessmentId: assessment4.id,
        domain: 'nutrition',
        riskLevel: RiskLevel.at_risk,
        score: 55,
        answers: { bmi: 18.5, appetiteLoss: true, weightLoss: true },
        notes: 'Loss of appetite. Weight monitoring needed.',
      },
      {
        assessmentId: assessment4.id,
        domain: 'mental_health',
        riskLevel: RiskLevel.intervention,
        score: 45,
        answers: { depressionScreen: 12, anxietyScreen: 8, socialSupport: 'poor' },
        notes: 'Depression symptoms. Counseling and possible medication review.',
      },
    ],
  })

  // Assessment 5 Domains (Multiple interventions needed)
  await prisma.assessmentDomain.createMany({
    data: [
      {
        assessmentId: assessment5.id,
        domain: 'cognition',
        riskLevel: RiskLevel.intervention,
        score: 40,
        answers: { memoryTest: 2, orientation: 4, recall: 1 },
        notes: 'Severe cognitive impairment. Dementia screening recommended.',
      },
      {
        assessmentId: assessment5.id,
        domain: 'mobility',
        riskLevel: RiskLevel.intervention,
        score: 30,
        answers: { walkingSpeed: 'requires assistance', balanceTest: 'poor', chairStand: 0 },
        notes: 'Cannot walk independently. Wheelchair assessment needed.',
      },
      {
        assessmentId: assessment5.id,
        domain: 'nutrition',
        riskLevel: RiskLevel.at_risk,
        score: 50,
        answers: { bmi: 17.8, appetiteLoss: true, weightLoss: true },
        notes: 'Malnutrition risk. Dietitian consultation required.',
      },
      {
        assessmentId: assessment5.id,
        domain: 'vision',
        riskLevel: RiskLevel.intervention,
        score: 40,
        answers: { visionTest: 'severe impairment', usesGlasses: true },
        notes: 'Significant vision loss. Low vision aids needed.',
      },
      {
        assessmentId: assessment5.id,
        domain: 'hearing',
        riskLevel: RiskLevel.intervention,
        score: 35,
        answers: { hearingTest: 'severe loss', usesHearingAid: true },
        notes: 'Hearing aids not effective. ENT specialist needed.',
      },
    ],
  })

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
        domain: 'cognition',
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
        domain: 'mobility',
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
        domain: 'hearing',
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
        domain: 'cognition',
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
        domain: 'mobility',
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
        domain: 'mobility',
        priority: 'high',
        status: 'pending',
        dueDate: new Date('2024-12-22'),
      },
      {
        userId: elderly3.id,
        assessmentId: assessment3.id,
        title: 'Nutritional Support Program',
        description: 'Enroll in community nutrition program. Dietitian to create meal plan.',
        domain: 'nutrition',
        priority: 'high',
        status: 'pending',
        dueDate: new Date('2025-01-05'),
      },
      {
        userId: elderly3.id,
        assessmentId: assessment3.id,
        title: 'Ophthalmologist Referral',
        description: 'Cataract evaluation and treatment planning.',
        domain: 'vision',
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
        domain: 'mental_health',
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
        domain: 'mental_health',
        priority: 'medium',
        status: 'pending',
        dueDate: new Date('2025-01-15'),
      },
      {
        userId: elderly4.id,
        assessmentId: assessment4.id,
        title: 'Nutritional Counseling',
        description: 'Dietitian consultation for appetite improvement strategies.',
        domain: 'nutrition',
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
        domain: 'cognition',
        priority: 'urgent',
        status: 'pending',
        dueDate: new Date('2024-12-18'),
      },
      {
        userId: elderly5.id,
        assessmentId: assessment5.id,
        title: '24-Hour Care Evaluation',
        description: 'Assess need for full-time caregiver or assisted living.',
        domain: 'mobility',
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
        domain: 'vision',
        priority: 'high',
        status: 'pending',
        dueDate: new Date('2025-01-15'),
      },
      {
        userId: elderly5.id,
        assessmentId: assessment5.id,
        title: 'Cochlear Implant Evaluation',
        description: 'ENT specialist evaluation for cochlear implant candidacy.',
        domain: 'hearing',
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
        domain: 'vision',
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
        domain: 'hearing',
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
        details: { domain: 'mental_health', priority: 'high' },
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
  console.log(`👤 Users: 16 (1 admin, 3 doctors, 3 volunteers, 3 family, 6 elderly)`)
  console.log(`📋 Assessments: 7`)
  console.log(`🏥 Assessment Domains: 21`)
  console.log(`💊 Interventions: 18`)
  console.log(`📝 Audit Logs: 14`)
  console.log('=====================================')
  console.log('\n🔐 Demo Login Credentials:')
  console.log('-------------------------------------')
  console.log('Super Admin:   admin@vayo.health / Admin@123')
  console.log('Professional:  coreclinicalteam@vayo.health / Doctor@123')
  console.log('Volunteer:     volunteer@vayo.health / Volunteer@123')
  console.log('Family:        family@vayo.health / Family@123')
  console.log('Elderly:       elderly@vayo.health / Elderly@123')
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
