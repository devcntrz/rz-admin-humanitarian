import type { ReactNode } from "react"
import { AdminSidebar } from "@/components/admin/sidebar"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import Link from "next/link"
import { LogoutButton } from "@/components/admin/logout-button"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions as any)
  return (
    <div className="min-h-screen flex">
      <AdminSidebar />
      <main className="flex-1 p-4 md:p-6 lg:p-8 md:ml-0 min-w-0">
        <div className="flex justify-end mb-3 text-sm">
          {session?.user?.email ? (
            <LogoutButton />
          ) : (
            <Link href="/login" className="px-3 py-1.5 rounded-md border hover:bg-muted">
              Login
            </Link>
          )}
        </div>
        {children}
      </main>
    </div>
  )
}
