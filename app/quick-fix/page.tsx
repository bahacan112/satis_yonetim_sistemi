"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function QuickFixPage() {
  const { user, refreshUserRole } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [userId, setUserId] = useState(user?.id || "")

  const quickFix = async () => {
    setLoading(true)
    setMessage("")

    try {
      // 1. Direkt SQL ile profil oluştur/güncelle
      const { error: upsertError } = await supabase.from("profiles").upsert(
        {
          id: userId,
          role: "admin",
          full_name: "Admin User",
        },
        {
          onConflict: "id",
        },
      )

      if (upsertError) {
        setMessage(`❌ Upsert hatası: ${upsertError.message}`)
        return
      }

      // 2. Kontrol et
      const { data: checkData, error: checkError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (checkError) {
        setMessage(`❌ Kontrol hatası: ${checkError.message}`)
        return
      }

      setMessage(`✅ Başarılı! Profil oluşturuldu: ${checkData.role} - ${checkData.full_name}`)

      // 3. Auth context'i yenile
      if (user && userId === user.id) {
        await refreshUserRole()
      }
    } catch (error: any) {
      setMessage(`❌ Genel hata: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    setLoading(true)
    setMessage("")

    try {
      // Basit bağlantı testi
      const { data, error } = await supabase.from("profiles").select("count").limit(1)

      if (error) {
        setMessage(`❌ Bağlantı hatası: ${error.message}`)
      } else {
        setMessage(`✅ Bağlantı başarılı! Profiles tablosuna erişim var.`)
      }
    } catch (error: any) {
      setMessage(`❌ Test hatası: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Hızlı Düzeltme</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>Bu sayfa rol sorunlarını hızlıca çözmek için kullanılır.</AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="userId">Kullanıcı ID</Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Kullanıcı UUID'si"
            />
          </div>

          <div className="space-y-2">
            <Button onClick={testConnection} disabled={loading} className="w-full">
              {loading ? "Test Ediliyor..." : "Bağlantıyı Test Et"}
            </Button>
            <Button onClick={quickFix} disabled={loading || !userId} className="w-full">
              {loading ? "Düzeltiliyor..." : "Admin Profili Oluştur"}
            </Button>
          </div>

          {message && (
            <Alert>
              <AlertDescription>
                <pre className="whitespace-pre-wrap text-xs">{message}</pre>
              </AlertDescription>
            </Alert>
          )}

          <div className="p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-2">Eğer hala çalışmıyorsa:</h3>
            <ol className="text-sm text-yellow-800 space-y-1">
              <li>1. EasyPanel'de SQL Editor'i açın</li>
              <li>2. Bu komutu çalıştırın:</li>
              <code className="block bg-yellow-100 p-2 rounded text-xs mt-1">
                {`ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;`}
              </code>
              <li>3. Sonra bu komutu çalıştırın:</li>
              <code className="block bg-yellow-100 p-2 rounded text-xs mt-1">
                {`INSERT INTO profiles (id, role, full_name) VALUES ('${userId}', 'admin', 'Admin User') ON CONFLICT (id) DO UPDATE SET role = 'admin';`}
              </code>
            </ol>
          </div>

          <div className="text-center space-y-2">
            <Button asChild variant="link" size="sm">
              <a href="/rls-check">RLS Kontrol</a>
            </Button>
            <Button asChild variant="link" size="sm">
              <a href="/dashboard">Dashboard</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
