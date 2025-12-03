"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import type { Session } from "@supabase/supabase-js"

// Custom User type now includes fields from the 'profiles' table
export interface User {
  id: string
  email?: string
  role: "admin" | "employee"
  full_name?: string
  department?: string
  photo_url?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ message: string } | undefined>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session: Session | null) => {
        if (session?.user) {
          // DEBUGGING: Fetch profile without .single() to diagnose the issue
          const { data: profiles, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)

          if (error && error.message !== 'JSON object requested, multiple (or no) rows returned') {
            console.error("DEBUG: Error fetching user profile:", error)
            setUser(null)
          } else if (profiles && profiles.length > 0) {
            const profile = profiles[0]; // Use the first profile found
            const currentUser: User = {
              id: session.user.id,
              email: session.user.email,
              role: profile.role || "employee",
              full_name: profile.full_name,
              department: profile.department,
              photo_url: profile.photo_url,
            }
            setUser(currentUser)
          } else {
            console.warn(`No profile found for user ID: ${session.user.id}. Attempting to create one.`)
            const { data: newProfile, error: insertError } = await supabase
              .from("profiles")
              .insert([{ id: session.user.id, role: "employee" }])
              .select()

            if (insertError) {
              console.error("DEBUG: Error creating user profile:", insertError)
              setUser(null)
            } else if (newProfile) {
              const profile = newProfile[0]
              const currentUser: User = {
                id: session.user.id,
                email: session.user.email,
                role: profile.role || "employee",
                full_name: profile.full_name,
                department: profile.department,
                photo_url: profile.photo_url,
              }
              setUser(currentUser)
              console.log(`Successfully created and set profile for user ID: ${session.user.id}`)
            } else {
              console.error(`DEBUG: Failed to create or retrieve profile for user ID: ${session.user.id}.`)
              setUser(null)
            }
          }
        } else {
          // User is logged out
          setUser(null)
        }
        setLoading(false)
      },
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  // Login and logout functions remain the same
  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message === "Invalid login credentials") {
        return { message: "Email atau password salah." }
      }
      return { message: error.message }
    }
    return undefined // Success
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Error logging out:", error)
    }
  }

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}