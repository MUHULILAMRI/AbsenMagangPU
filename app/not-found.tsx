"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-white mb-4">404</h1>
          <p className="text-xl text-gray-300 mb-2">Halaman Tidak Ditemukan</p>
          <p className="text-gray-400">Maaf, halaman yang Anda cari tidak tersedia.</p>
        </div>
        <Link href="/">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3">
            Kembali ke Beranda
          </Button>
        </Link>
      </div>
    </div>
  )
}
