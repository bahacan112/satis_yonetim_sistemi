"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function FixProfilesPage() {
  const { userRole } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const fixMissingProfiles = async () => {
    setLoading(true)
    setMessage("")

    try {
      // Alternatif yöntem: Mevcut profilleri kontrol et ve eksik olanları manuel oluştur
      const { data: existingProfiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, role, full_name")

      if (profileError) throw profileError

      setMessage(
        `📋 Mevcut profiller:\n${
          existingProfiles
            ?.map((p) => `- ${p.full_name || "İsimsiz"} (${p.role}) - ${p.id.substring(0, 8)}...`)
            .join("\n") || "Hiç profil yok"
        }\n\n` +
          `Toplam: ${existingProfiles?.length || 0} profil\n\n` +
          `❗ Admin erişimi olmadığı için auth.users tablosunu okuyamıyoruz.\n` +
          `Eksik kullanıcılar varsa "Manuel Profil Oluştur" butonunu kullanın.`,
      )
    } catch (error: any) {
      setMessage(`❌ Hata: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const createManualProfile = async () => {
    setLoading(true)

    try {
      // Kullanıcının kendi ID'sini kullan veya rastgele UUID
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Kullanıcı bulunamadı")
      }

      // Önce bu kullanıcının profili var mı kontrol et
      const { data: existingProfile } = await supabase.from("profiles").select("id").eq("id", user.id).single()

      if (existingProfile) {
        setMessage("✅ Bu kullanıcının profili zaten mevcut!")
        return
      }

      // Profil oluştur
      const { error } = await supabase.from("profiles").insert({
        id: user.id,
        role: "operator",
        full_name: user.email?.split("@")[0] || "Operatör",
      })

      if (error) throw error

      setMessage("✅ Mevcut kullanıcı için profil oluşturuldu!")
    } catch (error: any) {
      setMessage(`❌ Manuel profil hatası: ${error.message}`)
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
    <div className="container mx-auto p-6 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Profil Düzeltme</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>Bu sayfa eksik profilleri tespit edip oluşturur.</AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Button onClick={fixMissingProfiles} disabled={loading} className="w-full">
              {loading ? "Kontrol Ediliyor..." : "Mevcut Profilleri Listele"}
            </Button>

            <Button onClick={createManualProfile} disabled={loading} variant="outline" className="w-full">
              Mevcut Kullanıcı İçin Profil Oluştur
            </Button>
          </div>

          {message && (
            <Alert>
              <AlertDescription>
                <pre className="whitespace-pre-wrap text-xs">{message}</pre>
              </AlertDescription>
            </Alert>
          )}

          <div className="text-center">
            <Button asChild variant="link" size="sm">
              <a href="/dashboard/kullanicilar">Kullanıcı Yönetimine Dön</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
