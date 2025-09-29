"use client"

import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { isAdmin } from "@/lib/local-storage"
import { Calendar } from "lucide-react"

interface UserNavProps {
  user: any
}

export function UserNav({ user }: UserNavProps) {
  const router = useRouter()
  const { toast } = useToast()
  const admin = isAdmin()

  const handleLogout = () => {
    localStorage.removeItem("currentUser")

    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    })

    router.push("/")
  }

  const handleAuditTrail = () => {
    router.push("/dashboard")
    // Small delay to ensure navigation completes before triggering tab change
    setTimeout(() => {
      // Trigger the audit tab - this will be handled by the dashboard component
      const auditTab = document.querySelector('[data-value="audit"]') as HTMLElement
      if (auditTab) {
        auditTab.click()
      }
    }, 100)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name}</p>
            <p className="text-xs leading-none text-muted-foreground">Role: {user?.role}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {admin && (
          <DropdownMenuItem onClick={handleAuditTrail}>
            <Calendar className="mr-2 h-4 w-4" />
            Audit Trail
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
