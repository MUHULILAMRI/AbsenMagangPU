"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Error occurred:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Terjadi Kesalahan</h1>
          <p className="text-gray-300 mb-2">Maaf, terjadi kesalahan saat memproses permintaan Anda.</p>
          <p className="text-gray-400 text-sm">{error.message}</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={reset}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg"
          >
            Coba Lagi
          </Button>
          <Button
            onClick={() => (window.location.href = "/")}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 rounded-lg"
          >
            Beranda
          </Button>
        </div>
      </div>
    </div>
  )
}
