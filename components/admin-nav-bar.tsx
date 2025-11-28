"use client"

import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, Users, BarChart3, Download } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function AdminNavBar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const downloadAttendanceData = () => {
    const attendance = JSON.parse(localStorage.getItem("attendance") || "[]")
    const users = JSON.parse(localStorage.getItem("users") || "[]")

    // Create CSV data
    let csvContent = "data:text/csv;charset=utf-8,"
    csvContent += "ID,User ID,Nama User,Tipe,Tanggal,Waktu,Latitude,Longitude,Terlambat\n"

    attendance.forEach((record: any) => {
      const userRecord = users.find((u: any) => u.id === record.userId)
      const date = new Date(record.timestamp)
      csvContent += `${record.id},${record.userId},${userRecord?.name || "Unknown"},${record.type},${date.toLocaleDateString("id-ID")},${date.toLocaleTimeString("id-ID")},${record.location.latitude},${record.location.longitude},${record.isLate ? "Ya" : "Tidak"}\n`
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `attendance_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logoPu.png" alt="Logo PU" className="h-10" />
          <div>
            <h1 className="font-bold text-lg text-gray-900">Panel Admin</h1>
            <p className="text-xs text-gray-600">Sistem Manajemen Absensi Magang BPSDM PU</p>
          </div>
        </div>

        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/admin">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>
          <Link href="/admin/analytics">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analitik
            </Button>
          </Link>
          <Link href="/admin/users">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
              <Users className="w-4 h-4" />
              Kelola User
            </Button>
          </Link>
          <Button
            onClick={downloadAttendanceData}
            className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
          <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Keluar
          </Button>
        </div>

        {mobileMenuOpen && (
          <div className="absolute top-16 right-4 bg-white rounded-lg shadow-lg p-4 z-50 space-y-2">
            <Link href="/admin" className="block">
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white justify-start">
                <BarChart3 className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link href="/admin/analytics" className="block">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white justify-start">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analitik
              </Button>
            </Link>
            <Link href="/admin/users" className="block">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start">
                <Users className="w-4 h-4 mr-2" />
                Kelola User
              </Button>
            </Link>
            <Button
              onClick={downloadAttendanceData}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white justify-start"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-700 text-white justify-start">
              <LogOut className="w-4 h-4 mr-2" />
              Keluar
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
}
