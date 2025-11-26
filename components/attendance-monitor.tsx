"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Clock, MapPin, Camera, ChevronDown } from "lucide-react"

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
  department?: string
}

export default function AttendanceMonitor() {
  const [records, setRecords] = useState<(AttendanceRecord & { userName: string; userEmail: string })[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const users = JSON.parse(localStorage.getItem("users") || "[]")
    const attendance = JSON.parse(localStorage.getItem("attendance") || "[]")

    const today = new Date().toDateString()
    const todayRecords = attendance
      .filter((record: AttendanceRecord) => new Date(record.timestamp).toDateString() === today)
      .map((record: AttendanceRecord) => {
        const user = users.find((u: User) => u.id === record.userId)
        return {
          ...record,
          userName: user?.name || "Unknown",
          userEmail: user?.email || "unknown@example.com",
        }
      })
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    setRecords(todayRecords)
  }, [])

  if (records.length === 0) {
    return (
      <Card className="bg-white p-8 text-center">
        <p className="text-gray-500">Belum ada data absensi hari ini</p>
      </Card>
    )
  }

  return (
    <Card className="bg-white overflow-hidden shadow-lg">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 text-white">
        <h3 className="font-bold text-lg">Monitor Absensi Hari Ini</h3>
        <p className="text-purple-100 text-sm mt-1">Total: {records.length} pencatatan</p>
      </div>

      <div className="divide-y">
        {records.map((record) => (
          <div key={record.id} className="hover:bg-gray-50 transition">
            <div
              onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
              className="p-4 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{record.userName}</p>
                    <p className="text-xs text-gray-600">{record.userEmail}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                      record.type === "check-in" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {record.type === "check-in" ? "Masuk" : "Pulang"}
                  </span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    expandedId === record.id ? "transform rotate-180" : ""
                  }`}
                />
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {new Date(record.timestamp).toLocaleTimeString("id-ID")}
                </div>
                <span className="text-xs text-gray-500">{new Date(record.timestamp).toLocaleDateString("id-ID")}</span>
              </div>
            </div>

            {expandedId === record.id && (
              <div className="px-4 pb-4 bg-gray-50 border-t border-gray-200">
                <div className="space-y-4 mt-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-gray-600 mt-1 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-gray-900 mb-1">Lokasi</p>
                      <p className="text-gray-600 text-xs">Latitude: {record.location.latitude.toFixed(6)}</p>
                      <p className="text-gray-600 text-xs">Longitude: {record.location.longitude.toFixed(6)}</p>
                      <a
                        href={`https://maps.google.com/?q=${record.location.latitude},${record.location.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-xs mt-2 inline-block underline"
                      >
                        Buka di Google Maps
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Camera className="w-4 h-4 text-gray-600 mt-1 flex-shrink-0" />
                    <div className="text-sm w-full">
                      <p className="font-medium text-gray-900 mb-2">Foto Absensi</p>
                      <img
                        src={record.photo || "/placeholder.svg"}
                        alt="Attendance photo"
                        className="w-full max-w-xs rounded-lg border border-gray-300"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
