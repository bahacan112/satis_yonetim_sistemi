"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

export default function RLSCheckPage() {
  const { user } = useAuth()
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const checkRLS = async () => {
    setLoading(true)
    setResults([])

    const tables = [
      "profiles",
      "firmalar",
      "magazalar",
      "urunler",
      "operatorler",
      "rehberler",
      "satislar",
      "satis_kalemleri",
    ]
    const newResults = []

    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select("*").limit(1)

        newResults.push({
          table,
          status: error ? "error" : "success",
          message: error ? error.message : `✅ ${data?.length || 0} kayıt okunabilir`,
          error: error,
        })
      } catch (err: any) {
        newResults.push({
          table,
          status: "error",
          message: `❌ ${err.message}`,
          error: err,
        })
      }
    }

    setResults(newResults)
    setLoading(false)
  }

  const disableRLS = async () => {
    setLoading(true)

    try {
      // RLS'i devre dışı bırakma SQL'i
      const sqlCommands = [
        "ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;",
        "ALTER TABLE firmalar DISABLE ROW LEVEL SECURITY;",
        "ALTER TABLE magazalar DISABLE ROW LEVEL SECURITY;",
        "ALTER TABLE urunler DISABLE ROW LEVEL SECURITY;",
        "ALTER TABLE operatorler DISABLE ROW LEVEL SECURITY;",
        "ALTER TABLE rehberler DISABLE ROW LEVEL SECURITY;",
        "ALTER TABLE satislar DISABLE ROW LEVEL SECURITY;",
        "ALTER TABLE satis_kalemleri DISABLE ROW LEVEL SECURITY;",
      ]

      alert(`Aşağıdaki SQL komutlarını EasyPanel Supabase SQL Editor'de çalıştırın:\n\n${sqlCommands.join("\n")}`)
    } catch (error: any) {
      alert(`Hata: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const createProfile = async () => {
    if (!user) {
      alert("Kullanıcı bulunamadı!")
      return
    }

    setLoading(true)

    try {
      // Önce mevcut profili kontrol et
      const { data: existing } = await supabase.from("profiles").select("*").eq("id", user.id)

      if (existing && existing.length > 0) {
        // Güncelle
        const { error } = await supabase
          .from("profiles")
          .update({ role: "admin", full_name: "Admin User" })
          .eq("id", user.id)

        if (error) throw error
        alert("✅ Profil admin olarak güncellendi!")
      } else {
        // Yeni oluştur
        const { error } = await supabase.from("profiles").insert({
          id: user.id,
          role: "admin",
          full_name: "Admin User",
        })

        if (error) throw error
        alert("✅ Admin profili oluşturuldu!")
      }

      // Kontrol et
      await checkRLS()
    } catch (error: any) {
      alert(`❌ Hata: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>RLS ve Veritabanı Kontrol</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Bu sayfa Row Level Security (RLS) sorunlarını tespit etmek için kullanılır.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={checkRLS} disabled={loading}>
              {loading ? "Kontrol Ediliyor..." : "Tabloları Kontrol Et"}
            </Button>
            <Button onClick={createProfile} disabled={loading} variant="outline">
              Admin Profili Oluştur
            </Button>
            <Button onClick={disableRLS} disabled={loading} variant="destructive">
              RLS Devre Dışı Bırak (SQL)
            </Button>
          </div>

          {user && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Kullanıcı Bilgileri:</h3>
              <p className="text-sm">
                ID: <code className="bg-gray-200 px-1 rounded">{user.id}</code>
              </p>
              <p className="text-sm">Email: {user.email}</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Tablo Erişim Durumu:</h3>
              {results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <code className="text-sm">{result.table}</code>
                    <Badge variant={result.status === "success" ? "default" : "destructive"}>
                      {result.status === "success" ? "OK" : "HATA"}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">{result.message}</div>
                </div>
              ))}
            </div>
          )}

          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">RLS Devre Dışı Bırakma Adımları:</h3>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. EasyPanel'de Supabase projenizi açın</li>
              <li>2. SQL Editor'e gidin</li>
              <li>3. "RLS Devre Dışı Bırak" butonuna tıklayın</li>
              <li>4. Gösterilen SQL komutlarını çalıştırın</li>
              <li>5. Bu sayfaya dönüp "Tabloları Kontrol Et" yapın</li>
            </ol>
          </div>

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
