import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { sql } from "@/lib/db"

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ profile }: any) {
      const email = profile?.email as string | undefined
      if (!email) return false
      const rows = await sql<{ id: number }>`SELECT id FROM admins WHERE email = ${email}`
      return rows.length > 0
    },
    async session({ session }: any) {
      return session
    },
    async redirect({ url, baseUrl }: any) {
      // Ensure redirects stay on the same domain as the request
      // In development, baseUrl will be from the request headers
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`
      }
      // If URL is from same origin, allow it
      try {
        const urlObj = new URL(url)
        const baseUrlObj = new URL(baseUrl)
        if (urlObj.origin === baseUrlObj.origin) {
          return url
        }
      } catch {
        // Invalid URL, use baseUrl
      }
      // Default: redirect to baseUrl (same domain)
      return baseUrl
    },
  },
  session: { strategy: "jwt" },
}

const handler = NextAuth(authOptions as any)
export { handler as GET, handler as POST }


