"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import type { Session, SignUpWithPasswordCredentials } from "@supabase/supabase-js"

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
  signUp: (credentials: SignUpWithPasswordCredentials & { name: string }) => Promise<{ error: { message: string } | null }>
  isAuthenticated: boolean
  mutate: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      
      if (profile) {
        return {
          id: session.user.id,
          email: session.user.email,
          role: profile.role,
          full_name: profile.full_name,
          department: profile.department,
          photo_url: profile.photo_url,
        };
      }
    }
    return null;
  };

  useEffect(() => {
    const initializeUser = async () => {
      const userProfile = await fetchUserProfile();
      setUser(userProfile);
      setLoading(false);
    };

    initializeUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
          initializeUser();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
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
    await supabase.auth.signOut()
    setUser(null);
  }

  const signUp = async (credentials: SignUpWithPasswordCredentials & { name: string }) => {
    const { email, password, name } = credentials;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role: 'employee',
        },
      },
    })
    return { error: error ? { message: error.message } : null }
  }

  const mutate = async () => {
    const userProfile = await fetchUserProfile();
    setUser(userProfile);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    signUp,
    isAuthenticated: !!user,
    mutate,
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