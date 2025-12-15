"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/context/auth-context"
import { supabase } from "@/lib/supabaseClient"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Clock, Loader, LogIn, LogOut, MapPin } from "lucide-react"
import { isLate, isWithinRadius } from "@/lib/geolocation"
import LocationDisplay from "./location-display"

interface AttendanceRecord {
  id: string
  user_id: string
  type: "check-in" | "check-out"
  timestamp: string
  is_late: boolean
  latitude?: number
  longitude?: number
}

export default function AttendanceCard() {
  const { user } = useAuth()
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([])
  const [error, setError] = useState<string>("")
  const [loading, setLoading] = useState<"check-in" | "check-out" | null>(null)
  const [success, setSuccess] = useState("")
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locatingInProgress, setLocatingInProgress] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchTodayAttendance = useCallback(async () => {
    if (!user) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setTodayAttendance([])
        return
      }

      const response = await fetch('/api/attendance', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (response.status === 404) {
        setTodayAttendance([])
        return
      }
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Gagal memuat riwayat absensi.')
      }

      const allRecords: AttendanceRecord[] = await response.json()
      const today = new Date().toDateString()
      const todayRecords = allRecords.filter(
        (record) => new Date(record.timestamp).toDateString() === today
      )
      setTodayAttendance(todayRecords)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error tidak diketahui"
      setError(msg)
    }
  }, [user])

  useEffect(() => {
    fetchTodayAttendance()
  }, [fetchTodayAttendance])
  
  const handleAttendance = async (
    type: "check-in" | "check-out",
    location: { latitude: number; longitude: number }
  ) => {
    setLoading(type)
    setError("")
    setSuccess("")

    if (!user) {
      setError("Data pengguna tidak tersedia. Coba login ulang.")
      setLoading(null)
      return
    }

    try {
      const isCheckIn = type === "check-in"
      const late = isCheckIn ? isLate() : false
      const timestamp = new Date().toISOString()

      const attendanceData = {
        type: type,
        is_late: late,
        timestamp: timestamp,
        latitude: location.latitude,
        longitude: location.longitude,
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error("Sesi tidak ditemukan, silakan login ulang.")
      }

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(attendanceData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Gagal menyimpan data absensi.')
      }

      const newRecord = await response.json()
      setTodayAttendance((prevRecords) => [...prevRecords, newRecord])

      const lateText = late ? " (TERLAMBAT)" : ""
      setSuccess(`${type === "check-in" ? "Absen masuk" : "Absen pulang"} berhasil tercatat!${lateText}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan."
      setError(errorMessage)
    } finally {
      setLoading(null)
      setLocatingInProgress(false)
      setTimeout(() => {
        setSuccess("")
        setError("")
      }, 5000)
    }
  }
  
  const getLocationAndAttend = (type: "check-in" | "check-out") => {
    setError("")
    setSuccess("")
    setLocatingInProgress(true)
    setLoading(type)

    if (!navigator.geolocation) {
      setError("Geolocation tidak didukung oleh browser Anda.")
      setLocatingInProgress(false)
      setLoading(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        if (!isWithinRadius(latitude, longitude)) {
          setError(`Anda berada di luar radius kantor. Minimum radius: 100 meter dari lokasi kantor.`)
          setLocatingInProgress(false)
          setLoading(null)
          return
        }
        setLocation({ latitude, longitude })
        handleAttendance(type, { latitude, longitude })
      },
      (error) => {
        setError("Gagal mendapatkan lokasi. Pastikan izin lokasi aktif.")
        setLocatingInProgress(false)
        setLoading(null)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }


  const handleAbsensiClick = (type: "check-in" | "check-out") => {
    const hasRecordToday = todayAttendance.some((r) => r.type === type)

    if (hasRecordToday) {
      setSuccess(`Anda sudah melakukan ${type === "check-in" ? "absen masuk" : "absen pulang"} hari ini.`)
      return
    }

    if (type === "check-out") {
      const now = new Date()
      const checkOutHour = 16 // 4 PM
      if (now.getHours() < checkOutHour) {
        setError(`Absen pulang hanya bisa dilakukan setelah jam ${checkOutHour}:00.`)
        return
      }
    }
    
    getLocationAndAttend(type)
  }

  const timeString = currentTime.toLocaleTimeString("id-ID")
  const dateString = currentTime.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const hasCheckedIn = todayAttendance.some((r) => r.type === "check-in")
  const hasCheckedOut = todayAttendance.some((r) => r.type === "check-out")
  const checkInRecord = todayAttendance.find((r) => r.type === "check-in")

  return (
    <>
      <Card className="bg-white shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
          <div className="text-center">
            {user?.photo_url && (
              <img
                src={user.photo_url}
                alt={user.full_name || "User Photo"}
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-2 border-white shadow-md"
              />
            )}
            <h2 className="text-2xl font-bold mb-1">{user?.full_name}</h2>
            <p className="text-blue-100 mb-6">{user?.department}</p>

            <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
              <div className="text-5xl font-bold font-mono mb-2">{timeString}</div>
              <p className="text-blue-100 text-sm">{dateString}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <div className="w-5 h-5 bg-green-600 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center text-white text-xs">
                ✓
              </div>
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}
          
          {locatingInProgress && !success && (
             <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
               <Loader className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
               <p className="text-blue-700 text-sm">Mendapatkan & memvalidasi lokasi Anda...</p>
             </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => handleAbsensiClick("check-in")}
              disabled={hasCheckedIn || !!loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-6 rounded-lg flex items-center justify-center gap-2 transition"
            >
              {loading === 'check-in' ? <Loader className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
              <span className="text-center">
                <div>Absen Masuk</div>
                <div className="text-xs font-normal">Jam: 07:40</div>
              </span>
            </Button>

            <Button
              onClick={() => handleAbsensiClick("check-out")}
              disabled={hasCheckedOut || !hasCheckedIn || !!loading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-6 rounded-lg flex items-center justify-center gap-2 transition"
            >
              {loading === 'check-out' ? <Loader className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
              <span className="text-center">
                <div>Absen Pulang</div>
                <div className="text-xs font-normal">Jam: 16:00</div>
              </span>
            </Button>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-3">
              <Clock className="w-4 h-4" />
              <span className="font-medium">Status Hari Ini</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-gray-700">Absen Masuk</span>
                  {checkInRecord?.isLate && <div className="text-xs text-red-600 font-semibold">TERLAMBAT</div>}
                </div>
                <span className={`font-semibold ${hasCheckedIn ? "text-green-600" : "text-gray-400"}`}>
                  {hasCheckedIn ? "✓" : "○"}{" "}
                  {hasCheckedIn
                    ? new Date(todayAttendance.find((r) => r.type === "check-in")!.timestamp).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })
                    : "Belum"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Absen Pulang</span>
                <span className={`font-semibold ${hasCheckedOut ? "text-green-600" : "text-gray-400"}`}>
                  {hasCheckedOut ? "✓" : "○"}{" "}
                  {hasCheckedOut
                    ? new Date(todayAttendance.find((r) => r.type === "check-out")!.timestamp).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })
                    : "Belum"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </>
  )
}
