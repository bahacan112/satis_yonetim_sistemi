"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, UserPlus, RefreshCw, AlertTriangle } from "lucide-react"

interface Profile {
  id: string
  email: string
  role: "admin" | "operator"
  full_name: string | null
  created_at: string
}

export default function KullanicilarPage() {
  const { userRole } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    role: "operator" as "admin" | "operator",
    full_name: "",
  })
  const [createFormData, setCreateFormData] = useState({
    email: "",
    password: "",
    role: "operator" as "admin" | "operator",
    full_name: "",
  })
  const [message, setMessage] = useState("")
  const [debugInfo, setDebugInfo] = useState("")

  useEffect(() => {
    fetchProfiles()
  }, [])

  const fetchProfiles = async () => {
    try {
      // Email alanını da getir
      const { data, error } = await supabase
        .from("profiles")
        .select("*, email:auth.users!profiles.id(email)")
        .order("created_at", { ascending: false })

      if (error) throw error

      // Email bilgisini profiles nesnesine ekle
      const profilesWithEmail =
        data?.map((profile) => {
          return {
            ...profile,
            email: profile.email?.[0]?.email || "Email bulunamadı",
          }
        }) || []

      setProfiles(profilesWithEmail)

      const adminCount = profilesWithEmail?.filter((p) => p.role === "admin").length || 0
      const operatorCount = profilesWithEmail?.filter((p) => p.role === "operator").length || 0
      setDebugInfo(
        `Toplam: ${profilesWithEmail?.length || 0} kullanıcı (${adminCount} admin, ${operatorCount} operator)`,
      )
    } catch (error) {
      console.error("Error fetching profiles:", error)
      setDebugInfo(`Hata: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingProfile) return

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          role: formData.role,
          full_name: formData.full_name,
        })
        .eq("id", editingProfile.id)

      if (error) throw error

      setMessage("Kullanıcı başarıyla güncellendi!")
      setIsDialogOpen(false)
      setEditingProfile(null)
      fetchProfiles()

      setTimeout(() => setMessage(""), 3000)
    } catch (error: any) {
      console.error("Error updating profile:", error)
      setMessage(`Güncelleme hatası: ${error.message}`)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: createFormData.email,
          password: createFormData.password,
          role: createFormData.role,
          fullName: createFormData.full_name,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Bilinmeyen bir hata oluştu")
      }

      setMessage(`✅ ${createFormData.role === "admin" ? "Admin" : "Operatör"} kullanıcısı başarıyla oluşturuldu!`)

      if (result.warning) {
        setMessage((prev) => `${prev}\n⚠️ ${result.warning}`)
      }

      setIsCreateDialogOpen(false)
      setCreateFormData({ email: "", password: "", role: "operator", full_name: "" })
      fetchProfiles()
    } catch (error: any) {
      console.error("User creation error:", error)
      let errorMessage = `❌ Hata: ${error.message}`

      if (error.message.includes("row-level security") || error.message.includes("policy")) {
        errorMessage += `\n\n🔧 Çözüm: SQL Editor'de şu komutu çalıştırın:\nALTER TABLE profiles DISABLE ROW LEVEL SECURITY;`
      }

      if (error.message.includes("email") || error.message.includes("confirmation")) {
        errorMessage += `\n\n🔧 Çözüm: EasyPanel'de Authentication > Settings > 'Enable email confirmations' seçeneğini kapatın.`
      }

      setMessage(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (profile: Profile) => {
    setEditingProfile(profile)
    setFormData({
      role: profile.role,
      full_name: profile.full_name || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu kullanıcıyı silmek istediğinizden emin misiniz?")) return

    try {
      const { error } = await supabase.from("profiles").delete().eq("id", id)

      if (error) throw error

      setMessage("Kullanıcı başarıyla silindi!")
      fetchProfiles()

      setTimeout(() => setMessage(""), 3000)
    } catch (error: any) {
      console.error("Error deleting profile:", error)
      setMessage(`Silme hatası: ${error.message}`)
    }
  }

  const createTestUsers = async () => {
    const testUsers = [
      { email: "operator1@test.com", password: "123456", role: "operator", full_name: "Test Operatör 1" },
      { email: "operator2@test.com", password: "123456", role: "operator", full_name: "Test Operatör 2" },
      { email: "admin2@test.com", password: "123456", role: "admin", full_name: "Test Admin 2" },
    ]

    let successCount = 0
    for (const user of testUsers) {
      try {
        const response = await fetch("/api/create-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        })

        if (response.ok) {
          successCount++
        }
      } catch (error) {
        console.error(`Error creating ${user.email}:`, error)
      }
    }

    setMessage(`${successCount} test kullanıcısı oluşturuldu!`)
    fetchProfiles()
    setTimeout(() => setMessage(""), 3000)
  }

  if (userRole !== "admin") {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Bu sayfaya erişim yetkiniz yok. Sadece admin kullanıcıları kullanıcı yönetebilir.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kullanıcı Yönetimi</h1>
          <p className="text-gray-600">Sistem kullanıcılarını yönetin</p>
          <p className="text-sm text-gray-500">{debugInfo}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={fetchProfiles} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Yenile
          </Button>
          <Button onClick={createTestUsers} variant="outline" size="sm">
            Test Kullanıcıları
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Yeni Kullanıcı
          </Button>
        </div>
      </div>

      {message && (
        <Alert className="mb-4">
          <AlertDescription>
            <pre className="whitespace-pre-wrap text-sm">{message}</pre>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Kullanıcı Listesi ({profiles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {profiles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Henüz kullanıcı bulunamadı.</p>
              <Button onClick={createTestUsers} variant="outline">
                Test Kullanıcıları Oluştur
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Ad Soyad</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Kayıt Tarihi</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">{profile.email}</TableCell>
                      <TableCell>{profile.full_name || "Belirtilmemiş"}</TableCell>
                      <TableCell>
                        <Badge variant={profile.role === "admin" ? "default" : "secondary"}>
                          {profile.role === "admin" ? "Admin" : "Operatör"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(profile.created_at).toLocaleDateString("tr-TR")}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(profile)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(profile.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kullanıcı Düzenle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateRole} className="space-y-4">
            <div>
              <Label htmlFor="full_name">Ad Soyad</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Kullanıcının adı soyadı"
              />
            </div>
            <div>
              <Label htmlFor="role">Rol</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "admin" | "operator") => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="operator">Operatör</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                İptal
              </Button>
              <Button type="submit">Güncelle</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Kullanıcı Oluştur</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <Label htmlFor="create_email">E-posta *</Label>
              <Input
                id="create_email"
                type="email"
                value={createFormData.email}
                onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                required
                placeholder="kullanici@example.com"
              />
            </div>
            <div>
              <Label htmlFor="create_password">Şifre *</Label>
              <Input
                id="create_password"
                type="password"
                value={createFormData.password}
                onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                required
                minLength={6}
                placeholder="En az 6 karakter"
              />
            </div>
            <div>
              <Label htmlFor="create_full_name">Ad Soyad</Label>
              <Input
                id="create_full_name"
                value={createFormData.full_name}
                onChange={(e) => setCreateFormData({ ...createFormData, full_name: e.target.value })}
                placeholder="Kullanıcının adı soyadı"
              />
            </div>
            <div>
              <Label htmlFor="create_role">Rol *</Label>
              <Select
                value={createFormData.role}
                onValueChange={(value: "admin" | "operator") => setCreateFormData({ ...createFormData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="operator">Operatör</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                İptal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Oluşturuluyor..." : "Oluştur"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* RLS Help Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Sorun Giderme
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-2">Kullanıcı oluşturma hatası alıyorsanız:</h3>
            <ol className="text-sm text-yellow-800 space-y-1">
              <li>1. EasyPanel'de Supabase projenizi açın</li>
              <li>2. SQL Editor'e gidin</li>
              <li>
                3. Bu komutu çalıştırın:{" "}
                <code className="bg-yellow-200 px-1 rounded">ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;</code>
              </li>
              <li>4. Authentication &gt; Settings'de "Enable email confirmations" seçeneğini kapatın</li>
            </ol>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Test Kullanıcıları:</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>
                <strong>Admin:</strong> admin2@test.com / 123456
              </p>
              <p>
                <strong>Operatör 1:</strong> operator1@test.com / 123456
              </p>
              <p>
                <strong>Operatör 2:</strong> operator2@test.com / 123456
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
