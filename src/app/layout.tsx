import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import styles from "./layout.module.css";
import { auth } from "@/auth";
import UserNav from "@/components/UserNav";
import SessionWrapper from "@/components/SessionWrapper";

export const metadata: Metadata = {
  title: "PieX (πX) — The Placement Experience",
  description: "Real round-by-round interview questions, online assessments, and preparation tips verified by college placement cells.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const user = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        role: (session.user as any).role,
      }
    : null;

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <SessionWrapper session={session}>
          <nav className={styles.navbar}>
            <div className={`container ${styles.navContainer}`}>
              <Link href="/" className={styles.logo}>
                <span className={styles.logoBadge}>πX</span>
                <span className={styles.logoText}>PieX</span>
                <span className={styles.logoTag}>// THE PLACEMENT EXPERIENCE</span>
              </Link>
              <UserNav user={user} />
            </div>
          </nav>
          {children}
          <footer className="footer">
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>PIEX (πX) · THE PLACEMENT EXPERIENCE</div>
              <div>VERIFIED BY COLLEGE TRAINING & PLACEMENT CELLS (TPC)</div>
            </div>
          </footer>
        </SessionWrapper>
      </body>
    </html>
  );
}
