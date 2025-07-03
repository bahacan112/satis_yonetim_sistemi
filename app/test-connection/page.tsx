"use client"

import { useState } from "react"
import { testSupabaseConnection, healthCheck } from "@/lib/test-connection"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2, Server } from "lucide-react"

export default function TestConnectionPage() {
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [healthStatus, setHealthStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [details, setDetails] = useState<string>("")

  const runTests = async () => {
    // Supabase bağlantı testi
    setConnectionStatus("testing")
    const connectionResult = await testSupabaseConnection()
    setConnectionStatus(connectionResult ? "success" : "error")

    // Health check testi
    setHealthStatus("testing")
    const healthResult = await healthCheck()
    setHealthStatus(healthResult ? "success" : "error")

    setDetails(`
      Self-Hosted Supabase Bağlantı Testi
      ===================================
      Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}
      Connection Test: ${connectionResult ? "PASSED" : "FAILED"}
      Health Check: ${healthResult ? "PASSED" : "FAILED"}
      
      ${connectionResult ? "✅" : "❌"} Auth Session Test
      ${healthResult ? "✅" : "❌"} REST API Test
      
      ${
        !connectionResult || !healthResult
          ? "\n⚠️  Sorun Giderme:\n" +
            "1. Docker container'ların çalıştığını kontrol edin\n" +
            "2. http://localhost:8000 adresine erişilebildiğini kontrol edin\n" +
            "3. .env.local dosyasındaki URL'leri kontrol edin\n" +
            "4. Firewall ayarlarını kontrol edin"
          : ""
      }
    `)
  }

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case "testing":
        return <Loader2 className="w-4 h-4 animate-spin" />
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-6 h-6" />
            Self-Hosted Supabase Bağlantı Testi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Supabase Auth Bağlantısı:</span>
            <div className="flex items-center gap-2">
              <StatusIcon status={connectionStatus} />
              <Badge
                variant={
                  connectionStatus === "success"
                    ? "default"
                    : connectionStatus === "error"
                      ? "destructive"
                      : "secondary"
                }
              >
                {connectionStatus.toUpperCase()}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span>REST API Health Check:</span>
            <div className="flex items-center gap-2">
              <StatusIcon status={healthStatus} />
              <Badge
                variant={
                  healthStatus === "success" ? "default" : healthStatus === "error" ? "destructive" : "secondary"
                }
              >
                {healthStatus.toUpperCase()}
              </Badge>
            </div>
          </div>

          <Button onClick={runTests} className="w-full">
            Self-Hosted Supabase'i Test Et
          </Button>

          {details && (
            <div className="mt-4 p-4 bg-gray-100 rounded-md">
              <pre className="text-sm whitespace-pre-wrap">{details}</pre>
            </div>
          )}

          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Self-Hosted Supabase Kontrol Listesi:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Docker container'lar çalışıyor mu? (docker ps)</li>
              <li>• http://localhost:8000 erişilebilir mi?</li>
              <li>• http://localhost:3000 (Studio) açılıyor mu?</li>
              <li>• .env.local dosyası doğru yapılandırılmış mı?</li>
              <li>• Firewall 8000 ve 3000 portlarını engelliyor mu?</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button asChild variant="outline">
              <a href="/self-hosted-guide">Self-Hosted Rehberi</a>
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
