"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertCircle, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Supabase redirects with the access token in the URL hash
    // This effect will run once on mount to check for it, but the update logic
    // will be triggered by the form submission.
    const hash = window.location.hash
    if (!hash.includes("access_token")) {
      setError("Token reset tidak valid atau telah kedaluwarsa. Silakan coba lagi.")
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    setError("")

    if (password !== confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok.")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password minimal harus 6 karakter.")
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password })

    setLoading(false)
    if (updateError) {
      setError(`Error: ${updateError.message}`)
    } else {
      setMessage("Password Anda telah berhasil diperbarui. Anda akan diarahkan ke halaman login.")
      setTimeout(() => {
        router.push("/")
      }, 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-xl">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
            <p className="text-gray-600 text-sm mt-2">
              Masukkan password baru Anda di bawah ini.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password Baru</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Masukkan password baru"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Konfirmasi Password Baru</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Konfirmasi password baru"
                required
              />
            </div>

            {message && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-green-700 text-sm">{message}</p>
              </div>
            )}

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
              {loading ? "Menyimpan..." : "Simpan Password Baru"}
            </Button>
          </form>

           <div className="mt-6 text-center">
            <Link href="/" className="text-sm font-medium text-blue-600 hover:underline">
              Kembali ke Login
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
