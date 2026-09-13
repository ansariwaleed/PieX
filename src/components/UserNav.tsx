'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from '@/app/layout.module.css'

interface UserNavProps {
  user: {
    name?: string | null
    email?: string | null
    role?: string | null
  } | null
}

export default function UserNav({ user }: UserNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  // Automatically close mobile menu when navigating to another page
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  const role = user?.role || 'STUDENT'
  const isTPCAdmin = role === 'TPC_ADMIN'
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isStudent = role === 'STUDENT'

  return (
    <>
      {/* ——— Desktop Navigation (Hidden on <= 768px via layout.module.css) ——— */}
      <div className={styles.desktopNavLinks}>
        <Link href="/explore" className={styles.link}>Explore</Link>

        {(!user || isStudent) && (
          <Link href="/submit" className={styles.link}>Share Experience</Link>
        )}

        {user && isTPCAdmin && (
          <Link href="/admin" className={styles.link} style={{ color: 'var(--accent)', fontWeight: 600 }}>
            Manage Experiences
          </Link>
        )}

        {user && isSuperAdmin && (
          <Link href="/super-admin/experiences" className={styles.link} style={{ color: 'var(--accent)', fontWeight: 600 }}>
            All Experiences
          </Link>
        )}

        {user && isStudent && (
          <Link href="/my-submissions" className={styles.link}>
            My Submissions
          </Link>
        )}

        {!user ? (
          <Link href="/login" className={styles.loginBtn}>Sign In</Link>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* ——— Mobile Hamburger Toggle Button (Visible only on <= 768px) ——— */}
      <button
        type="button"
        className={`${styles.hamburgerBtn} ${isMenuOpen ? styles.hamburgerActive : ''}`}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label={isMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
        aria-expanded={isMenuOpen}
      >
        <span className={styles.hamburgerBar} />
        <span className={styles.hamburgerBar} />
        <span className={styles.hamburgerBar} />
      </button>

      {/* ——— Mobile Slide-Down Drawer Navigation ——— */}
      {isMenuOpen && (
        <div className={styles.mobileBackdrop} onClick={() => setIsMenuOpen(false)}>
          <div className={styles.mobileDrawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.mobileDrawerHeader}>
              <div className={styles.mobileDrawerKicker}>
                πX · NAVIGATION MENU
              </div>
              <button
                type="button"
                className={styles.mobileCloseBtn}
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close Menu"
              >
                ✕
              </button>
            </div>

            <div className={styles.mobileLinksList}>
              <Link href="/explore" className={styles.mobileLink} onClick={() => setIsMenuOpen(false)}>
                <span className={styles.mobileLinkIcon}>❖</span>
                Explore Placement Vault
              </Link>

              {(!user || isStudent) && (
                <Link href="/submit" className={styles.mobileLink} onClick={() => setIsMenuOpen(false)}>
                  <span className={styles.mobileLinkIcon}>✎</span>
                  Share Placement Experience
                </Link>
              )}

              {user && isTPCAdmin && (
                <Link href="/admin" className={`${styles.mobileLink} ${styles.mobileLinkAccent}`} onClick={() => setIsMenuOpen(false)}>
                  <span className={styles.mobileLinkIcon}>⚙</span>
                  Manage Institutional Experiences
                </Link>
              )}

              {user && isSuperAdmin && (
                <Link href="/super-admin/experiences" className={`${styles.mobileLink} ${styles.mobileLinkAccent}`} onClick={() => setIsMenuOpen(false)}>
                  <span className={styles.mobileLinkIcon}>🛡</span>
                  Platform Master Archives
                </Link>
              )}

              {user && isStudent && (
                <Link href="/my-submissions" className={styles.mobileLink} onClick={() => setIsMenuOpen(false)}>
                  <span className={styles.mobileLinkIcon}>⎘</span>
                  My Submissions & Status
                </Link>
              )}
            </div>

            <div className={styles.mobileDrawerFooter}>
              {user ? (
                <div className={styles.mobileUserSection}>
                  <div className={styles.mobileUserInfo}>
                    <div className={styles.mobileUserName}>{user.name || user.email}</div>
                    <span className={isSuperAdmin ? styles.roleSuper : isTPCAdmin ? styles.roleAdmin : styles.roleStudent}>
                      {isSuperAdmin ? 'SUPER ADMIN' : isTPCAdmin ? 'TPC OFFICER' : 'STUDENT'}
                    </span>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className={styles.mobileSignOutBtn}
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className={styles.mobileAuthButtons}>
                  <Link href="/login" className={styles.mobileLoginBtn} onClick={() => setIsMenuOpen(false)}>
                    Sign In to Account
                  </Link>
                  <Link href="/register" className={styles.mobileRegisterBtn} onClick={() => setIsMenuOpen(false)}>
                    Register New Student / TPC
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
