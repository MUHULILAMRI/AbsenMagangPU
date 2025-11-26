"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit2, Trash2, Check, Loader2 } from "lucide-react"
import UserForm from "./user-form"

interface User {
  id: number
  name: string
  email: string
  password?: string // Password can be optional on the client side
  role: "employee" | "admin"
  department?: string
  photo?: string
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
      const response = await fetch("/api/users")
      if (!response.ok) {
        throw new Error("Gagal memuat data pengguna.")
      }
      const data = await response.json()
      setUsers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.department || '').toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddUser = () => {
    setEditingUser(null)
    setShowForm(true)
    setError(null);
    setSuccess('');
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setShowForm(true)
    setError(null);
    setSuccess('');
  }

  const handleDeleteUser = async (id: number) => {
    setError(null);
    setSuccess('');

    if (!confirm("Apakah Anda yakin ingin menghapus user ini?")) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        let errorMsg = `Error ${response.status}: Gagal menghapus pengguna.`;
        try {
          const errorData = await response.json();
          errorMsg = `Error: ${errorData.error || 'Terjadi kesalahan tidak diketahui.'}`;
        } catch (e) {
          errorMsg = `Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMsg);
      }
      
      setSuccess('User berhasil dihapus');
      loadUsers(); // Refresh the user list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menghapus.');
    }
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleSaveUser = async (userData: Partial<User>) => {
    setError(null);
    setSuccess('');

    try {
      let response;
      if (editingUser) {
        // Edit existing user
        response = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
        });
        if (!response.ok) {
           let errorMsg = `Error ${response.status}: Gagal memperbarui pengguna.`;
           try {
             const errorData = await response.json();
             errorMsg = `Error: ${errorData.error || 'Terjadi kesalahan tidak diketahui.'}`;
           } catch (e) {
             errorMsg = `Error ${response.status}: ${response.statusText}`;
           }
           throw new Error(errorMsg);
        }
        setSuccess('User berhasil diperbarui');
      } else {
        // Add new user
        response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
        });
        
        const responseData = await response.json();

        if (!response.ok) {
          const errorMsg = `Error: ${responseData.error || 'Gagal menambahkan pengguna baru.'}`;
          throw new Error(errorMsg);
        }
        setSuccess(responseData.message || 'User berhasil ditambahkan');
      }
      
      loadUsers(); // Refresh the user list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan.');
    }

    setShowForm(false);
    setEditingUser(null);
    setTimeout(() => setSuccess(''), 5000); // Increased timeout for longer message
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kelola User</h1>
          <p className="text-gray-600 mt-1">Total: {users.length} user terdaftar</p>
        </div>
        <Button onClick={handleAddUser} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Tambah User
        </Button>
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
                      <p className="font-medium text-gray-900">{user.name}</p>
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
                        {user.role === "admin" ? "Admin" : "Karyawan"}
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
