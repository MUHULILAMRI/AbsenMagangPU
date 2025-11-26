"use client"

import { ProtectedRoute } from "@/components/protected-route"
import AdminNavBar from "@/components/admin-nav-bar"
import UserManagement from "@/components/user-management"

export default function UsersPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <AdminNavBar />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <UserManagement />
        </div>
      </div>
    </ProtectedRoute>
  )
}
