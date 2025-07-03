"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertTriangle, Server } from "lucide-react"

export default function SelfHostedGuidePage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-6 h-6" />
            Self-Hosted Supabase Ayarları
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Self-hosted Supabase kullanıyorsunuz. Bu rehber kendi serverinizde çalışan Supabase için hazırlanmıştır.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">1. Docker Compose ile Supabase Çalıştırma</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                <span className="text-sm">Docker ve Docker Compose yüklü olduğundan emin olun</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                <span className="text-sm">Supabase self-hosted repo'sunu klonlayın</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                <span className="text-sm">docker-compose.yml dosyasını yapılandırın</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                <span className="text-sm">docker-compose up -d komutu ile başlatın</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">2. Environment Variables</h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm mb-2">Proje kök dizininde .env.local dosyası oluşturun:</p>
              <pre className="text-xs bg-gray-800 text-white p-3 rounded overflow-x-auto">
                {`# Self-hosted Supabase (varsayılan portlar)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`}
              </pre>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">3. Supabase Studio Erişimi</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                <span className="text-sm">Tarayıcıda http://localhost:3000 adresine gidin</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                <span className="text-sm">SQL Editor'ı kullanarak tabloları oluşturun</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                <span className="text-sm">Authentication ayarlarını yapılandırın</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">4. Email Confirmation Ayarları</h3>
            <Alert>
              <AlertDescription>
                Self-hosted Supabase'de email confirmation varsayılan olarak kapalıdır. Eğer açıksa kapatabilirsiniz.
              </AlertDescription>
            </Alert>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm mb-2">Supabase Studio'da (http://localhost:3000):</p>
              <ol className="text-sm space-y-1">
                <li>1. Authentication &gt; Settings bölümüne gidin</li>
                <li>2. "Enable email confirmations" seçeneğini kontrol edin</li>
                <li>3. Gerekirse kapatın</li>
              </ol>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">5. RLS (Row Level Security) Ayarları</h3>
            <Alert>
              <AlertDescription>Development ortamında RLS'i geçici olarak kapatabilirsiniz.</AlertDescription>
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

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">6. Bağlantı Testi</h3>
            <div className="flex gap-2">
              <Button asChild>
                <a href="/test-connection">Bağlantıyı Test Et</a>
              </Button>
              <Button asChild variant="outline">
                <a href="/env-check">Environment Kontrolü</a>
              </Button>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Self-Hosted Supabase Avantajları:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Tam kontrol ve özelleştirme</li>
              <li>• Veri gizliliği ve güvenlik</li>
              <li>• Maliyet kontrolü</li>
              <li>• Offline çalışabilme</li>
              <li>• Özel network yapılandırması</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
