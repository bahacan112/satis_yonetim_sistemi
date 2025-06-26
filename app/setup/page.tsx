"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react"

export default function SetupPage() {
  const [formData, setFormData] = useState({
    email: "admin@test.com",
    password: "123456",
    fullName: "Super Admin",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [success, setSuccess] = useState(false)
  const [envCheck, setEnvCheck] = useState({
    url: false,
    key: false,
  })
  const [showRLSError, setShowRLSError] = useState(false)

  useEffect(() => {
    // Environment variables kontrolü
    setEnvCheck({
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Environment variables kontrolü
    if (!envCheck.url || !envCheck.key) {
      setMessage("Environment variables tanımlanmamış! Lütfen .env.local dosyasını kontrol edin.")
      return
    }

    setLoading(true)
    setMessage("")
    setShowRLSError(false)

    try {
      // Önce tabloların var olup olmadığını kontrol et
      const { error: tableError } = await supabase.from("profiles").select("count").limit(1)

      if (tableError) {
        if (tableError.message.includes("does not exist")) {
          throw new Error("Veritabanı tabloları henüz oluşturulmamış. Önce SQL scriptlerini çalıştırın.")
        }
        throw tableError
      }

      // 1. Kullanıcıyı oluştur
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) {
        // Email confirmation hatası varsa özel mesaj göster
        if (authError.message.includes("confirmation") || authError.message.includes("email")) {
          throw new Error(
            "Email confirmation hatası. EasyPanel'de Authentication > Settings > 'Enable email confirmations' seçeneğini kapatın.",
          )
        }
        throw authError
      }

      if (authData.user) {
        // Önce mevcut profili kontrol et
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", authData.user.id)
          .limit(1)

        if (!existingProfile || existingProfile.length === 0) {
          // 2. Profile oluştur (admin rolü ile)
          const { error: profileError } = await supabase.from("profiles").insert({
            id: authData.user.id,
            role: "admin",
            full_name: formData.fullName,
          })

          if (profileError) {
            // RLS hatası kontrolü
            if (profileError.message.includes("row-level security policy")) {
              setShowRLSError(true)
              throw new Error(
                "RLS (Row Level Security) hatası! Önce RLS'i devre dışı bırakmanız gerekiyor. Aşağıdaki çözüm adımlarını takip edin.",
              )
            }
            throw profileError
          }
        }

        setSuccess(true)
        setMessage("Super admin kullanıcısı başarıyla oluşturuldu! Artık giriş yapabilirsiniz.")
      }
    } catch (error: any) {
      console.error("Setup error:", error)
      setMessage(error.message || "Kullanıcı oluşturulurken bir hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  // Environment variables eksikse uyarı göster
  if (!envCheck.url || !envCheck.key) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-700">Konfigürasyon Hatası</CardTitle>
            <CardDescription>Environment variables tanımlanmamış</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Supabase bağlantı bilgileri eksik. Lütfen .env.local dosyasını oluşturun.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {envCheck.url ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm">NEXT_PUBLIC_SUPABASE_URL</span>
              </div>
              <div className="flex items-center gap-2">
                {envCheck.key ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
              </div>
            </div>

            <Button asChild variant="outline" className="w-full">
              <a href="/env-check">Environment Kontrolü</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-green-700">Kurulum Tamamlandı!</CardTitle>
            <CardDescription>Super admin kullanıcısı başarıyla oluşturuldu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>E-posta:</strong> {formData.email}
              </p>
              <p className="text-sm text-green-800">
                <strong>Rol:</strong> Super Admin
              </p>
            </div>
            <Button asChild className="w-full">
              <a href="/login">Giriş Sayfasına Git</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>İlk Kurulum</CardTitle>
          <CardDescription>Super admin kullanıcısı oluşturun</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Bu sayfa sadece ilk kurulum için kullanılır. Super admin oluşturduktan sonra bu sayfayı silebilirsiniz.
            </AlertDescription>
          </Alert>

          {/* RLS Hatası Uyarısı */}
          {showRLSError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">RLS (Row Level Security) Hatası!</p>
                  <p className="text-sm">Profil oluşturmak için önce RLS'i devre dışı bırakmanız gerekiyor.</p>
                  <Button asChild size="sm" className="mt-2">
                    <a href="/sql-scripts/04-disable-rls">RLS Devre Dışı Bırak</a>
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Ad Soyad</Label>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Super Admin"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Güçlü bir şifre girin"
                minLength={6}
                required
              />
              <p className="text-xs text-gray-500">En az 6 karakter olmalıdır</p>
            </div>

            {message && (
              <Alert variant={success ? "default" : "destructive"}>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Oluşturuluyor..." : "Super Admin Oluştur"}
            </Button>
          </form>

          <div className="mt-4 space-y-2">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Not:</strong> RLS hatası alırsanız, önce RLS'i devre dışı bırakın.
              </p>
            </div>
            <div className="text-center space-x-2">
              <Button asChild variant="link" size="sm">
                <a href="/simple-setup">Alternatif: Hızlı Kurulum</a>
              </Button>
              <Button asChild variant="link" size="sm">
                <a href="/sql-scripts/04-disable-rls">RLS Devre Dışı Bırak</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
