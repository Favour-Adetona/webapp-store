"use client"

import type React from "react"
import { logLogin } from "@/lib/audit-logger"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Store, User, UserPlus, Sparkles } from "lucide-react"
import { InteractiveBackground } from "@/components/ui/interactive-background"

export function LoginForm() {
  const [activeTab, setActiveTab] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [role, setRole] = useState("staff")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        const { data: userProfiles, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", data.user.id)

        if (profileError) {
          console.error("Profile fetch error:", profileError)
          toast({
            variant: "destructive",
            title: "Login failed",
            description: "Could not fetch user profile",
          })
          setIsLoading(false)
          return
        }

        // Handle case where no profile exists or multiple profiles exist
        if (!userProfiles || userProfiles.length === 0) {
          toast({
            variant: "destructive",
            title: "Login failed",
            description: "User profile not found. Please contact administrator.",
          })
          setIsLoading(false)
          return
        }

        if (userProfiles.length > 1) {
          console.warn("Multiple profiles found for user:", data.user.id)
        }

        const userProfile = userProfiles[0]

        toast({
          title: "Welcome back!",
          description: `Successfully logged in as ${userProfile.username}`,
        })

        // Log the login for audit trail
        await logLogin(userProfile)

        router.push("/dashboard")
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "Invalid email or password",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: "Passwords do not match",
      })
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()

      const { data: existingUsers } = await supabase.from("users").select("username").eq("username", username)

      if (existingUsers && existingUsers.length > 0) {
        toast({
          variant: "destructive",
          title: "Signup failed",
          description: "Username already exists",
        })
        setIsLoading(false)
        return
      }

      // Create auth user with metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            username,
            name: name || username,
            role: role,
          },
        },
      })

      if (error) throw error

      if (data.user) {
        toast({
          title: "Account created!",
          description: "Please check your email to confirm your account",
        })

        // Switch to login tab
        setActiveTab("login")

        // Clear form
        setEmail("")
        setPassword("")
        setConfirmPassword("")
        setName("")
        setUsername("")
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: error.message || "An error occurred during signup",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <InteractiveBackground />

      <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-blue-50 to-orange-50 dark:from-gray-900 dark:via-cyan-900 dark:to-orange-900 animate-gradient-xy"></div>

      <div className="w-full max-w-md relative z-10 p-4">
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-md dark:bg-gray-800/90 hover:shadow-3xl transition-all duration-300">
          <CardHeader className="space-y-4 text-center pb-8">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-orange-600 flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300">
              <Store className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-orange-600 bg-clip-text text-transparent">
                RETAIL OPERATIONS
              </CardTitle>
              <CardDescription className="text-base">Access your store management dashboard</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl mb-6">
                <TabsTrigger
                  value="login"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <User className="w-4 h-4 mr-2" />
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 rounded-xl border-0 bg-muted/50 focus:bg-white transition-colors"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 rounded-xl border-0 bg-muted/50 focus:bg-white transition-colors"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-cyan-500 to-orange-600 hover:from-cyan-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Logging in...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Login
                      </div>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-11 rounded-xl border-0 bg-muted/50 focus:bg-white transition-colors"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-username" className="text-sm font-medium">
                      Username
                    </Label>
                    <Input
                      id="signup-username"
                      type="text"
                      placeholder="Choose a username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-11 rounded-xl border-0 bg-muted/50 focus:bg-white transition-colors"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-medium">
                      Email
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 rounded-xl border-0 bg-muted/50 focus:bg-white transition-colors"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-medium">
                      Role
                    </Label>
                    <select
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full h-11 rounded-xl border-0 bg-muted/50 focus:bg-white transition-colors px-3"
                      required
                    >
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm font-medium">
                      Password
                    </Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Choose a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 rounded-xl border-0 bg-muted/50 focus:bg-white transition-colors"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-sm font-medium">
                      Confirm Password
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-11 rounded-xl border-0 bg-muted/50 focus:bg-white transition-colors"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-green-500 to-cyan-600 hover:from-green-600 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating account...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4" />
                        Create Account
                      </div>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="pt-6">
            <div className="w-full text-center">
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">
                Create an account or login with your email
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">New users will receive an email confirmation</p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
