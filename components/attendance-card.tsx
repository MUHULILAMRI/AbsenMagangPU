"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Camera, Clock, Loader } from "lucide-react"
import CameraModal from "./camera-modal"
import LocationDisplay from "./location-display"
import { isWithinRadius, isLate } from "@/lib/geolocation"

interface AttendanceRecord {
  id: string
  userId: string
  type: "check-in" | "check-out"
  timestamp: string
  location: { latitude: number; longitude: number }
  photo: string
  isLate?: boolean
  notes?: string
}

export default function AttendanceCard() {
  const { user } = useAuth()
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([])
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locationError, setLocationError] = useState<string>("")
  const [showCamera, setShowCamera] = useState(false)
  const [attendanceType, setAttendanceType] = useState<"check-in" | "check-out">("check-in")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [locatingInProgress, setLocatingInProgress] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (user) {
      const today = new Date().toDateString()
      const attendance = JSON.parse(localStorage.getItem("attendance") || "[]")
      const todayRecords = attendance.filter(
        (record: AttendanceRecord) => record.userId === user.id && new Date(record.timestamp).toDateString() === today,
      )
      setTodayAttendance(todayRecords)
    }
  }, [user])

  const getLocation = () => {
    setLocationError("")
    setLocatingInProgress(true)

    if (!navigator.geolocation) {
      setLocationError("Geolocation tidak didukung oleh browser Anda")
      setLocatingInProgress(false)
      return
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }

    let attemptCount = 0
    const maxAttempts = 3

    const successCallback = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords

      if (!isWithinRadius(latitude, longitude)) {
        setLocationError(`Anda berada di luar radius kantor. Minimum radius: 100 meter dari lokasi kantor.`)
        setLocatingInProgress(false)
        return
      }

      setLocation({ latitude, longitude })
      setLocatingInProgress(false)
      setShowCamera(true)
    }

    const errorCallback = (error: GeolocationPositionError) => {
      attemptCount++

      if (attemptCount < maxAttempts) {
        setTimeout(() => {
          navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options)
        }, 1000)
      } else {
        setLocationError(
          "Gagal mendapatkan lokasi setelah beberapa percobaan. Pastikan izin lokasi telah diberikan dan GPS aktif.",
        )
        setLocatingInProgress(false)
      }
    }

    navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options)
  }

  const handleAbsensiClick = (type: "check-in" | "check-out") => {
    const today = new Date().toDateString()
    const hasRecordToday = todayAttendance.some((r) => r.type === type)

    if (hasRecordToday) {
      setSuccess(`Anda sudah melakukan ${type === "check-in" ? "absen masuk" : "absen pulang"} hari ini`)
      return
    }

    if (type === "check-out") {
      const now = new Date()
      const checkOutHour = 16 // 4 PM
      if (now.getHours() < checkOutHour) {
        setLocationError(`Absen pulang hanya bisa dilakukan setelah jam ${checkOutHour}:00.`)
        return
      }
    }

    setAttendanceType(type)
    setLocation(null)
    setLocationError("")
    getLocation()
  }

  const handlePhotoCapture = (photoBase64: string) => {
    setShowCamera(false)
    if (!location) {
      setLocationError("Lokasi tidak tersedia. Coba absen lagi.")
      return
    }

    const isCheckIn = attendanceType === "check-in"
    const late = isCheckIn ? isLate() : false

    const newRecord: AttendanceRecord = {
      id: Date.now().toString(),
      userId: user?.id || "",
      type: attendanceType,
      timestamp: new Date().toISOString(),
      location,
      photo: photoBase64,
      isLate: late,
    }

    const attendance = JSON.parse(localStorage.getItem("attendance") || "[]")
    attendance.push(newRecord)
    localStorage.setItem("attendance", JSON.stringify(attendance))

    setTodayAttendance([...todayAttendance, newRecord])

    const lateText = late ? " (TERLAMBAT)" : ""
    setSuccess(`${attendanceType === "check-in" ? "Absen masuk" : "Absen pulang"} berhasil tercatat!${lateText}`)

    setTimeout(() => setSuccess(""), 3000)
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
      {showCamera && (
        <CameraModal
          onCapture={handlePhotoCapture}
          onClose={() => setShowCamera(false)}
          attendanceType={attendanceType}
        />
      )}

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
          {locationError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{locationError}</p>
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

          {(location || locatingInProgress) && (
            <div className="relative">
              {locatingInProgress && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                  <Loader className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
                  <p className="text-blue-700 text-sm">Validasi lokasi... pastikan Anda dalam radius kantor 100m</p>
                </div>
              )}
              {location && <LocationDisplay location={location} />}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => handleAbsensiClick("check-in")}
              disabled={hasCheckedIn || locatingInProgress}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-6 rounded-lg flex items-center justify-center gap-2 transition"
            >
              {locatingInProgress ? <Loader className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              <span className="text-center">
                <div>Absen Masuk</div>
                <div className="text-xs font-normal">Jam: 07:40</div>
              </span>
            </Button>

            <Button
              onClick={() => handleAbsensiClick("check-out")}
              disabled={hasCheckedOut || !hasCheckedIn || locatingInProgress}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-6 rounded-lg flex items-center justify-center gap-2 transition"
            >
              {locatingInProgress ? <Loader className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                              <span className="text-center">
                                <div>Absen Pulang</div>
                                <div className="text-xs font-normal">Jam: 16:00</div>
                              </span>            </Button>
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
                    ? todayAttendance
                        .find((r) => r.type === "check-in")
                        ?.timestamp.split("T")[1]
                        .slice(0, 5)
                    : "Belum"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Absen Pulang</span>
                <span className={`font-semibold ${hasCheckedOut ? "text-green-600" : "text-gray-400"}`}>
                  {hasCheckedOut ? "✓" : "○"}{" "}
                  {hasCheckedOut
                    ? todayAttendance
                        .find((r) => r.type === "check-out")
                        ?.timestamp.split("T")[1]
                        .slice(0, 5)
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
