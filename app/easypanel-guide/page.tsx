"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertTriangle } from "lucide-react"

export default function EasyPanelGuidePage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>EasyPanel Supabase Ayarları</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Email confirmation hatası alıyorsanız, EasyPanel'de email confirmation'ı kapatmanız gerekiyor.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">1. Email Confirmation'ı Kapatma</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                <span className="text-sm">EasyPanel'de Supabase projenizi açın</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                <span className="text-sm">Authentication &gt; Settings bölümüne gidin</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                <span className="text-sm">"Enable email confirmations" seçeneğini KAPATIN</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                <span className="text-sm">Ayarları kaydedin</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">2. API Keys'leri Alma</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                <span className="text-sm">Settings &gt; API bölümüne gidin</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                <span className="text-sm">Project URL'i kopyalayın</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                <span className="text-sm">anon/public key'i kopyalayın</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">3. Environment Variables</h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm mb-2">Proje kök dizininde .env.local dosyası oluşturun:</p>
              <pre className="text-xs bg-gray-800 text-white p-3 rounded overflow-x-auto">
                {`NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`}
              </pre>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">4. RLS (Row Level Security) Ayarları</h3>
            <Alert>
              <AlertDescription>
                Eğer tablolara erişim sorunu yaşıyorsanız, geçici olarak RLS'i kapatabilirsiniz.
              </AlertDescription>
            </Alert>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm mb-2">SQL Editor'de çalıştırın:</p>
              <pre className="text-xs bg-gray-800 text-white p-3 rounded overflow-x-auto">
                {`-- Geçici olarak RLS'i kapat (sadece development için)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE firmalar DISABLE ROW LEVEL SECURITY;
ALTER TABLE magazalar DISABLE ROW LEVEL SECURITY;
ALTER TABLE urunler DISABLE ROW LEVEL SECURITY;
ALTER TABLE operatorler DISABLE ROW LEVEL SECURITY;
ALTER TABLE rehberler DISABLE ROW LEVEL SECURITY;
ALTER TABLE satislar DISABLE ROW LEVEL SECURITY;
ALTER TABLE satis_kalemleri DISABLE ROW LEVEL SECURITY;`}
              </pre>
            </div>
          </div>

          <div className="flex gap-2">
            <Button asChild>
              <a href="/simple-setup">Kuruluma Devam Et</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/env-check">Environment Kontrolü</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
