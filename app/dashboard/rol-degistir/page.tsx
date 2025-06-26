"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function RolDegistirPage() {
  const { userRole } = useAuth()
  const [userId, setUserId] = useState("")
  const [newRole, setNewRole] = useState<"admin" | "operator">("operator")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleRoleChange = async () => {
    if (!userId.trim()) {
      setMessage("Kullanıcı ID'si gerekli!")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId.trim())

      if (error) throw error

      setMessage(`✅ Kullanıcı rolü ${newRole === "admin" ? "Admin" : "Operatör"} olarak güncellendi!`)
      setUserId("")
    } catch (error: any) {
      console.error("Error updating role:", error)
      setMessage(`❌ Hata: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (userRole !== "admin") {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>Bu sayfaya erişim yetkiniz yok.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <Card>
        <CardHeader>
          <CardTitle>Hızlı Rol Değiştir</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>Mevcut bir kullanıcının rolünü hızlıca değiştirmek için kullanın.</AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="userId">Kullanıcı ID</Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Kullanıcının UUID'sini girin"
            />
            <p className="text-xs text-gray-500 mt-1">Kullanıcı ID'sini Kullanıcı Yönetimi sayfasından alabilirsiniz</p>
          </div>

          <div>
            <Label htmlFor="role">Yeni Rol</Label>
            <Select value={newRole} onValueChange={(value: "admin" | "operator") => setNewRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="operator">Operatör</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleRoleChange} disabled={loading} className="w-full">
            {loading ? "Güncelleniyor..." : "Rolü Değiştir"}
          </Button>

          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="text-center">
            <Button asChild variant="link" size="sm">
              <a href="/dashboard/kullanicilar">Kullanıcı Yönetimi</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
