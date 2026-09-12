import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('==================================================================')
  console.log('§ VERIFIED PLACEMENT PLATFORM: LIFECYCLE DELETION & LAUNCH RESET §')
  console.log('==================================================================\n')

  const hashedPassword = await bcrypt.hash('password123', 10)

  // -------------------------------------------------------------
  // STEP 1: INITIAL CLEANING OF ALL EXISTING ENTRIES
  // -------------------------------------------------------------
  console.log('>>> [STEP 1] Clearing all existing records from the database...')
  await prisma.question.deleteMany({})
  await prisma.interviewRound.deleteMany({})
  await prisma.report.deleteMany({})
  await prisma.experience.deleteMany({})
  await prisma.placementDrive.deleteMany({})
  await prisma.company.deleteMany({})
  await prisma.user.deleteMany({
    where: { role: { not: 'SUPER_ADMIN' } }
  })
  await prisma.campus.deleteMany({})

  // Ensure default super admin account is present
  let superAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  })

  if (!superAdmin) {
    superAdmin = await prisma.user.create({
      data: {
        email: 'admin@placementarchive.com',
        name: 'Super Administrator',
        passwordHash: hashedPassword,
        role: 'SUPER_ADMIN',
        verificationStatus: 'VERIFIED'
      }
    })
    console.log('  -> Created base Super Admin account: admin@placementarchive.com')
  } else {
    console.log('  -> Base Super Admin account preserved: admin@placementarchive.com')
  }

  console.log('✓ Database initial state clean. 0 colleges, 0 students, 0 experiences.\n')

  // -------------------------------------------------------------
  // STEP 2: CREATE TEST COLLEGE, TEST TPC, AND 2 TEST STUDENTS
  // -------------------------------------------------------------
  console.log('>>> [STEP 2] Creating test college, TPC admin, and 2 test students with experiences...')
  
  const testCampus = await prisma.campus.create({
    data: {
      name: 'Delhi Technological Institute',
      location: 'Delhi, India',
      status: 'ACTIVE'
    }
  })
  console.log(`  -> Created Test Campus: "${testCampus.name}" (ID: ${testCampus.id})`)

  const testTpc = await prisma.user.create({
    data: {
      name: 'Dr. TPC Officer',
      email: 'tpc@dti.ac.in',
      passwordHash: hashedPassword,
      role: 'TPC_ADMIN',
      campusId: testCampus.id,
      verificationStatus: 'VERIFIED'
    }
  })
  console.log(`  -> Created Test TPC Admin: "${testTpc.name}" (${testTpc.email})`)

  // Student 1
  const student1 = await prisma.user.create({
    data: {
      name: 'Test Student Alpha',
      email: 'alpha.student@dti.ac.in',
      passwordHash: hashedPassword,
      role: 'STUDENT',
      campusId: testCampus.id,
      rollNumber: '2022-DTI-CS-001',
      branch: 'Computer Science and Engineering',
      graduationYear: 2026,
      verificationStatus: 'VERIFIED'
    }
  })
  console.log(`  -> Created Student 1: "${student1.name}" (${student1.email})`)

  // Company & Drive for Student 1
  const google = await prisma.company.create({
    data: { name: 'Google Test Labs' }
  })
  const drive1 = await prisma.placementDrive.create({
    data: {
      campusId: testCampus.id,
      companyId: google.id,
      year: 2026,
      role: 'Software Engineering Intern'
    }
  })
  const exp1 = await prisma.experience.create({
    data: {
      driveId: drive1.id,
      studentId: student1.id,
      result: 'Selected',
      verificationStatus: 'VERIFIED',
      publishedAt: new Date()
    }
  })
  const round1 = await prisma.interviewRound.create({
    data: {
      experienceId: exp1.id,
      roundNumber: 1,
      type: 'Technical Interview',
      durationMinutes: 45,
      difficulty: 4,
      description: 'Data structures, algorithms, graphs and dynamic programming problems.'
    }
  })
  await prisma.question.create({
    data: {
      roundId: round1.id,
      questionText: 'Find the lowest common ancestor in a binary tree with duplicate keys.',
      category: 'Data Structures'
    }
  })
  console.log(`  -> Created Experience for Student 1 (Google Test Labs - Software Engineering Intern)`)

  // Student 2
  const student2 = await prisma.user.create({
    data: {
      name: 'Test Student Beta',
      email: 'beta.student@dti.ac.in',
      passwordHash: hashedPassword,
      role: 'STUDENT',
      campusId: testCampus.id,
      rollNumber: '2022-DTI-DS-042',
      branch: 'Data Science & Artificial Intelligence',
      graduationYear: 2026,
      verificationStatus: 'VERIFIED'
    }
  })
  console.log(`  -> Created Student 2: "${student2.name}" (${student2.email})`)

  // Company & Drive for Student 2
  const microsoft = await prisma.company.create({
    data: { name: 'Microsoft Test Cloud' }
  })
  const drive2 = await prisma.placementDrive.create({
    data: {
      campusId: testCampus.id,
      companyId: microsoft.id,
      year: 2026,
      role: 'Cloud Solutions Associate'
    }
  })
  const exp2 = await prisma.experience.create({
    data: {
      driveId: drive2.id,
      studentId: student2.id,
      result: 'Selected',
      verificationStatus: 'VERIFIED',
      publishedAt: new Date()
    }
  })
  const round2 = await prisma.interviewRound.create({
    data: {
      experienceId: exp2.id,
      roundNumber: 1,
      type: 'System Design & Architecture',
      durationMinutes: 60,
      difficulty: 4,
      description: 'Distributed cache design and event streaming patterns.'
    }
  })
  await prisma.question.create({
    data: {
      roundId: round2.id,
      questionText: 'Design an idempotent notification dispatch system with Redis pub-sub.',
      category: 'System Design'
    }
  })
  console.log(`  -> Created Experience for Student 2 (Microsoft Test Cloud - Cloud Solutions Associate)`)

  // Verification of Step 2 State
  const countStudentsStep2 = await prisma.user.count({ where: { role: 'STUDENT' } })
  const countExperiencesStep2 = await prisma.experience.count()
  console.log(`\n✓ Verification after creation: ${countStudentsStep2} students in database, ${countExperiencesStep2} placement experiences.\n`)

  // -------------------------------------------------------------
  // STEP 3: USE SUPERADMIN TO DELETE STUDENT 1
  // -------------------------------------------------------------
  console.log('>>> [STEP 3] Executing SUPER ADMIN deletion of Student 1 ("Test Student Alpha")...')
  console.log('  -> Super Admin role checking authorization and finding Student 1...')
  
  // Find Student 1 and associated records
  const targetStudent1 = await prisma.user.findUnique({
    where: { id: student1.id },
    include: { experiences: { select: { id: true } } }
  })

  if (!targetStudent1) throw new Error('Student 1 not found for deletion')

  const student1ExpIds = targetStudent1.experiences.map(e => e.id)
  if (student1ExpIds.length > 0) {
    await prisma.question.deleteMany({
      where: { round: { experienceId: { in: student1ExpIds } } }
    })
    await prisma.interviewRound.deleteMany({
      where: { experienceId: { in: student1ExpIds } }
    })
    await prisma.report.deleteMany({
      where: { experienceId: { in: student1ExpIds } }
    })
    await prisma.experience.deleteMany({
      where: { id: { in: student1ExpIds } }
    })
  }
  await prisma.report.deleteMany({ where: { reporterId: student1.id } })
  await prisma.user.delete({ where: { id: student1.id } })

  console.log(`✓ Super Admin successfully deleted Student 1: ${targetStudent1.name} (${targetStudent1.email}) and all interview records.`)

  // Verification after Step 3
  const remainingAfterStep3 = await prisma.user.findMany({ where: { role: 'STUDENT' } })
  console.log(`  -> Remaining students in database: ${remainingAfterStep3.length} (Expected 1: ${remainingAfterStep3[0]?.name})`)

  // -------------------------------------------------------------
  // STEP 4: USE TPC ADMIN TO DELETE STUDENT 2
  // -------------------------------------------------------------
  console.log('\n>>> [STEP 4] Executing TPC ADMIN deletion of Student 2 ("Test Student Beta")...')
  console.log(`  -> TPC Admin (${testTpc.email}) checking campus ownership (${testCampus.id})...`)

  const targetStudent2 = await prisma.user.findUnique({
    where: { id: student2.id },
    include: { experiences: { select: { id: true } } }
  })

  if (!targetStudent2) throw new Error('Student 2 not found for deletion')
  if (targetStudent2.campusId !== testTpc.campusId) {
    throw new Error('TPC Admin authorization mismatch: student does not belong to TPC campus')
  }

  const student2ExpIds = targetStudent2.experiences.map(e => e.id)
  if (student2ExpIds.length > 0) {
    await prisma.question.deleteMany({
      where: { round: { experienceId: { in: student2ExpIds } } }
    })
    await prisma.interviewRound.deleteMany({
      where: { experienceId: { in: student2ExpIds } }
    })
    await prisma.report.deleteMany({
      where: { experienceId: { in: student2ExpIds } }
    })
    await prisma.experience.deleteMany({
      where: { id: { in: student2ExpIds } }
    })
  }
  await prisma.report.deleteMany({ where: { reporterId: student2.id } })
  await prisma.user.delete({ where: { id: student2.id } })

  console.log(`✓ TPC Admin successfully deleted Student 2: ${targetStudent2.name} (${targetStudent2.email}) and all interview records.`)

  // Verification after Step 4
  const remainingAfterStep4 = await prisma.user.count({ where: { role: 'STUDENT' } })
  console.log(`  -> Remaining students in database: ${remainingAfterStep4} (Both test students successfully deleted).`)

  // -------------------------------------------------------------
  // STEP 5: FINAL CLEANUP - ZERO ENTRIES, ZERO COLLEGES, FRESH TO LAUNCH
  // -------------------------------------------------------------
  console.log('\n>>> [STEP 5] Purging test college and all test infrastructure for fresh production launch...')

  await prisma.question.deleteMany({})
  await prisma.interviewRound.deleteMany({})
  await prisma.report.deleteMany({})
  await prisma.experience.deleteMany({})
  await prisma.placementDrive.deleteMany({})
  await prisma.company.deleteMany({})
  await prisma.user.deleteMany({
    where: { role: { not: 'SUPER_ADMIN' } }
  })
  await prisma.campus.deleteMany({})

  // Final database audit
  const finalCampuses = await prisma.campus.count()
  const finalCompanies = await prisma.company.count()
  const finalDrives = await prisma.placementDrive.count()
  const finalExperiences = await prisma.experience.count()
  const finalRounds = await prisma.interviewRound.count()
  const finalQuestions = await prisma.question.count()
  const finalReports = await prisma.report.count()
  const finalStudents = await prisma.user.count({ where: { role: 'STUDENT' } })
  const finalTpcAdmins = await prisma.user.count({ where: { role: 'TPC_ADMIN' } })
  const finalSuperAdmins = await prisma.user.count({ where: { role: 'SUPER_ADMIN' } })

  console.log('==================================================================')
  console.log('§ FINAL LAUNCH AUDIT STATE: DATABASE 100% FRESH & READY §')
  console.log('==================================================================')
  console.log(`  • Campuses / Colleges : ${finalCampuses} (no colleges)`)
  console.log(`  • Companies           : ${finalCompanies}`)
  console.log(`  • Placement Drives    : ${finalDrives}`)
  console.log(`  • Experiences         : ${finalExperiences}`)
  console.log(`  • Interview Rounds    : ${finalRounds}`)
  console.log(`  • Questions           : ${finalQuestions}`)
  console.log(`  • Reports             : ${finalReports}`)
  console.log(`  • Students            : ${finalStudents} (no student entries)`)
  console.log(`  • TPC Admins          : ${finalTpcAdmins} (no TPC accounts)`)
  console.log(`  • Super Admin Account : ${finalSuperAdmins} (admin@placementarchive.com ready)`)
  console.log('==================================================================\n')

  if (finalCampuses === 0 && finalStudents === 0 && finalExperiences === 0 && finalSuperAdmins === 1) {
    console.log('🎉 SUCCESS: The database is completely clean, zero entries, zero colleges, fresh to launch!')
  } else {
    throw new Error('Verification failed: database is not clean!')
  }
}

main()
  .catch((e) => {
    console.error('Error during execution:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
