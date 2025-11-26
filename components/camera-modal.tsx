"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Camera, X } from "lucide-react"

interface CameraModalProps {
  onCapture: (photoBase64: string) => void
  onClose: () => void
  attendanceType: "check-in" | "check-out"
}

export default function CameraModal({ onCapture, onClose, attendanceType }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState("")
  const [cameraActive, setCameraActive] = useState(false)

  useEffect(() => {
    let isMounted = true

    const startCamera = async () => {
      try {
        setError("")
        const constraints = {
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)

        if (isMounted && videoRef.current) {
          videoRef.current.srcObject = mediaStream
          streamRef.current = mediaStream

          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play()
            if (isMounted) {
              setCameraActive(true)
            }
          }
        }
      } catch (err: any) {
        if (isMounted) {
          let errorMessage = "Tidak dapat mengakses kamera."

          if (err.name === "NotAllowedError") {
            errorMessage = "Akses kamera ditolak. Berikan izin kamera di pengaturan browser."
          } else if (err.name === "NotFoundError") {
            errorMessage = "Kamera tidak ditemukan di perangkat Anda."
          } else if (err.name === "NotReadableError") {
            errorMessage = "Kamera sedang digunakan aplikasi lain."
          }

          setError(errorMessage)
          setCameraActive(false)
        }
      }
    }

    startCamera()

    return () => {
      isMounted = false
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      try {
        const context = canvasRef.current.getContext("2d")
        if (context && videoRef.current.videoWidth) {
          canvasRef.current.width = videoRef.current.videoWidth
          canvasRef.current.height = videoRef.current.videoHeight

          context.drawImage(videoRef.current, 0, 0)
          const photoData = canvasRef.current.toDataURL("image/jpeg", 0.9)

          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop())
          }

          onCapture(photoData)
        }
      } catch (err) {
        setError("Gagal menangkap foto. Silakan coba lagi.")
      }
    }
  }

  const handleClose = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">
              {attendanceType === "check-in" ? "📸 Absen Masuk" : "📸 Absen Pulang"}
            </h3>
            <p className="text-blue-100 text-xs mt-1">Posisikan wajah Anda dengan baik</p>
          </div>
          <button onClick={handleClose} className="hover:bg-white/20 p-2 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Camera className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-red-600 font-medium mb-2">Akses Kamera Gagal</p>
              <p className="text-gray-600 text-sm mb-6">{error}</p>
              <Button onClick={handleClose} className="bg-gray-600 hover:bg-gray-700 text-white">
                Tutup
              </Button>
            </div>
          ) : (
            <>
              <div className="relative bg-black rounded-xl overflow-hidden aspect-video border-4 border-blue-500/30">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                {!cameraActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-center">
                      <div className="animate-spin">
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-white text-sm mt-2">Memulai kamera...</p>
                    </div>
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} className="hidden" />

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleClose}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleCapture}
                  disabled={!cameraActive}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:bg-gray-300 text-white font-semibold py-3 flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Ambil Foto
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
