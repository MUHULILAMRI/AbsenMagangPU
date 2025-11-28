"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Camera } from "lucide-react"

interface User {
  id: number
  name: string
  email: string
  password?: string // Password is now optional in User interface
  role: "employee" | "admin"
  department?: string
  photo?: string
}

interface UserFormProps {
  user: User | null
  onSave: (userData: Partial<User>) => void // Changed type here
  onCancel: () => void
}

export default function UserForm({ user, onSave, onCancel }: UserFormProps) {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    confirmPassword: "",
    role: user?.role || "employee",
    department: user?.department || "",
    photo: user?.photo || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Nama harus diisi"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email harus diisi"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format email tidak valid"
    }

    // Password validation logic
    if (user) { // Editing existing user
      if (formData.password) { // Only validate if password field is not empty
        if (formData.password.length < 6) {
          newErrors.password = "Password minimal 6 karakter"
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = "Password tidak cocok"
        }
      }
    } else { // Adding new user
      if (!formData.password.trim()) {
        newErrors.password = "Password harus diisi";
      } else if (formData.password.length < 6) {
        newErrors.password = "Password minimal 6 karakter";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Password tidak cocok";
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePhotoCapture = async () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event: any) => {
          setFormData({ ...formData, photo: event.target.result })
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setLoading(true)

    try {
      const userData: Partial<User> = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        photo: formData.photo,
      };

      // Only include password if it's not empty
      if (formData.password) {
        userData.password = formData.password;
      }

      onSave(userData)
    } catch (error) {
      console.error("Error saving user:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-white shadow-lg mb-6 overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 text-white">
        <h3 className="font-bold text-lg">{user ? "Edit User" : "Tambah User Baru"}</h3>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="flex flex-col items-center gap-4 pb-4 border-b">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center border-2 border-gray-300">
            {formData.photo ? (
              <img
                src={formData.photo || "/placeholder.svg"}
                alt="User preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <Camera className="w-10 h-10 text-gray-400" />
            )}
          </div>
          <Button
            type="button"
            onClick={handlePhotoCapture}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Upload Foto
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Masukkan nama lengkap"
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Masukkan email"
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition ${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
              placeholder={user ? "Kosongkan untuk tidak mengubah" : "Masukkan password"}
            />
            {errors.password && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.password}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Konfirmasi Password</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition ${
                errors.confirmPassword ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Konfirmasi password"
            />
            {errors.confirmPassword && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.confirmPassword}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Departemen</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
              placeholder="Masukkan departemen"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as "employee" | "admin" })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
            >
              <option value="employee">Karyawan</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-medium"
          >
            {loading ? "Menyimpan..." : user ? "Perbarui User" : "Tambah User"}
          </Button>
        </div>
      </form>
    </Card>
  )
}
