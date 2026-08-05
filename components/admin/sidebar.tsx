"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { 
  ChevronDown, 
  LayoutDashboard, 
  Users, 
  FileText, 
  Package, 
  Settings,
  MapPin,
  Building,
  Home,
  AlertTriangle,
  Shield,
  UserCheck,
  Loader2
} from "lucide-react"
import { useState } from "react"

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/volunteers", label: "Volunteers", icon: Users },
  { href: "/admin/site-reports", label: "Situation Reports", icon: FileText },
  { href: "/admin/distributions", label: "Distribution Reports", icon: Package },
  {
    label: "Master Config",
    icon: Settings,
    children: [
      { href: "/admin/config/provinces", label: "Provinces", icon: MapPin },
      { href: "/admin/config/regencies", label: "Regencies", icon: Building },
      { href: "/admin/config/districts", label: "Districts", icon: Home },
      { href: "/admin/config/villages", label: "Villages", icon: Home },
      { href: "/admin/config/disaster-types", label: "Disaster Types", icon: AlertTriangle },
      { href: "/admin/config/field-coordinators", label: "Field Coordinators", icon: UserCheck },
      { href: "/admin/config/admins", label: "Admins", icon: Shield },
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [openMenu, setOpenMenu] = useState<string | null>("Master Config")
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [loadingPath, setLoadingPath] = useState<string | null>(null)

  const handleNavigation = (href: string) => {
    if (href === pathname) return
    
    setLoadingPath(href)
    setIsMobileOpen(false)
    
    // Simulate loading delay for smooth transition
    setTimeout(() => {
      router.push(href)
      setLoadingPath(null)
    }, 150)
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-sidebar text-white rounded-md"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "bg-sidebar text-sidebar-foreground w-64 shrink-0 flex flex-col transition-transform duration-300 z-50",
        "md:relative md:translate-x-0",
        isMobileOpen ? "fixed inset-y-0 left-0 translate-x-0" : "fixed inset-y-0 left-0 -translate-x-full"
      )}>
        <div className="h-16 flex items-center gap-3 px-4 border-b border-white/15">
          <div className="relative h-12 w-12">
            <Image src="/images/rz_whote.png" alt="Rumah Zakat" fill priority sizes="48px" className="object-contain" />
          </div>
          <div className="text-white font-semibold text-lg">Humanitarian</div>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {nav.map((n) => {
              if ("children" in n) {
                const open = openMenu === n.label
                return (
                  <li key={n.label}>
                    <button
                      onClick={() => setOpenMenu(open ? null : n.label)}
                      className="w-full text-left px-4 py-2 flex items-center justify-between hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <n.icon className="h-4 w-4" />
                        <span>{n.label}</span>
                      </div>
                      <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
                    </button>
                    {open && (
                      <ul className="ml-4 space-y-1">
                        {n.children.map((child) => {
                          const active = pathname === child.href
                          return (
                            <li key={child.href}>
                              <button
                                onClick={() => handleNavigation(child.href)}
                                className={cn(
                                  "w-full text-left px-4 py-1.5 text-sm rounded-r-full transition-all duration-200 flex items-center gap-2",
                                  active ? "bg-white/15" : "hover:bg-white/10",
                                  loadingPath === child.href && "opacity-70"
                                )}
                                disabled={loadingPath === child.href}
                              >
                                {loadingPath === child.href ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <child.icon className="h-3 w-3" />
                                )}
                                {child.label}
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </li>
                )
              }
              const active = pathname === n.href
              return (
                <li key={n.href}>
                  <button
                    onClick={() => handleNavigation(n.href)}
                    className={cn(
                      "w-full text-left px-4 py-2 rounded-r-full transition-all duration-200 flex items-center gap-3",
                      active ? "bg-white/15" : "hover:bg-white/10",
                      loadingPath === n.href && "opacity-70"
                    )}
                    disabled={loadingPath === n.href}
                  >
                    {loadingPath === n.href ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <n.icon className="h-4 w-4" />
                    )}
                    {n.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="px-4 py-3 text-xs/5 text-white/80 border-t border-white/15">v1.0</div>
      </aside>

      {/* Loading Overlay */}
      {loadingPath && (
        <div className="fixed inset-0 bg-black/20 z-40 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 shadow-lg flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm font-medium">Loading...</span>
          </div>
        </div>
      )}
    </>
  )
}
