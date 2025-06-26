"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function DebugRolePage() {
  const { user, userRole } = useAuth()
  const [result, setResult] = useState("")
  const [loading, setLoading] = useState(false)

  const runDiagnostics = async () => {
    if (!user) return

    setLoading(true)
    setResult("")

    try {
      // 1. Profiles tablosunu kontrol et
      const { data: profileData, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id)

      let diagnostics = `=== ROL TANILAMA ===\n\n`
      diagnostics += `Kullanıcı ID: ${user.id}\n`
      diagnostics += `Auth Context Rolü: ${userRole}\n\n`

      if (profileError) {
        diagnostics += `❌ Profile Hatası: ${profileError.message}\n`
      } else if (profileData && profileData.length > 0) {
        diagnostics += `✅ Profile Bulundu:\n`
        profileData.forEach((profile, index) => {
          diagnostics += `  ${index + 1}. ID: ${profile.id}\n`
          diagnostics += `     Rol: ${profile.role}\n`
          diagnostics += `     Ad: ${profile.full_name || "Belirtilmemiş"}\n`
          diagnostics += `     Oluşturma: ${profile.created_at}\n\n`
        })
      } else {
        diagnostics += `❌ Profile bulunamadı!\n\n`
      }

      // 2. Tüm profilleri listele
      const { data: allProfiles, error: allError } = await supabase.from("profiles").select("*")

      if (allError) {
        diagnostics += `❌ Tüm profiller hatası: ${allError.message}\n`
      } else {
        diagnostics += `📋 Tüm Profiller (${allProfiles?.length || 0} adet):\n`
        allProfiles?.forEach((profile, index) => {
          diagnostics += `  ${index + 1}. ${profile.full_name || "İsimsiz"} (${profile.role}) - ${profile.id.substring(0, 8)}...\n`
        })
      }

      setResult(diagnostics)
    } catch (error: any) {
      setResult(`Hata: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const fixRole = async () => {
    if (!user) return

    setLoading(true)

    try {
      // Önce mevcut profili sil
      await supabase.from("profiles").delete().eq("id", user.id)

      // Yeni admin profili oluştur
      const { error } = await supabase.from("profiles").insert({
        id: user.id,
        role: "admin",
        full_name: "Admin User",
      })

      if (error) throw error

      setResult("✅ Rol admin olarak düzeltildi! Sayfayı yenileyin.")
    } catch (error: any) {
      setResult(`❌ Düzeltme hatası: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Rol Debug Sayfası</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>Bu sayfa rol sorunlarını teşhis etmek ve düzeltmek için kullanılır.</AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button onClick={runDiagnostics} disabled={loading}>
              {loading ? "Kontrol Ediliyor..." : "Rol Tanılaması Yap"}
            </Button>
            <Button onClick={fixRole} disabled={loading} variant="destructive">
              Rolü Admin Yap
            </Button>
          </div>

          {result && (
            <div className="bg-gray-900 text-gray-100 p-4 rounded-md">
              <pre className="text-xs whitespace-pre-wrap">{result}</pre>
            </div>
          )}

          <div className="text-center">
            <Button asChild variant="link">
              <a href="/dashboard">Dashboard'a Dön</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
