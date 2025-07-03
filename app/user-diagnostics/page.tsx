"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

export default function UserDiagnosticsPage() {
  const { user, userRole } = useAuth()
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [manualUserId, setManualUserId] = useState("")

  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setProfiles(data || [])
    } catch (error: any) {
      console.error("Error loading profiles:", error)
    }
  }

  const createProfileForCurrentUser = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Önce kontrol et
      const { data: existing } = await supabase.from("profiles").select("id").eq("id", user.id).single()

      if (existing) {
        setMessage("✅ Bu kullanıcının profili zaten mevcut!")
        return
      }

      // Profil oluştur
      const { error } = await supabase.from("profiles").insert({
        id: user.id,
        role: "operator",
        full_name: user.email?.split("@")[0] || "Kullanıcı",
      })

      if (error) throw error

      setMessage("✅ Mevcut kullanıcı için profil oluşturuldu!")
      loadProfiles()
    } catch (error: any) {
      setMessage(`❌ Hata: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const createManualProfile = async () => {
    if (!manualUserId.trim()) {
      setMessage("❌ Kullanıcı ID'si gerekli!")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from("profiles").insert({
        id: manualUserId.trim(),
        role: "operator",
        full_name: "Manuel Operatör",
      })

      if (error) throw error

      setMessage("✅ Manuel profil oluşturuldu!")
      setManualUserId("")
      loadProfiles()
    } catch (error: any) {
      setMessage(`❌ Manuel profil hatası: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const makeAdmin = async (profileId: string) => {
    try {
      const { error } = await supabase.from("profiles").update({ role: "admin" }).eq("id", profileId)

      if (error) throw error

      setMessage("✅ Kullanıcı admin yapıldı!")
      loadProfiles()
    } catch (error: any) {
      setMessage(`❌ Admin yapma hatası: ${error.message}`)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Kullanıcı Tanılaması ve Düzeltme</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mevcut Kullanıcı Bilgileri */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">Mevcut Kullanıcı:</h3>
            <p className="text-sm">
              ID: <code className="bg-blue-100 px-1 rounded">{user?.id}</code>
            </p>
            <p className="text-sm">Email: {user?.email}</p>
            <p className="text-sm">Rol: {userRole || "Profil yok"}</p>

            <Button onClick={createProfileForCurrentUser} disabled={loading} size="sm" className="mt-2">
              Bu Kullanıcı İçin Profil Oluştur
            </Button>
          </div>

          {/* Manuel Profil Oluşturma */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Manuel Profil Oluştur:</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Kullanıcı UUID'si"
                value={manualUserId}
                onChange={(e) => setManualUserId(e.target.value)}
                className="font-mono text-xs"
              />
              <Button onClick={createManualProfile} disabled={loading} size="sm">
                Oluştur
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Eğer auth.users'da kullanıcı varsa ama profile yoksa, UUID'sini buraya girin
            </p>
          </div>

          {/* Mesaj */}
          {message && (
            <Alert>
              <AlertDescription>
                <pre className="whitespace-pre-wrap text-xs">{message}</pre>
              </AlertDescription>
            </Alert>
          )}

          {/* Mevcut Profiller */}
          <div>
            <h3 className="font-semibold mb-4">Mevcut Profiller ({profiles.length}):</h3>
            {profiles.length === 0 ? (
              <p className="text-gray-500">Hiç profil bulunamadı.</p>
            ) : (
              <div className="space-y-2">
                {profiles.map((profile) => (
                  <div key={profile.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{profile.full_name || "İsimsiz"}</span>
                        <Badge variant={profile.role === "admin" ? "default" : "secondary"}>{profile.role}</Badge>
                      </div>
                      <p className="text-xs text-gray-500 font-mono">{profile.id}</p>
                    </div>
                    {userRole === "admin" && profile.role !== "admin" && (
                      <Button onClick={() => makeAdmin(profile.id)} size="sm" variant="outline">
                        Admin Yap
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-center space-x-2">
            <Button asChild variant="link" size="sm">
              <a href="/dashboard/kullanicilar">Kullanıcı Yönetimi</a>
            </Button>
            <Button asChild variant="link" size="sm">
              <a href="/fix-profiles">Profil Düzeltme</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
