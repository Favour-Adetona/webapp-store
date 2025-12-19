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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Store, User, UserPlus, Mail, Lock, CheckCircle2, KeyRound, UserCircle } from "lucide-react"

export function LoginForm() {
  const [activeTab, setActiveTab] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [role, setRole] = useState("staff")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false)
  const [signupEmail, setSignupEmail] = useState("")
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("")
  const [isResettingPassword, setIsResettingPassword] = useState(false)
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

      if (error) {
        console.log("Login error received:", error)
        console.log("Error code:", error.code)
        console.log("Error message:", error.message)
        
        let errorMessage = "Invalid email or password"
        let errorTitle = "Login failed"
        
        // Handle specific error cases
        if (error.code === "email_not_confirmed") {
          errorTitle = "Email not confirmed"
          errorMessage = "Please check your email and confirm your account before logging in"
        } else if (error.code === "invalid_credentials") {
          errorMessage = "Invalid email or password. Please check your credentials and try again"
        } else if (error.code === "too_many_requests") {
          errorMessage = "Too many login attempts. Please try again later"
        } else if (error.code === "user_not_found") {
          errorMessage = "No account found with this email address"
        } else if (error.message) {
          errorMessage = error.message
        }
        
        console.log("Showing toast with message:", errorMessage)
        
        toast({
          variant: "destructive",
          title: errorTitle,
          description: errorMessage,
        })
        
        setIsLoading(false)
        return
      }

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
      console.error("Login error:", error)
      
      let errorMessage = "Invalid email or password"
      
      if (error?.code === "email_not_confirmed") {
        errorMessage = "Please check your email and confirm your account before logging in"
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      toast({
        variant: "destructive",
        title: "Login failed",
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsResettingPassword(true)

    if (!forgotPasswordEmail) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please enter your email address",
      })
      setIsResettingPassword(false)
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        console.error("Password reset error:", error)
        let errorMessage = "Failed to send password reset email"
        
        if (error.message) {
          errorMessage = error.message
        }
        
        toast({
          variant: "destructive",
          title: "Password reset failed",
          description: errorMessage,
        })
        setIsResettingPassword(false)
        return
      }

      toast({
        title: "Password reset email sent",
        description: `Check your email at ${forgotPasswordEmail} for reset instructions`,
      })

      // Close modal and reset form
      setShowForgotPasswordModal(false)
      setForgotPasswordEmail("")
    } catch (error: any) {
      console.error("Unexpected password reset error:", error)
      toast({
        variant: "destructive",
        title: "Password reset failed",
        description: error.message || "An unexpected error occurred",
      })
    } finally {
      setIsResettingPassword(false)
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

      if (error) {
        console.error("Signup error:", error)
        
        let errorMessage = "An error occurred during signup"
        
        // Handle specific error cases
        if (error.code === "user_already_registered") {
          errorMessage = "An account with this email already exists. Please try logging in instead."
        } else if (error.code === "invalid_email") {
          errorMessage = "Please enter a valid email address"
        } else if (error.code === "weak_password") {
          errorMessage = "Password is too weak. Please use a stronger password"
        } else if (error.message) {
          errorMessage = error.message
        }
        
        toast({
          variant: "destructive",
          title: "Signup failed",
          description: errorMessage,
        })
        setIsLoading(false)
        return
      }

      if (data.user) {
        // Show email confirmation modal
        setSignupEmail(email)
        setShowEmailConfirmModal(true)

        // Clear form
        setEmail("")
        setPassword("")
        setConfirmPassword("")
        setName("")
        setUsername("")
      }
    } catch (error: any) {
      console.error("Unexpected signup error:", error)
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: error.message || "An unexpected error occurred during signup",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative">
      <div className="w-full max-w-2xl">
        <Card className="border shadow-lg">
          <CardHeader className="space-y-4 text-center pb-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Store className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold">Retail Operations</CardTitle>
              <CardDescription className="text-base">
                Access your store management dashboard
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Login
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotPasswordEmail(email)
                          setShowForgotPasswordModal(true)
                        }}
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full mt-6"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Logging in...
                      </div>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-0">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <div className="relative">
                        <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="name"
                          type="text"
                          placeholder="Enter your full name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-username">Username</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-username"
                          type="text"
                          placeholder="Choose a username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={role} onValueChange={setRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Choose a password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full mt-6"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating account...
                      </div>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className="pt-4 pb-6">
            <div className="w-full text-center space-y-1">
              <p className="text-sm text-muted-foreground">
                Create an account or login with your email
              </p>
              <p className="text-xs text-muted-foreground">
                New users will receive an email confirmation
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Email Confirmation Modal */}
      <Dialog open={showEmailConfirmModal} onOpenChange={setShowEmailConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-center text-xl">Check Your Email</DialogTitle>
            <DialogDescription className="text-center pt-2">
              We've sent a confirmation email to
            </DialogDescription>
            <div className="text-center pt-1">
              <span className="font-semibold text-foreground">{signupEmail}</span>
            </div>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Please check your email inbox and click the confirmation link to activate your account.
            </p>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> If you don't see the email, please check your spam folder. The confirmation link will expire in 24 hours.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowEmailConfirmModal(false)
                setActiveTab("login")
              }}
              className="w-full"
            >
              Got it, I'll check my email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Forgot Password Modal */}
      <Dialog open={showForgotPasswordModal} onOpenChange={setShowForgotPasswordModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="text-center text-xl">Reset Password</DialogTitle>
            <DialogDescription className="text-center pt-2">
              Enter your email address and we'll send you a link to reset your password
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-password-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="forgot-password-email"
                  type="email"
                  placeholder="Enter your email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForgotPasswordModal(false)
                  setForgotPasswordEmail("")
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isResettingPassword}
                className="w-full sm:w-auto"
              >
                {isResettingPassword ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </div>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
