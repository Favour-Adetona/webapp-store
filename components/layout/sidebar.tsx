"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { isAdmin } from "@/lib/local-storage"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { LayoutDashboard, Package, ShoppingCart, Users, Menu, Store } from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()
  const admin = isAdmin()

  const routes = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
      show: true,
    },
    {
      href: "/inventory",
      label: "Inventory",
      icon: Package,
      active: pathname === "/inventory",
      show: true,
    },
    {
      href: "/sales",
      label: "Sales",
      icon: ShoppingCart,
      active: pathname === "/sales",
      show: true,
    },
    {
      href: "/wholesalers",
      label: "Wholesalers",
      icon: Users,
      active: pathname === "/wholesalers",
      show: admin,
    },
  ]

  return (
    <div className="flex flex-col h-full py-6">
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Store Management</h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">Retail Operations</p>
          </div>
        </div>
        <div className="space-y-2">
          {routes
            .filter((route) => route.show)
            .map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 hover:bg-accent/50 group",
                  route.active
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <route.icon
                  className={cn(
                    "h-5 w-5 transition-transform group-hover:scale-110",
                    route.active ? "text-white" : "text-muted-foreground",
                  )}
                />
                <span className="font-medium">{route.label}</span>
                {route.active && <div className="ml-auto w-2 h-2 rounded-full bg-white/80" />}
              </Link>
            ))}
        </div>
      </div>
    </div>
  )
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden hover:bg-accent/50">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0 bg-background/95 backdrop-blur">
        <Sidebar />
      </SheetContent>
    </Sheet>
  )
}
