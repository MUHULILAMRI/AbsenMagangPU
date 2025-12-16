"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Upload } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

export default function ProfileForm() {
  const { user, loading: userLoading, mutate } = useAuth()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setError("Ukuran file tidak boleh melebihi 2MB.")
        return
      }
      if (!file.type.startsWith("image/")) {
        setError("Harap pilih file gambar (PNG, JPG, dll.).")
        return
      }
      
      setSelectedFile(file)
      setError(null)
      
      // Create a preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !user) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (!preview) {
        throw new Error("Pratinjau gambar tidak tersedia.")
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("Sesi tidak valid. Silakan login kembali.")

      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          photo: preview, // Send base64 string
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Gagal memperbarui foto profil.")
      }

      const updatedProfile = await response.json()

      // Re-fetch user data to update the UI across the app
      await mutate()
      
      setSuccess("Foto profil berhasil diperbarui!")
      setPreview(null) // Clear preview after successful upload
      setSelectedFile(null)

    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan yang tidak terduga.")
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U"
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Foto Profil</CardTitle>
        <CardDescription>
          Perbarui foto profil Anda. Ukuran file maksimal 2MB.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-32 w-32">
              <AvatarImage src={preview || user?.photo_url || undefined} alt={user?.full_name || "User"} className="object-cover" />
              <AvatarFallback className="text-4xl">
                {getInitials(user?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="picture">Pilih Gambar</Label>
              <Input id="picture" type="file" accept="image/*" onChange={handleFileChange} disabled={loading} />
            </div>
          </div>
          
          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}
          {success && (
            <p className="text-sm text-green-600 text-center">{success}</p>
          )}
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button type="submit" disabled={!selectedFile || loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengunggah...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Unggah & Simpan
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
