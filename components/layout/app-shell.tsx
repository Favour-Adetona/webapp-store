"use client"

import type React from "react"
import { NotificationPanel } from "@/components/layout/notification-panel"
import { Store } from "lucide-react"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getCurrentUser } from "@/lib/local-storage"
import { UserNav } from "@/components/layout/user-nav"
import { cn } from "@/lib/utils"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileSidebar } from "@/components/layout/sidebar"
import { Button } from "@/components/ui/button"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const currentUser = getCurrentUser()

    if (!currentUser) {
      router.push("/")
      return
    }

    setUser(currentUser)
  }, [router, pathname])

  if (!user) {
    return null // Or a loading spinner
  }

  return (
    <div className="flex min-h-screen flex-col bg-background relative overflow-hidden">

      <header className="sticky top-0 z-50 w-full border-b-2 border-gradient-to-r from-cyan-500/20 to-orange-500/20 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/85 shadow-lg shadow-cyan-500/10 relative">
        <div className="container flex h-16 sm:h-20 items-center px-3 sm:px-4 lg:px-8">
          <MobileSidebar />
          <div
            className="flex items-center gap-2 sm:gap-4 group cursor-pointer"
            onClick={() => router.push("/dashboard")}
          >
            <div className="relative">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-500 to-orange-500 flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:shadow-xl group-hover:shadow-cyan-500/30 transition-all duration-300 group-hover:scale-110">
                <Store className="text-white w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-orange-500 rounded-full animate-pulse"></div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-cyan-600 to-orange-600 bg-clip-text text-transparent group-hover:from-cyan-500 group-hover:to-orange-500 transition-all duration-300">
                RETAIL OPS
              </h1>
              <span className="text-xs text-muted-foreground font-medium tracking-wider uppercase hidden sm:block">
                Management System
              </span>
            </div>
          </div>

          <div className="hidden xl:flex items-center ml-8 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-100/90 to-orange-100/90 dark:from-cyan-800/60 dark:to-orange-800/60 backdrop-blur-sm border border-cyan-300/60 dark:border-cyan-600/60 shadow-sm">
            <span className="text-sm font-bold text-gray-800 dark:text-gray-100 capitalize tracking-wide">
              {pathname.split("/").filter(Boolean).join(" / ") || "Dashboard"}
            </span>
          </div>

          <div className="ml-auto flex items-center space-x-2 sm:space-x-6">
            <div className="hidden sm:block">
              <NotificationPanel />
            </div>
            <div className="hidden sm:block h-10 w-0.5 bg-gradient-to-b from-transparent via-cyan-500/60 to-transparent shadow-sm"></div>
            <UserNav user={user} />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
      </header>

      <div className="flex flex-1 relative z-10">
        <aside className="hidden md:block w-64 border-r-2 border-gradient-to-b from-cyan-500/30 via-blue-500/20 to-orange-500/30 bg-gradient-to-b from-background/95 via-cyan-50/30 to-orange-50/20 dark:from-gray-900/95 dark:via-cyan-900/20 dark:to-orange-900/10 backdrop-blur-md shadow-xl shadow-cyan-500/10">
          <Sidebar />
        </aside>
        <main className={cn("flex-1 container px-3 py-4 sm:px-4 sm:py-6 md:px-8 md:py-8 max-w-none bg-transparent")}>
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

    </div>
  )
}
