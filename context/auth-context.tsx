"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

// NOTE: This is a mock authentication provider for demo purposes.
// It uses localStorage and sessionStorage to simulate a user session.

export interface User {
  id: string
  name: string
  email: string
  role: "employee" | "admin"
  department?: string
  photo?: string
  password?: string // Password is part of the user object in localStorage
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ message: string } | undefined>
  logout: () => void
  isAuthenticated: boolean
  updateUserPhoto: (userId: string, photo: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for a user session in sessionStorage on initial load
    try {
      const sessionUser = sessionStorage.getItem("sessionUser")
      if (sessionUser) {
        setUser(JSON.parse(sessionUser))
      }
    } catch (error) {
      console.error("Failed to parse session user from sessionStorage", error)
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const usersData = localStorage.getItem("users")
      if (!usersData) {
        return { message: "No users found in demo data." }
      }

      const users: User[] = JSON.parse(usersData)
      const foundUser = users.find(
        (u) => u.email === email && u.password === password,
      )

      if (foundUser) {
        const { password, ...userToSave } = foundUser; // Don't store password in session
        setUser(userToSave as User);
        sessionStorage.setItem("sessionUser", JSON.stringify(userToSave))
        return undefined // Signifies success
      } else {
        return { message: "Invalid login credentials" }
      }
    } catch (error) {
      console.error("Login error:", error)
      return { message: "An unexpected error occurred during login." }
    }
  }

  const logout = () => {
    setUser(null)
    sessionStorage.removeItem("sessionUser")
  }

  const updateUserPhoto = (userId: string, photo: string) => {
    // This is a mock update. It updates the user in the current session
    // and also in the main 'users' list in localStorage.
    if (user && user.id === userId) {
      const updatedUser = { ...user, photo };
      setUser(updatedUser);
      sessionStorage.setItem("sessionUser", JSON.stringify(updatedUser));

      const usersData = localStorage.getItem("users");
      if (usersData) {
        let users: User[] = JSON.parse(usersData);
        users = users.map(u => u.id === userId ? { ...u, photo } : u);
        localStorage.setItem("users", JSON.stringify(users));
      }
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