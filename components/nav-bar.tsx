"use client"

import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, Menu, User as UserIcon, Settings } from "lucide-react"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

export default function NavBar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push("/")
  }
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U"
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src="/pu.png" alt="Logo" className="h-10" />
            <div>
              <h1 className="font-bold text-lg text-gray-800">Absensi Magang BPSDM PU</h1>
              <p className="text-xs text-gray-500">{user?.role === "admin" ? "Admin" : "Peserta Magang"}</p>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.photo_url || ''} alt={user?.full_name || ''} className="object-cover" />
                    <AvatarFallback>{getInitials(user?.full_name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.full_name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Keluar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
         <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <div className="flex items-center px-4 py-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.photo_url || ''} alt={user?.full_name || ''} className="object-cover" />
                    <AvatarFallback>{getInitials(user?.full_name)}</AvatarFallback>
                  </Avatar>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">{user?.full_name}</div>
                  <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                </div>
              </div>
              <Link
                href="/profile"
                className="text-gray-600 hover:bg-gray-100 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Profil
              </Link>
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="px-2 space-y-1">
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="w-full justify-start"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Keluar
                </Button>
              </div>
            </div>
         </div>
      )}
    </nav>
  )
}
