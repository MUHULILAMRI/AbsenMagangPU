"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export interface User {
  id: string
  name: string
  email: string
  role: "employee" | "admin"
  department?: string
  photo?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<any>
  logout: () => void
  isAuthenticated: boolean
  updateUserPhoto: (userId: string, photo: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (userProfile) {
          setUser({
            ...session.user,
            ...userProfile,
          });
        }
      }
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (userProfile) {
          setUser({
            ...session.user,
            ...userProfile,
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return error;
    }
    // The user will be set by onAuthStateChange listener
  };

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const updateUserPhoto = async (userId: string, photo: string) => {
    // Update the photo URL in the Supabase 'users' table
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ photo })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating user photo:", error);
      return;
    }

    // Update the user state in the context
    if (user && user.id === userId && updatedUser) {
      setUser({
        ...user,
        ...updatedUser,
      });
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        updateUserPhoto,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}