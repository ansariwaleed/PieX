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
        <Link href="/submit" className={styles.link}>Submit</Link>
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
      
      {/* Submit button is STRICTLY for students! Hidden for TPC and Super Admin */}
      {isStudent && (
        <Link href="/submit" className={styles.link}>Submit</Link>
      )}

      {/* TPC Admin Quick Link */}
      {isTPCAdmin && (
        <Link href="/admin" className={styles.link} style={{ color: 'var(--accent)', fontWeight: 600 }}>
          TPC Console //
        </Link>
      )}

      {/* Super Admin Quick Link */}
      {isSuperAdmin && (
        <Link href="/super-admin" className={styles.link} style={{ color: 'var(--accent)', fontWeight: 600 }}>
          Super Admin Console //
        </Link>
      )}

      {/* Student Campus Hub & My Submissions */}
      {isStudent && (
        <>
          <Link href="/dashboard" className={styles.link} style={{ color: 'var(--accent)', fontWeight: 600 }}>
            Campus Hub
          </Link>
          <Link href="/my-submissions" className={styles.link}>
            My Submissions
          </Link>
        </>
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
