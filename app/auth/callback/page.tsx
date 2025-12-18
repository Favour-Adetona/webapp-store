"use client"

import { useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

function AuthCallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  useEffect(() => {
    const handleCallback = async () => {
      if (code) {
        try {
          const supabase = createClient()
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (!error) {
            router.push(next)
            return
          }
        } catch (error) {
          console.error("Auth callback error:", error)
        }
      }
      
      // Redirect to error page if code is missing or exchange failed
      router.push("/auth/auth-code-error")
    }

    handleCallback()
  }, [code, next, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  )
}

