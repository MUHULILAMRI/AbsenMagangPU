"use client"

import { ProtectedRoute } from "@/components/protected-route"
import AttendanceCard from "@/components/attendance-card"
import AttendanceHistory from "@/components/attendance-history"
import NavBar from "@/components/nav-bar"

export default function AttendancePage() {
  return (
    <ProtectedRoute requiredRole="employee">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <NavBar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <AttendanceCard />
          <div className="mt-8">
            <AttendanceHistory />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
