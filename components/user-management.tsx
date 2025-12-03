"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit2, Trash2, Check, Loader2 } from "lucide-react"
import UserForm from "./user-form"
import { supabase } from "@/lib/supabaseClient" // Import Supabase client

// This interface should align with your 'profiles' table and the User interface in auth-context
interface User {
  id: string
  full_name: string
  email: string
  password?: string // Password is only for creation, not for display
  role: "employee" | "admin"
  department?: string
  photo_url?: string
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [success, setSuccess] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: usersData, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .order("email", { ascending: true })

      if (fetchError) {
        throw new Error(fetchError.message || "Gagal memuat data pengguna.")
      }
      setUsers(usersData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan yang tidak terduga.")
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      (user.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.department || "").toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddUser = () => {
    setEditingUser(null)
    setShowForm(true)
    setError(null)
    setSuccess("")
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setShowForm(true)
    setError(null)
    setSuccess("")
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus user ini? Aksi ini tidak dapat dibatalkan.")) {
      return
    }
    setError(null);
    setSuccess('');

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error("Not authenticated")

      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Gagal menghapus user.")
      }

      setSuccess("User berhasil dihapus.")
      loadUsers() // Refresh the user list
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus.")
    }
    setTimeout(() => setSuccess(""), 3000)
  }

  const handleSaveUser = async (userData: Partial<User>) => {
    setError(null);
    setSuccess('');

    try {
      if (editingUser) {
        // Edit existing user's profile
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            full_name: userData.full_name,
            department: userData.department,
            role: userData.role,
          })
          .eq("id", editingUser.id)

        if (updateError) throw updateError
        setSuccess("User berhasil diperbarui.")

      } else {
        // Add new user
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) throw new Error("Not authenticated")

        const response = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(userData),
        })

        if (!response.ok) {
          const err = await response.json()
          throw new Error(err.error || "Gagal membuat user baru.")
        }
        setSuccess("User berhasil ditambahkan.")
      }

      loadUsers() // Refresh the user list
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan.")
    }

    setShowForm(false)
    setEditingUser(null)
    setTimeout(() => setSuccess(""), 3000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kelola User</h1>
          <p className="text-gray-600 mt-1">Total: {users.length} user terdaftar</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleAddUser} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Tambah User
          </Button>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {showForm && (
        <UserForm
          key={editingUser ? editingUser.id : 'new-user'}
          user={editingUser}
          onSave={handleSaveUser}
          onCancel={() => {
            setShowForm(false)
            setEditingUser(null)
          }}
        />
      )}

      <Card className="bg-white overflow-hidden shadow-lg">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
          <h3 className="font-bold text-lg">Daftar User</h3>
        </div>

        <div className="p-6 border-b border-gray-200">
          <input
            type="text"
            placeholder="Cari berdasarkan nama, email, atau departemen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Departemen</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <div className="flex justify-center items-center gap-2 text-gray-500">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <p className="text-gray-500">Tidak ada user ditemukan</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{user.full_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-600 text-sm">{user.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-600 text-sm">{user.department || "-"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          user.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {user.role === "admin" ? "Admin" : "Peserta Magang"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
