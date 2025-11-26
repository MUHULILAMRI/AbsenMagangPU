"use client"

import { ProtectedRoute } from "@/components/protected-route"
import AdminNavBar from "@/components/admin-nav-bar"
import AttendanceMonitor from "@/components/attendance-monitor"
import AdminStats from "@/components/admin-stats"

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <div
        className="min-h-screen bg-cover bg-center"
        style={{ backgroundImage: "url('/PUCorporate.png')" }}
      >
        <div className="min-h-screen w-full bg-white/80 backdrop-blur-sm">
          <AdminNavBar />
          <div className="max-w-7xl mx-auto px-4 py-8">
            <AdminStats />
            <div className="mt-8">
              <AttendanceMonitor />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
