'use client'

import { signOut } from 'next-auth/react'
import Link from 'next/link'
import styles from '@/app/layout.module.css'

interface UserNavProps {
  user: {
    name?: string | null
    email?: string | null
    role?: string | null
  } | null
}

export default function UserNav({ user }: UserNavProps) {
  if (!user) {
    return (
      <div className={styles.navLinks}>
        <Link href="/explore" className={styles.link}>Explore</Link>
        <Link href="/submit" className={styles.link}>Share Experience</Link>
        <Link href="/login" className={styles.loginBtn}>Sign In</Link>
      </div>
    )
  }

  const role = user.role || 'STUDENT'
  const isTPCAdmin = role === 'TPC_ADMIN'
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isStudent = role === 'STUDENT'

  return (
    <div className={styles.navLinks}>
      <Link href="/explore" className={styles.link}>Explore</Link>
      
      {/* Submit button is for students to share experiences */}
      {isStudent && (
        <Link href="/submit" className={styles.link}>Share Experience</Link>
      )}

      {/* TPC Officer Experience Management */}
      {isTPCAdmin && (
        <Link href="/admin" className={styles.link} style={{ color: 'var(--accent)', fontWeight: 600 }}>
          Manage Experiences
        </Link>
      )}

      {/* Super Admin Experience Management */}
      {isSuperAdmin && (
        <Link href="/super-admin/experiences" className={styles.link} style={{ color: 'var(--accent)', fontWeight: 600 }}>
          All Experiences
        </Link>
      )}

      {/* Student My Submissions */}
      {isStudent && (
        <Link href="/my-submissions" className={styles.link}>
          My Submissions
        </Link>
      )}

      <div className={styles.userPill}>
        <span className={styles.userName}>{user.name || user.email}</span>
        <span className={isSuperAdmin ? styles.roleSuper : isTPCAdmin ? styles.roleAdmin : styles.roleStudent}>
          {isSuperAdmin ? 'SUPER ADMIN' : isTPCAdmin ? 'TPC OFFICER' : 'STUDENT'}
        </span>
      </div>

      <button
        onClick={() => signOut({ callbackUrl: '/' })}
        className={styles.signOutBtn}
        title="Sign Out"
      >
        Sign Out
      </button>
    </div>
  )
}
