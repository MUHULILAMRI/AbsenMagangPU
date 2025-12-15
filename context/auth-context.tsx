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
        try {
          if (session?.user) {
            const { data: profiles, error } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id);

            if (error && error.message !== 'JSON object requested, multiple (or no) rows returned') {
              console.error("DEBUG: Error fetching user profile:", error);
              setUser(null);
            } else if (profiles && profiles.length > 0) {
              let profile = profiles[0];
              const isAdminEmail = session.user.email === 'muhulila648@gmail.com';

              // If the user is the designated admin but their role in the DB is not 'admin', update it.
              if (isAdminEmail && profile.role !== 'admin') {
                const { data: updatedProfile, error: updateError } = await supabase
                  .from('profiles')
                  .update({ role: 'admin' })
                  .eq('id', session.user.id)
                  .select()
                  .single();

                if (updateError) {
                  console.error("DEBUG: Error updating admin role in database:", updateError);
                } else {
                  console.log(`User ${session.user.email} promoted to admin.`);
                  profile = updatedProfile; // Use the updated profile
                }
              }
              
              const currentUser: User = {
                id: session.user.id,
                email: session.user.email,
                role: profile.role || "employee",
                full_name: profile.full_name,
                department: profile.department,
                photo_url: profile.photo_url,
              };
              setUser(currentUser);
            } else {
              console.warn(`No profile found for user ID: ${session.user.id}. Attempting to create one.`);
              const role = session.user.email === 'muhulila648@gmail.com' ? 'admin' : 'employee';
              const { data: newProfile, error: insertError } = await supabase
                .from("profiles")
                .insert([{ id: session.user.id, role: role, full_name: session.user.user_metadata.name }])
                .select();

              if (insertError) {
                console.error("DEBUG: Error creating user profile:", insertError);
                setUser(null);
              } else if (newProfile) {
                const profile = newProfile[0];
                const currentUser: User = {
                  id: session.user.id,
                  email: session.user.email,
                  role: profile.role || "employee",
                  full_name: profile.full_name,
                  department: profile.department,
                  photo_url: profile.photo_url,
                };
                setUser(currentUser);
                console.log(`Successfully created and set profile for user ID: ${session.user.id}`);
              } else {
                console.error(`DEBUG: Failed to create or retrieve profile for user ID: ${session.user.id}.`);
                setUser(null);
              }
            }
          } else {
            setUser(null);
          }
        } catch (error) {
            console.error("Error in onAuthStateChange handler:", error);
            setUser(null);
        } finally {
            setLoading(false);
        }
      },
    );

    return () => {
      subscription?.unsubscribe();
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
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Error logging out:", error)
    }
  }

  const signUp = async (credentials: SignUpWithPasswordCredentials & { name: string }) => {
    const { email, password, name } = credentials;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    })
  
    // The onAuthStateChange listener will handle setting the user, we just return the error if any
    return { error: error ? { message: error.message } : null }
  }

  const value = {
    user,
    loading,
    login,
    logout,
    signUp,
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