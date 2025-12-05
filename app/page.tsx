"use client"

import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import LoginForm from "@/components/login-form"
import { Loader2 } from "lucide-react"

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "admin") {
        router.push("/admin")
      } else {
        router.push("/attendance")
      }
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
          <p className="text-white/80">Memuat sesi...</p>
        </div>
      </div>
    )
  }

  // Only show Login Form if not loading and no user is logged in
  if (!user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 p-4">
        <LoginForm />
      </div>
    )
  }

  // If user exists, the useEffect is handling the redirect.
  // We can return a loading state here as well to avoid flicker.
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-white animate-spin" />
        <p className="text-white/80">Mengarahkan...</p>
      </div>
    </div>
  )
}
