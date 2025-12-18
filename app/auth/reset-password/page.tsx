"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Lock, KeyRound, CheckCircle2 } from "lucide-react"

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    // Check if we have the necessary tokens in the URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get("access_token")
    const type = hashParams.get("type")

    // Also check search params (some flows use search params)
    const accessTokenFromSearch = searchParams.get("access_token")
    const typeFromSearch = searchParams.get("type")

    if ((!accessToken && !accessTokenFromSearch) || (type !== "recovery" && typeFromSearch !== "recovery")) {
      toast({
        variant: "destructive",
        title: "Invalid reset link",
        description: "This password reset link is invalid or has expired. Please request a new one.",
      })
      router.push("/")
    }
  }, [searchParams, router, toast])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same",
      })
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 6 characters long",
      })
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      
      // Get the access token from URL hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get("access_token") || searchParams.get("access_token")

      if (!accessToken) {
        throw new Error("No access token found")
      }

      // Update the password
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        console.error("Password reset error:", error)
        let errorMessage = "Failed to reset password"
        
        if (error.message) {
          errorMessage = error.message
        }
        
        toast({
          variant: "destructive",
          title: "Password reset failed",
          description: errorMessage,
        })
        setIsLoading(false)
        return
      }

      setIsSuccess(true)
      toast({
        title: "Password reset successful",
        description: "Your password has been updated. You can now log in with your new password.",
      })

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/")
      }, 2000)
    } catch (error: any) {
      console.error("Unexpected password reset error:", error)
      toast({
        variant: "destructive",
        title: "Password reset failed",
        description: error.message || "An unexpected error occurred",
      })
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border shadow-lg">
          <CardHeader className="space-y-4 text-center pb-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold">Password Reset Successful</CardTitle>
              <CardDescription>
                Your password has been updated. Redirecting to login...
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border shadow-lg">
        <CardHeader className="space-y-4 text-center pb-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <KeyRound className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">Reset Your Password</CardTitle>
            <CardDescription>
              Enter your new password below
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirm-new-password"
                  type="password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
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
                  Resetting password...
                </div>
              ) : (
                "Reset Password"
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="text-sm text-primary hover:underline"
              >
                Back to login
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md border shadow-lg">
            <CardContent className="py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}

