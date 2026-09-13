import type { Metadata } from "next";
import { Suspense } from "react";
import { Lora, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import styles from "./layout.module.css";
import { auth } from "@/auth";
import UserNav from "@/components/UserNav";
import SessionWrapper from "@/components/SessionWrapper";
import NavigationProgressBar from "@/components/NavigationProgressBar";

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const jbMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

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
    <html lang="en" className={`${lora.variable} ${jakarta.variable} ${jbMono.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Suspense fallback={null}>
          <NavigationProgressBar />
        </Suspense>
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
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
              <div>
                <div style={{ fontWeight: 600, color: '#ffffff', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>PIEX (πX) · THE PLACEMENT EXPERIENCE</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>VERIFIED BY COLLEGE TRAINING & PLACEMENT CELLS (TPC) · ED25519 ARCHIVAL AUDIT</div>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.7rem' }}>
                <Link href="/explore" style={{ color: 'var(--text-secondary)' }}>Explore Vault</Link>
                <Link href="/register?role=tpc" style={{ color: 'var(--accent)' }}>Institutional TPC Portal →</Link>
              </div>
            </div>
          </footer>
        </SessionWrapper>
      </body>
    </html>
  );
}
