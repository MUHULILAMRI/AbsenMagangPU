"use client"

import { useAuth } from "@/context/auth-context"
import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { MapPin, Clock } from "lucide-react"

interface AttendanceRecord {
  id: string
  userId: string
  type: "check-in" | "check-out"
  timestamp: string
  location: { latitude: number; longitude: number }
  photo: string
  notes?: string
}

export default function AttendanceHistory() {
  const { user } = useAuth()
  const [records, setRecords] = useState<AttendanceRecord[]>([])

  useEffect(() => {
    if (user) {
      const attendance = JSON.parse(localStorage.getItem("attendance") || "[]")
      const userRecords = attendance
        .filter((record: AttendanceRecord) => record.userId === user.id)
        .sort(
          (a: AttendanceRecord, b: AttendanceRecord) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        .slice(0, 10)
      setRecords(userRecords)
    }
  }, [user])

  if (records.length === 0) {
    return (
      <Card className="bg-white p-8 text-center">
        <p className="text-gray-500">Belum ada riwayat absensi</p>
      </Card>
    )
  }

  return (
    <Card className="bg-white overflow-hidden">
      <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-6 py-4 text-white">
        <h3 className="font-bold text-lg">Riwayat Absensi (10 Terakhir)</h3>
      </div>
      <div className="divide-y">
        {records.map((record) => (
          <div key={record.id} className="p-4 hover:bg-gray-50 transition">
            <div className="flex items-start justify-between mb-3">
              <div>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    record.type === "check-in" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {record.type === "check-in" ? "Masuk" : "Pulang"}
                </span>
              </div>
              <span className="text-gray-600 text-sm font-medium">
                {new Date(record.timestamp).toLocaleDateString("id-ID")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
              <Clock className="w-4 h-4" />
              <span>{new Date(record.timestamp).toLocaleTimeString("id-ID")}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <MapPin className="w-4 h-4" />
              <span className="text-xs">
                Lat: {record.location.latitude.toFixed(4)}, Lon: {record.location.longitude.toFixed(4)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
