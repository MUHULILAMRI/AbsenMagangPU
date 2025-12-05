"use client"

import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, Menu } from "lucide-react"
import { useState } from "react"

export default function NavBar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/pu.png" alt="Logo" className="h-10" />
          <div>
            <h1 className="font-bold text-lg text-gray-900">Absensi Magang BPSDM PU</h1>
            <p className="text-xs text-gray-600">{user?.role === "admin" ? "Admin" : "Peserta Magang"}</p>
          </div>
        </div>

        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden">
          <Menu className="w-6 h-6" />
        </button>

        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-3">
            {user?.photo && (
              <img
                src={user.photo || "/placeholder.svg"}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-blue-600"
              />
            )}
            <div>
              <p className="text-sm font-medium text-gray-700">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.department}</p>
            </div>
          </div>
          <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Keluar
          </Button>
        </div>

        {mobileMenuOpen && (
          <div className="absolute top-16 right-4 bg-white rounded-lg shadow-lg p-4 z-50 w-56">
            <div className="mb-4 pb-4 border-b space-y-2">
              {user?.photo && (
                <img
                  src={user.photo || "/placeholder.svg"}
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-blue-600 mx-auto"
                />
              )}
              <p className="text-sm font-medium text-gray-700 text-center">{user?.name}</p>
              <p className="text-xs text-gray-500 text-center">{user?.department}</p>
            </div>
            <Button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
}
