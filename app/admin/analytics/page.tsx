"use client"

import { ProtectedRoute } from "@/components/protected-route"
import AdminNavBar from "@/components/admin-nav-bar"
import AnalyticsDashboard from "@/components/analytics-dashboard"

export default function AnalyticsPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <AdminNavBar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <AnalyticsDashboard />
        </div>
      </div>
    </ProtectedRoute>
  )
}
