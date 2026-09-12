import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clean existing data
  await prisma.question.deleteMany()
  await prisma.report.deleteMany()
  await prisma.interviewRound.deleteMany()
  await prisma.experience.deleteMany()
  await prisma.placementDrive.deleteMany()
  await prisma.user.deleteMany()
  await prisma.company.deleteMany()
  await prisma.campus.deleteMany()

  // ——— Campuses ———
  const iitDelhi = await prisma.campus.create({
    data: { name: 'IIT Delhi', location: 'New Delhi, India' }
  })
  const nitTrichy = await prisma.campus.create({
    data: { name: 'NIT Trichy', location: 'Tiruchirappalli, Tamil Nadu' }
  })
  const bitsPilani = await prisma.campus.create({
    data: { name: 'BITS Pilani', location: 'Pilani, Rajasthan' }
  })

  console.log('✅ Campuses created')

  // ——— Companies ———
  const companies = await Promise.all([
    prisma.company.create({ data: { name: 'Google' } }),
    prisma.company.create({ data: { name: 'Microsoft' } }),
    prisma.company.create({ data: { name: 'Amazon' } }),
    prisma.company.create({ data: { name: 'Deloitte' } }),
    prisma.company.create({ data: { name: 'TCS' } }),
    prisma.company.create({ data: { name: 'Infosys' } }),
    prisma.company.create({ data: { name: 'Goldman Sachs' } }),
    prisma.company.create({ data: { name: 'Wipro' } }),
  ])
  const [google, microsoft, amazon, deloitte, tcs, infosys, goldman, wipro] = companies

  console.log('✅ Companies created')

  // ——— Users ———
  const passwordHash = await bcrypt.hash('password123', 10)

  // Super Admin
  await prisma.user.create({
    data: {
      email: 'admin@placementarchive.com',
      name: 'Platform Admin',
      passwordHash,
      role: 'SUPER_ADMIN',
      verificationStatus: 'VERIFIED',
    }
  })

  // TPC Admins
  const tpcIIT = await prisma.user.create({
    data: {
      email: 'tpc@iitdelhi.ac.in',
      name: 'IIT Delhi TPC',
      passwordHash,
      role: 'TPC_ADMIN',
      campusId: iitDelhi.id,
      verificationStatus: 'VERIFIED',
    }
  })

  await prisma.user.create({
    data: {
      email: 'tpc@nitt.edu',
      name: 'NIT Trichy TPC',
      passwordHash,
      role: 'TPC_ADMIN',
      campusId: nitTrichy.id,
      verificationStatus: 'VERIFIED',
    }
  })

  // Students — IIT Delhi
  const rahul = await prisma.user.create({
    data: {
      email: 'rahul.sharma@iitdelhi.ac.in',
      name: 'Rahul Sharma',
      passwordHash,
      role: 'STUDENT',
      campusId: iitDelhi.id,
      verificationStatus: 'VERIFIED',
      rollNumber: '22CSE104',
      branch: 'B.Tech CSE',
      graduationYear: 2026,
    }
  })

  const priya = await prisma.user.create({
    data: {
      email: 'priya.gupta@iitdelhi.ac.in',
      name: 'Priya Gupta',
      passwordHash,
      role: 'STUDENT',
      campusId: iitDelhi.id,
      verificationStatus: 'VERIFIED',
      rollNumber: '22CSE208',
      branch: 'B.Tech CSE',
      graduationYear: 2026,
    }
  })

  const aman = await prisma.user.create({
    data: {
      email: 'aman.singh@iitdelhi.ac.in',
      name: 'Aman Singh',
      passwordHash,
      role: 'STUDENT',
      campusId: iitDelhi.id,
      verificationStatus: 'VERIFIED',
      rollNumber: '22ECE115',
      branch: 'B.Tech ECE',
      graduationYear: 2026,
    }
  })

  const neha = await prisma.user.create({
    data: {
      email: 'neha.patel@iitdelhi.ac.in',
      name: 'Neha Patel',
      passwordHash,
      role: 'STUDENT',
      campusId: iitDelhi.id,
      verificationStatus: 'VERIFIED',
      rollNumber: '22CSE310',
      branch: 'B.Tech CSE',
      graduationYear: 2026,
    }
  })

  // Students — NIT Trichy
  const vikram = await prisma.user.create({
    data: {
      email: 'vikram.reddy@nitt.edu',
      name: 'Vikram Reddy',
      passwordHash,
      role: 'STUDENT',
      campusId: nitTrichy.id,
      verificationStatus: 'VERIFIED',
      rollNumber: '22IT205',
      branch: 'B.Tech IT',
      graduationYear: 2026,
    }
  })

  const sneha = await prisma.user.create({
    data: {
      email: 'sneha.iyer@nitt.edu',
      name: 'Sneha Iyer',
      passwordHash,
      role: 'STUDENT',
      campusId: nitTrichy.id,
      verificationStatus: 'VERIFIED',
      rollNumber: '22CSE412',
      branch: 'B.Tech CSE',
      graduationYear: 2025,
    }
  })

  console.log('✅ Users created')

  // ——— Placement Drives ———
  const driveAmazonIIT26 = await prisma.placementDrive.create({
    data: { campusId: iitDelhi.id, companyId: amazon.id, year: 2026, role: 'Software Development Engineer' }
  })
  const driveDeloitteNIT26 = await prisma.placementDrive.create({
    data: { campusId: nitTrichy.id, companyId: deloitte.id, year: 2026, role: 'Analyst' }
  })
  const driveMicrosoftBITS26 = await prisma.placementDrive.create({
    data: { campusId: bitsPilani.id, companyId: microsoft.id, year: 2026, role: 'Software Engineer' }
  })
  const driveGoogleIIT25 = await prisma.placementDrive.create({
    data: { campusId: iitDelhi.id, companyId: google.id, year: 2025, role: 'SDE Intern' }
  })
  const driveTCSNIT26 = await prisma.placementDrive.create({
    data: { campusId: nitTrichy.id, companyId: tcs.id, year: 2026, role: 'System Engineer' }
  })
  const driveGoldmanIIT26 = await prisma.placementDrive.create({
    data: { campusId: iitDelhi.id, companyId: goldman.id, year: 2026, role: 'Analyst' }
  })
  const driveInfosysBITS26 = await prisma.placementDrive.create({
    data: { campusId: bitsPilani.id, companyId: infosys.id, year: 2026, role: 'Systems Engineer' }
  })

  console.log('✅ Placement drives created')

  // ——— Experiences (with rounds) ———

  // 1. Rahul — Amazon SDE (VERIFIED)
  await prisma.experience.create({
    data: {
      driveId: driveAmazonIIT26.id,
      studentId: rahul.id,
      result: 'Selected',
      verificationStatus: 'VERIFIED',
      publishedAt: new Date('2026-09-08'),
      isAnonymous: true,
      rounds: {
        create: [
          {
            roundNumber: 1, type: 'Online Assessment', durationMinutes: 90, difficulty: 4,
            topics: ['DSA', 'Aptitude', 'Logical Reasoning'],
            description: 'The online assessment had 3 sections. Section 1 was DSA with 2 medium-hard problems (Graph BFS and Dynamic Programming). Section 2 was logical reasoning with 20 MCQs. Section 3 was a workstyle assessment.',
          },
          {
            roundNumber: 2, type: 'Technical Interview', durationMinutes: 60, difficulty: 4,
            topics: ['DSA', 'System Design', 'Projects'],
            description: 'Started with a brief introduction. Then moved to a DSA problem - "Find the median of two sorted arrays". Follow-up on time complexity optimization. Then discussed one of my projects in detail - asked about design choices and scalability.',
          },
          {
            roundNumber: 3, type: 'Technical Interview', durationMinutes: 45, difficulty: 3,
            topics: ['OS', 'DBMS', 'Networking'],
            description: 'This round focused on CS fundamentals. Questions on process vs thread, deadlock conditions, normalization in DBMS, TCP vs UDP. Then a coding problem - LRU Cache implementation. Interviewer was very supportive and gave hints when stuck.',
          },
          {
            roundNumber: 4, type: 'HR Interview', durationMinutes: 30, difficulty: 2,
            topics: ['Behavioral', 'Situational'],
            description: 'The HR round was conversational. "Tell me about yourself", "Why Amazon?", "Tell me about a time you faced a conflict in a team", "Are you willing to relocate?", "Where do you see yourself in 5 years?". The interviewer was friendly and it felt more like a discussion than an interview.',
          }
        ]
      }
    }
  })

  // 2. Vikram — Deloitte Analyst (VERIFIED)
  await prisma.experience.create({
    data: {
      driveId: driveDeloitteNIT26.id,
      studentId: vikram.id,
      result: 'Selected',
      verificationStatus: 'VERIFIED',
      publishedAt: new Date('2026-09-06'),
      isAnonymous: true,
      rounds: {
        create: [
          {
            roundNumber: 1, type: 'Aptitude Test', durationMinutes: 60, difficulty: 3,
            topics: ['Quantitative', 'Logical Reasoning', 'Verbal'],
            description: 'The aptitude test had 3 sections with 20 questions each. Time limit was strict. Questions on percentages, time & work, seating arrangement, and reading comprehension. Around 400 students appeared and about 120 were shortlisted.',
          },
          {
            roundNumber: 2, type: 'Technical Interview', durationMinutes: 40, difficulty: 3,
            topics: ['DBMS', 'OOPs', 'Projects'],
            description: 'The interviewer asked about my projects first — specifically about the database design and API architecture. Then moved to DBMS concepts like normalization, joins, and indexing. A few OOPs questions on inheritance vs composition. Overall the interviewer was calm and gave time to think.',
          },
          {
            roundNumber: 3, type: 'HR Interview', durationMinutes: 25, difficulty: 2,
            topics: ['Behavioral', 'Communication'],
            description: 'The HR round focused mostly on communication, relocation willingness, why Deloitte, strengths and weaknesses, and questions about my extracurricular activities. They also asked about a time I had to lead a team through a difficult situation.',
          }
        ]
      }
    }
  })

  // 3. Priya — Amazon SDE (VERIFIED)
  await prisma.experience.create({
    data: {
      driveId: driveAmazonIIT26.id,
      studentId: priya.id,
      result: 'Selected',
      verificationStatus: 'VERIFIED',
      publishedAt: new Date('2026-09-09'),
      isAnonymous: false,
      rounds: {
        create: [
          {
            roundNumber: 1, type: 'Online Assessment', durationMinutes: 90, difficulty: 4,
            topics: ['DSA', 'Aptitude'],
            description: 'Two coding questions — one on sliding window and one on binary trees. The aptitude section was moderate. I scored well on coding which helped me clear this round.',
          },
          {
            roundNumber: 2, type: 'Technical Interview', durationMinutes: 55, difficulty: 5,
            topics: ['DSA', 'Low Level Design'],
            description: 'This was the hardest round. The interviewer asked me to design a parking lot system, then asked a hard graph problem on shortest paths. The follow-up questions were intense but fair.',
          },
          {
            roundNumber: 3, type: 'Technical Interview', durationMinutes: 50, difficulty: 3,
            topics: ['Projects', 'System Design'],
            description: 'Deep dive into my final year project. Questions on database choices, caching strategy, and how I would scale the system. Also asked about microservices vs monolith tradeoffs.',
          },
          {
            roundNumber: 4, type: 'HR Interview', durationMinutes: 25, difficulty: 2,
            topics: ['Behavioral', 'Leadership Principles'],
            description: 'Amazon LP-focused round. "Tell me about a time you disagreed with your team", "How do you prioritize when everything is urgent?", "Why Amazon over other companies?". Very structured.',
          }
        ]
      }
    }
  })

  // 4. Neha — Microsoft SDE (VERIFIED)
  await prisma.experience.create({
    data: {
      driveId: driveMicrosoftBITS26.id,
      studentId: neha.id,
      result: 'Selected',
      verificationStatus: 'VERIFIED',
      publishedAt: new Date('2026-09-05'),
      isAnonymous: true,
      rounds: {
        create: [
          {
            roundNumber: 1, type: 'Online Assessment', durationMinutes: 75, difficulty: 3,
            topics: ['DSA', 'MCQs'],
            description: 'Online test with 3 coding problems and 10 MCQs on OS and Networks. The coding problems were medium difficulty - array manipulation, string processing, and a DP problem.',
          },
          {
            roundNumber: 2, type: 'Technical Interview', durationMinutes: 60, difficulty: 4,
            topics: ['DSA', 'Problem Solving'],
            description: 'Two DSA questions. First was a variation of merge intervals. Second was trapping rainwater. The interviewer wanted clean, production-quality code with proper edge cases.',
          },
          {
            roundNumber: 3, type: 'Managerial Interview', durationMinutes: 45, difficulty: 3,
            topics: ['Projects', 'Behavioral', 'Design'],
            description: 'Manager round focused on project discussions and behavioral questions. "How do you handle ambiguity?", "Tell me about a project that failed", design discussion around a notification system.',
          },
          {
            roundNumber: 4, type: 'HR Interview', durationMinutes: 20, difficulty: 1,
            topics: ['Behavioral'],
            description: 'Short and sweet. Standard questions — introduction, why Microsoft, career goals, relocation, expected joining date. Very relaxed atmosphere.',
          }
        ]
      }
    }
  })

  // 5. Sneha — Google Intern (VERIFIED, 2025)
  await prisma.experience.create({
    data: {
      driveId: driveGoogleIIT25.id,
      studentId: sneha.id,
      result: 'Not Selected',
      verificationStatus: 'VERIFIED',
      publishedAt: new Date('2025-11-20'),
      isAnonymous: true,
      rounds: {
        create: [
          {
            roundNumber: 1, type: 'Online Assessment', durationMinutes: 60, difficulty: 5,
            topics: ['DSA', 'Algorithms'],
            description: 'Two very hard problems. One involved advanced graph algorithms (shortest path with constraints). The other was a complex DP problem. I could only partially solve the second one.',
          },
          {
            roundNumber: 2, type: 'Technical Interview', durationMinutes: 45, difficulty: 5,
            topics: ['DSA', 'Problem Solving'],
            description: 'A single complex problem involving tree manipulation. Had to think about optimal approach for 10 minutes. The interviewer was patient but expected very clean code. I got the approach right but had a bug in edge cases.',
          },
          {
            roundNumber: 3, type: 'Technical Interview', durationMinutes: 45, difficulty: 4,
            topics: ['DSA', 'System Design'],
            description: 'Second technical round. Asked to design a URL shortener, then a coding question on trie data structure. I did well on design but struggled with the trie implementation under time pressure.',
          }
        ]
      }
    }
  })

  // 6. Aman — Goldman Sachs Analyst (PENDING — for TPC to review)
  await prisma.experience.create({
    data: {
      driveId: driveGoldmanIIT26.id,
      studentId: aman.id,
      result: 'Selected',
      verificationStatus: 'PENDING',
      isAnonymous: true,
      rounds: {
        create: [
          {
            roundNumber: 1, type: 'Online Assessment', durationMinutes: 120, difficulty: 4,
            topics: ['DSA', 'Aptitude', 'CS Fundamentals'],
            description: 'Long OA with coding, MCQs on CS fundamentals, and quantitative aptitude. The coding section had 2 hard problems on graphs and DP. MCQs covered OS, DBMS, and networking.',
          },
          {
            roundNumber: 2, type: 'Technical Interview', durationMinutes: 50, difficulty: 4,
            topics: ['DSA', 'Puzzles', 'DBMS'],
            description: 'Mix of coding and puzzles. Asked a medium DSA problem, then two logic puzzles. DBMS questions on transactions and ACID properties. Interviewer was sharp and asked good follow-ups.',
          },
          {
            roundNumber: 3, type: 'HR Interview', durationMinutes: 30, difficulty: 2,
            topics: ['Behavioral', 'Finance'],
            description: 'HR round with some finance-related questions. "Why Goldman Sachs?", "What do you know about our divisions?", "How do you handle pressure?", "Are you open to working in Bangalore?".',
          }
        ]
      }
    }
  })

  // 7. Another pending — TCS
  await prisma.experience.create({
    data: {
      driveId: driveTCSNIT26.id,
      studentId: vikram.id,
      result: 'Selected',
      verificationStatus: 'PENDING',
      isAnonymous: true,
      rounds: {
        create: [
          {
            roundNumber: 1, type: 'Aptitude Test', durationMinutes: 60, difficulty: 2,
            topics: ['Quantitative', 'Verbal', 'Programming'],
            description: 'TCS NQT test. Quantitative was moderate, verbal was easy. Programming section had one easy coding question on arrays.',
          },
          {
            roundNumber: 2, type: 'Technical Interview', durationMinutes: 30, difficulty: 2,
            topics: ['OOPs', 'DBMS', 'Projects'],
            description: 'Basic technical questions. Explain OOP concepts, write a SQL query for joins, describe your project. Nothing tricky.',
          },
          {
            roundNumber: 3, type: 'HR Interview', durationMinutes: 15, difficulty: 1,
            topics: ['Behavioral'],
            description: 'Very short HR round. Introduction, why TCS, willing to sign a bond, relocation preferences. Done in 15 minutes.',
          }
        ]
      }
    }
  })

  console.log('✅ Experiences and rounds created')
  console.log('')
  console.log('🎉 Database seeded successfully!')
  console.log('')
  console.log('Demo accounts:')
  console.log('  Super Admin:  admin@placementarchive.com / password123')
  console.log('  TPC IIT:      tpc@iitdelhi.ac.in / password123')
  console.log('  TPC NIT:      tpc@nitt.edu / password123')
  console.log('  Student:      rahul.sharma@iitdelhi.ac.in / password123')
  console.log('  Student:      priya.gupta@iitdelhi.ac.in / password123')
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
