import { createClient } from "@/lib/supabase/client"
import { createClient as createServerClient } from "@/lib/supabase/server"

export async function getCurrentUser() {
  const supabase = createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null

  // Get user profile from our users table
  const { data: userProfile } = await supabase.from("users").select("*").eq("id", user.id).single()

  return userProfile
}

export async function getCurrentUserServer() {
  const supabase = await createServerClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null

  // Get user profile from our users table
  const { data: userProfile } = await supabase.from("users").select("*").eq("id", user.id).single()

  return userProfile
}

export async function isAdmin() {
  const user = await getCurrentUser()
  return user && user.role === "admin"
}

export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getSession() {
  const supabase = createClient()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()
  return { session, error }
}
