"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const error = await login(email.trim(), password)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push("/attendance")
    }
  }

  // Demo credentials
  const fillDemo = (role: "employee" | "admin") => {
    if (role === "employee") {
      setEmail("karyawan@example.com")
      setPassword("password123")
    } else {
      setEmail("admin@example.com")
      setPassword("admin123")
    }
  }

  return (
    <Card className="w-full max-w-md bg-white shadow-xl">
      <div className="p-8">
        <div className="text-center mb-8">
          <div className="inline-block bg-blue-600 rounded-lg p-3 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 2m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sistem Absensi</h1>
          <p className="text-gray-600 text-sm mt-2">Masuk ke akun Anda</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Masukkan email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Masukkan password"
              required
            />
            <div className="text-right mt-2">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-blue-600 hover:underline">
                
                  Lupa Password?
                
              </Link>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg"
          >
            {loading ? "Memproses..." : "Masuk"}
          </Button>
        </form>

        <div className="mt-6 space-y-2">
          <p className="text-xs text-gray-500 text-center font-medium">Demo Credentials:</p>
          <div className="flex gap-2">
            <button
              onClick={() => fillDemo("employee")}
              className="flex-1 text-xs py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
            >
              Karyawan Demo
            </button>
            <button
              onClick={() => fillDemo("admin")}
              className="flex-1 text-xs py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
            >
              Admin Demo
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
