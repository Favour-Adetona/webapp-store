"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { isAdmin } from "@/lib/local-storage"

interface MobileNavProps {
  user: any
}

export function MobileNav({ user }: MobileNavProps) {
  const [open, setOpen] = useState(false)
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="mr-2 px-0 text-base md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <div className="px-7">
          <Link href="/dashboard" className="flex items-center" onClick={() => setOpen(false)}>
            <span className="font-bold">Store Management</span>
          </Link>
        </div>
        <div className="mt-8 flex flex-col space-y-3">
          {routes
            .filter((route) => route.show)
            .map((route) => (
              <Link
                key={route.href}
                href={route.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "px-7 py-2 text-base font-medium transition-colors hover:text-primary",
                  route.active ? "text-primary" : "text-muted-foreground",
                )}
              >
                {route.label}
              </Link>
            ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
