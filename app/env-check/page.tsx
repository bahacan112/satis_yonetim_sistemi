"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react"

export default function EnvCheckPage() {
  const envVars = [
    {
      name: "NEXT_PUBLIC_SUPABASE_URL",
      value: process.env.NEXT_PUBLIC_SUPABASE_URL,
      required: true,
      description: "Supabase project URL",
    },
    {
      name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      required: true,
      description: "Supabase anonymous key",
    },
    {
      name: "SERVICE_ROLE_KEY",
      value: process.env.SERVICE_ROLE_KEY,
      required: false,
      description: "Supabase service role key (admin işlemler için)",
    },
  ]

  const getStatus = (value: string | undefined, required: boolean) => {
    if (!value) {
      return required ? "error" : "warning"
    }
    return "success"
  }

  const getIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      default:
        return null
    }
  }

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "success":
        return "default"
      case "error":
        return "destructive"
      case "warning":
        return "secondary"
      default:
        return "secondary"
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Environment Variables Kontrolü</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {envVars.map((envVar) => {
            const status = getStatus(envVar.value, envVar.required)
            return (
              <div key={envVar.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{envVar.name}</code>
                    {envVar.required && <Badge variant="outline">Gerekli</Badge>}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{envVar.description}</p>
                  {envVar.value && (
                    <p className="text-xs text-gray-500 mt-1 font-mono">{envVar.value.substring(0, 20)}...</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {getIcon(status)}
                  <Badge variant={getBadgeVariant(status)}>
                    {status === "success" ? "OK" : status === "error" ? "EKSIK" : "OPSIYONEL"}
                  </Badge>
                </div>
              </div>
            )
          })}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">EasyPanel&#39;den Bilgileri Alma:</h3>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. EasyPanel&#39;de Supabase projenizi açın</li>
              <li>2. Settings &gt; API bölümüne gidin</li>
              <li>3. Project URL ve anon key&#39;i kopyalayın</li>
              <li>4. .env.local dosyasına yapıştırın</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
