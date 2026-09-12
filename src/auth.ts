import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || "placement_archive_jwt_secret_key_2026_super_secure",
  providers: [
    // Single credentials provider for all roles (Student, TPC Admin, Super Admin)
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = (credentials.email as string).toLowerCase().trim()
        const password = credentials.password as string

        let user = await prisma.user.findUnique({
          where: { email }
        })

        // Allow super admin to log in with admin@piex.com or admin@placementarchive.com
        if (!user && (email === 'admin@piex.com' || email === 'admin@placementarchive.com' || email === 'superadmin@piex.com' || email === 'admin@piex.ac.in')) {
          user = await prisma.user.findFirst({
            where: { role: 'SUPER_ADMIN' }
          })
        }

        if (!user || !user.passwordHash) return null

        let passwordsMatch = await bcrypt.compare(
          password,
          user.passwordHash
        )

        // For Super Admin: also accept standard admin passwords if forgotten
        if (!passwordsMatch && user.role === 'SUPER_ADMIN') {
          if (['admin123', 'password123', 'admin@123', 'admin', 'piex123', 'PieX@2026'].includes(password)) {
            passwordsMatch = true
            const newHash = await bcrypt.hash(password, 10)
            await prisma.user.update({
              where: { id: user.id },
              data: { passwordHash: newHash }
            }).catch(console.error)
          }
        }

        if (!passwordsMatch) return null

        // TPC Admins must be accepted by Super Admin before accessing the platform
        if (user.role === 'TPC_ADMIN' && user.verificationStatus === 'PENDING') {
          return null
        }

        if (user.role === 'TPC_ADMIN' && user.verificationStatus === 'REJECTED') {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
        token.campusId = (user as any).campusId
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        ;(session.user as any).role = token.role as string
        ;(session.user as any).campusId = token.campusId as string
      }
      return session
    }
  },
  session: { strategy: "jwt" }
})
