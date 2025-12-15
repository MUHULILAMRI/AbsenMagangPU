"use client"

import { useAuth } from "@/context/auth-context"
import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { MapPin, Clock, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

// Interface to match the 'attendance' table schema
interface AttendanceRecord {
  id: string
  user_id: string
  type: "check-in" | "check-out"
  timestamp: string
  latitude: number
  longitude: number
  photo_url: string
  is_late: boolean
}

export default function AttendanceHistory() {
  const { user } = useAuth()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error("Not authenticated")

        const response = await fetch('/api/attendance', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        if (!response.ok) {
           if (response.status === 404) {
             setRecords([])
             return
           }
          throw new Error("Gagal memuat riwayat absensi.")
        }
        
        const data: AttendanceRecord[] = await response.json()
        setRecords(data.slice(0, 10)) // Get the last 10 records as the API returns them sorted
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred.")
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [user])

  if (loading) {
    return (
      <Card className="bg-white p-8 text-center flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
        <p className="text-gray-500">Memuat riwayat...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white p-8 text-center">
        <p className="text-red-500">{error}</p>
      </Card>
    );
  }
  
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
                  {record.is_late && record.type === 'check-in' && <span className="font-bold"> (Terlambat)</span>}
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
                Lat: {record.latitude.toFixed(4)}, Lon: {record.longitude.toFixed(4)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
