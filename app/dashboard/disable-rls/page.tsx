"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, CheckCircle, AlertTriangle } from "lucide-react"

export default function DisableRLSPage() {
  const { userRole } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [copied, setCopied] = useState(false)

  const sqlScript = `-- RLS'i geçici olarak devre dışı bırak (Development için)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE firmalar DISABLE ROW LEVEL SECURITY;
ALTER TABLE magazalar DISABLE ROW LEVEL SECURITY;
ALTER TABLE urunler DISABLE ROW LEVEL SECURITY;
ALTER TABLE operatorler DISABLE ROW LEVEL SECURITY;
ALTER TABLE rehberler DISABLE ROW LEVEL SECURITY;
ALTER TABLE satislar DISABLE ROW LEVEL SECURITY;
ALTER TABLE satis_kalemleri DISABLE ROW LEVEL SECURITY;`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlScript)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const disableRLS = async () => {
    if (userRole !== "admin") {
      setMessage("Bu işlem için admin yetkisi gerekiyor!")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      // Try to disable RLS on profiles table directly
      const { error } = await supabase.rpc("disable_rls_for_profiles")

      if (error) {
        if (error.message.includes("function") || error.message.includes("not exist")) {
          // Function doesn't exist, create it first
          const { error: createFnError } = await supabase.sql(`
            CREATE OR REPLACE FUNCTION disable_rls_for_profiles()
            RETURNS void AS $$
            BEGIN
              ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
          `)

          if (createFnError) {
            throw new Error(`RPC fonksiyonu oluşturulamadı: ${createFnError.message}`)
          }

          // Try again
          const { error: retryError } = await supabase.rpc("disable_rls_for_profiles")
          if (retryError) {
            throw new Error(`RLS devre dışı bırakılamadı: ${retryError.message}`)
          }
        } else {
          throw new Error(`RLS devre dışı bırakılamadı: ${error.message}`)
        }
      }

      setMessage("✅ RLS başarıyla devre dışı bırakıldı! Sayfayı yenileyin ve tekrar deneyin.")
    } catch (error: any) {
      console.error("Error disabling RLS:", error)
      setMessage(
        `❌ Hata: ${error.message}\n\nLütfen SQL komutlarını EasyPanel SQL Editor'de manuel olarak çalıştırın.`,
      )
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
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>RLS Devre Dışı Bırak</span>
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Kopyalandı" : "Kopyala"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>ÖNEMLİ:</strong> Bu işlem RLS güvenlik politikalarını devre dışı bırakır. Sadece development
              ortamında kullanın!
            </AlertDescription>
          </Alert>

          <div className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-auto max-h-[200px]">
            <pre className="text-xs">{sqlScript}</pre>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-2">RLS Hatası Çözümü:</h3>
            <ol className="text-sm text-yellow-800 space-y-1">
              <li>1. EasyPanel'de Supabase projenizi açın</li>
              <li>2. SQL Editor'e gidin</li>
              <li>3. Yukarıdaki SQL komutlarını yapıştırın ve çalıştırın</li>
              <li>4. Sayfayı yenileyin ve tekrar deneyin</li>
            </ol>
          </div>

          <div className="flex gap-2">
            <Button onClick={disableRLS} disabled={loading} variant="destructive">
              {loading ? "İşlem Yapılıyor..." : "RLS'i Devre Dışı Bırak"}
            </Button>
            <Button asChild variant="outline">
              <a href="/dashboard/kullanicilar">Kullanıcı Yönetimine Dön</a>
            </Button>
          </div>

          {message && (
            <Alert>
              <AlertDescription>
                <pre className="whitespace-pre-wrap text-xs">{message}</pre>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
