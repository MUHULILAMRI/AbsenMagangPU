"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Users, Clock, CheckCircle, AlertCircle } from "lucide-react"

interface AttendanceRecord {
  id: string
  userId: string
  type: "check-in" | "check-out"
  timestamp: string
  location: { latitude: number; longitude: number }
  photo: string
  isLate?: boolean
}

interface User {
  id: string
  name: string
  email: string
  role: "employee" | "admin"
  department?: string
  photo?: string
}

export default function AnalyticsDashboard() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalAbsent: 0,
    totalLate: 0,
    attendanceRate: 0,
  })

  useEffect(() => {
    const attendanceData = JSON.parse(localStorage.getItem("attendance") || "[]")
    const usersData = JSON.parse(localStorage.getItem("users") || "[]")

    setAttendance(attendanceData)
    setUsers(usersData.filter((u: User) => u.role === "employee"))

    // Calculate statistics
    const totalEmployees = usersData.filter((u: User) => u.role === "employee").length
    const today = new Date().toDateString()
    const todayAbsent = attendanceData.filter(
      (r: AttendanceRecord) => r.type === "check-in" && new Date(r.timestamp).toDateString() === today,
    )
    const totalLate = todayAbsent.filter((r: AttendanceRecord) => r.isLate).length
    const attendanceRate = totalEmployees > 0 ? Math.round((todayAbsent.length / totalEmployees) * 100) : 0

    setStats({
      totalEmployees,
      totalAbsent: todayAbsent.length,
      totalLate,
      attendanceRate,
    })
  }, [])

  const getAttendanceByDay = () => {
    const dayData: Record<string, number> = {}

    attendance
      .filter((r) => r.type === "check-in")
      .forEach((r) => {
        const date = new Date(r.timestamp).toLocaleDateString("id-ID")
        dayData[date] = (dayData[date] || 0) + 1
      })

    return Object.entries(dayData)
      .map(([date, count]) => ({ date, total: count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7)
  }

  const getDepartmentData = () => {
    const deptData: Record<string, { present: number; total: number }> = {}

    users.forEach((u) => {
      const dept = u.department || "Tidak Ada"
      if (!deptData[dept]) {
        deptData[dept] = { present: 0, total: 0 }
      }
      deptData[dept].total += 1

      const today = new Date().toDateString()
      const presentToday = attendance.some(
        (r) => r.userId === u.id && r.type === "check-in" && new Date(r.timestamp).toDateString() === today,
      )
      if (presentToday) {
        deptData[dept].present += 1
      }
    })

    return Object.entries(deptData).map(([dept, data]) => ({
      name: dept,
      hadir: data.present,
      total: data.total,
      persentase: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0,
    }))
  }

  const getStatusData = () => {
    const today = new Date().toDateString()
    const totalEmployees = users.length
    const present = attendance.filter(
      (r) => r.type === "check-in" && new Date(r.timestamp).toDateString() === today,
    ).length
    const absent = totalEmployees - present

    return [
      { name: "Hadir", value: present, fill: "#10b981" },
      { name: "Tidak Hadir", value: absent, fill: "#ef4444" },
    ]
  }

  const attendanceByDay = getAttendanceByDay()
  const departmentData = getDepartmentData()
  const statusData = getStatusData()

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard Analitik</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Peserta Magang</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalEmployees}</p>
            </div>
            <Users className="w-12 h-12 text-blue-600 opacity-10" />
          </div>
        </Card>

        <Card className="bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Hadir Hari Ini</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.totalAbsent}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-600 opacity-10" />
          </div>
        </Card>

        <Card className="bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Terlambat Hari Ini</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.totalLate}</p>
            </div>
            <AlertCircle className="w-12 h-12 text-red-600 opacity-10" />
          </div>
        </Card>

        <Card className="bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Tingkat Kehadiran</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{stats.attendanceRate}%</p>
            </div>
            <Clock className="w-12 h-12 text-purple-600 opacity-10" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white p-6 shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Kehadiran 7 Hari Terakhir</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attendanceByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="bg-white p-6 shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Status Kehadiran Hari Ini</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="bg-white p-6 shadow-lg col-span-full">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Kehadiran per Departemen</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Departemen</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Hadir</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Total</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Persentase</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {departmentData.map((dept, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900 font-medium">{dept.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                        {dept.hadir}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{dept.total}</td>
                    <td className="px-4 py-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${dept.persentase}%` }}></div>
                      </div>
                      <span className="text-sm text-gray-600 ml-2">{dept.persentase}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
