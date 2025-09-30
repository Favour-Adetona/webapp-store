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
import { Calendar } from "lucide-react"
import { useEffect, useState } from "react"
import { getCurrentUser } from "@/lib/supabase-operations"

interface UserNavProps {
  user: any
}

export function UserNav({ user }: UserNavProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [admin, setAdmin] = useState(false)
  const [displayName, setDisplayName] = useState("User")
  const [userRole, setUserRole] = useState("staff")

  useEffect(() => {
    const fetchUserFromBackend = async () => {
      console.log("[v0] UserNav - Fetching user from backend...")
      const backendUser = await getCurrentUser()
      console.log("[v0] UserNav - Backend user data:", JSON.stringify(backendUser, null, 2))

      if (backendUser) {
        const name = backendUser.name || backendUser.username || "User"
        const role = backendUser.role || "staff"
        const isAdminUser = role === "admin"

        console.log("[v0] UserNav - Display name:", name)
        console.log("[v0] UserNav - Role from backend:", role)
        console.log("[v0] UserNav - Is admin:", isAdminUser)

        setDisplayName(name)
        setUserRole(role)
        setAdmin(isAdminUser)
      }
    }

    fetchUserFromBackend()
  }, [])

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

  const initials = displayName.charAt(0).toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground capitalize">Role: {userRole}</p>
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
