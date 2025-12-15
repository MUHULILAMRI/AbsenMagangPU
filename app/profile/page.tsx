"use client"

import { ProtectedRoute } from "@/components/protected-route"
import NavBar from "@/components/nav-bar"
import ProfileForm from "@/components/profile-form"

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <main className="py-10">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Profil Saya
            </h1>
            <ProfileForm />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
