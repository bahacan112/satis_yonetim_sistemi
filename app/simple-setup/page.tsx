"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SimpleSetupPage() {
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "admin@test.com",
    password: "123456",
    fullName: "Test Admin",
  })

  const createTestAdmin = async () => {
    setLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/create-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok) {
        setMessage(`✅ ${result.message}\n\nGiriş Bilgileri:\nEmail: ${formData.email}\nŞifre: ${formData.password}`)
      } else {
        setMessage(`❌ Hata: ${result.error}`)
        if (result.instructions) {
          setMessage((prev) => prev + `\n\n📋 Çözüm: ${result.instructions}`)
        }
      }
    } catch (error: any) {
      setMessage(`❌ Bağlantı hatası: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Hızlı Admin Oluştur</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Email confirmation hatası alıyorsanız, önce EasyPanel ayarlarını kontrol edin.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="fullName">Ad Soyad</Label>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
          </div>

          <Button onClick={createTestAdmin} disabled={loading} className="w-full">
            {loading ? "Oluşturuluyor..." : "Admin Oluştur"}
          </Button>

          {message && (
            <Alert>
              <AlertDescription>
                <pre className="whitespace-pre-wrap text-xs">{message}</pre>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button asChild variant="outline" size="sm">
              <a href="/login">Giriş Yap</a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="/easypanel-guide">EasyPanel Rehberi</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
