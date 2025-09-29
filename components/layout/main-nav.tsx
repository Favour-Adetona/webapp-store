"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { isAdmin } from "@/lib/local-storage"

interface MainNavProps {
  user: any
  className?: string
}

export function MainNav({ user, className }: MainNavProps) {
  const pathname = usePathname()
  const admin = isAdmin()

  const routes = [
    {
      href: "/dashboard",
      label: "Dashboard",
      active: pathname === "/dashboard",
      show: true,
    },
    {
      href: "/inventory",
      label: "Inventory",
      active: pathname === "/inventory",
      show: true,
    },
    {
      href: "/sales",
      label: "Sales",
      active: pathname === "/sales",
      show: true,
    },
    {
      href: "/wholesalers",
      label: "Wholesalers",
      active: pathname === "/wholesalers",
      show: admin,
    },
  ]

  return (
    <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)}>
      {routes
        .filter((route) => route.show)
        .map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              route.active ? "text-primary" : "text-muted-foreground",
            )}
          >
            {route.label}
          </Link>
        ))}
    </nav>
  )
}
