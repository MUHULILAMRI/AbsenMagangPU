"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Users, CheckCircle, Clock, AlertCircle } from "lucide-react"

interface AttendanceRecord {
  id: string
  userId: string
  type: "check-in" | "check-out"
  timestamp: string
  location: { latitude: number; longitude: number }
  photo: string
}

interface User {
  id: string
  name: string
  email: string
  role: "employee" | "admin"
  department?: string
}

export default function AdminStats() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    checkedIn: 0,
    notCheckedIn: 0,
  })

  useEffect(() => {
    const users = JSON.parse(localStorage.getItem("users") || "[]")
    const attendance = JSON.parse(localStorage.getItem("attendance") || "[]")

    const employees = users.filter((u: User) => u.role === "employee")
    const today = new Date().toDateString()

    const todayAttendance = attendance.filter(
      (record: AttendanceRecord) => new Date(record.timestamp).toDateString() === today,
    )

    const checkedInToday = new Set(
      todayAttendance.filter((r: AttendanceRecord) => r.type === "check-in").map((r: AttendanceRecord) => r.userId),
    )

    setStats({
      totalEmployees: employees.length,
      presentToday: checkedInToday.size,
      checkedIn: todayAttendance.filter((r: AttendanceRecord) => r.type === "check-in").length,
      notCheckedIn: employees.length - checkedInToday.size,
    })
  }, [])

  const statCards = [
    {
      title: "Total Karyawan",
      value: stats.totalEmployees,
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Hadir Hari Ini",
      value: stats.presentToday,
      icon: CheckCircle,
      color: "bg-green-500",
    },
    {
      title: "Sudah Absen Masuk",
      value: stats.checkedIn,
      icon: Clock,
      color: "bg-purple-500",
    },
    {
      title: "Belum Absen",
      value: stats.notCheckedIn,
      icon: AlertCircle,
      color: "bg-red-500",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className="bg-white shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} rounded-lg p-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-gray-600 text-sm font-medium">{stat.title}</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
