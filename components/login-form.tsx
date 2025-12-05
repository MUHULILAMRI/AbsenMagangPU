"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { AlertCircle, Mail, Lock, Loader2, User } from "lucide-react"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const { login, signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (isSignUp) {
      const { error } = await signUp({ email: email.trim(), password, name })
      if (error) {
        setError(error.message)
      } else {
        // Optionally, you can automatically log the user in or show a success message
        // For now, we'll just switch to the login view
        setIsSignUp(false)
        setError("Account created successfully! Please log in.")
      }
    } else {
      const error = await login(email.trim(), password)
      if (error) {
        setError(error.message)
      }
    }
    setLoading(false)
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl flex overflow-hidden">
      {/* Left side with image */}
      <div className="w-1/2 hidden md:block">
        <img src="/pu.png" alt="Login illustration" className="w-full h-full object-cover" />
      </div>

      {/* Right side with form */}
      <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            {isSignUp ? "Create an Account" : "Welcome Back!"}
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            {isSignUp ? "Get started with your new account" : "Sign in to continue"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isSignUp && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-100 text-gray-800 placeholder-gray-400 border border-gray-300 rounded-lg py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Full Name"
                required
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-100 text-gray-800 placeholder-gray-400 border border-gray-300 rounded-lg py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="Email Address"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-100 text-gray-800 placeholder-gray-400 border border-gray-300 rounded-lg py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="Password"
              required
            />
          </div>

          {!isSignUp && (
            <div className="flex items-center justify-between">
              <label className="flex items-center text-sm text-gray-600">
                <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded" />
                <span className="ml-2">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
          )}

          {error && (
            <div className={`p-3 border rounded-lg flex items-start gap-3 ${isSignUp && error.includes("successfully") ? "bg-green-100 border-green-300 text-green-700" : "bg-red-100 border-red-300 text-red-700"}`}>
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-bold py-3 rounded-lg text-base transition-all duration-300 transform hover:scale-105"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (isSignUp ? "Sign Up" : "Login")}
          </Button>
        </form>

        <div className="text-center mt-8 text-sm text-gray-600">
          <p>
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button onClick={() => {setIsSignUp(!isSignUp); setError("")} } className="font-medium text-blue-600 hover:underline">
              {isSignUp ? "Login" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
