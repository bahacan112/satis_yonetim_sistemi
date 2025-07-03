"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

const testUsers = [
  {
    email: "admin@test.com",
    password: "123456",
    role: "admin" as const,
    fullName: "Test Admin",
  },
  {
    email: "operator@test.com",
    password: "123456",
    role: "operator" as const,
    fullName: "Test Operatör",
  },
]

export default function DevUsersPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [messages, setMessages] = useState<{ [key: string]: string }>({})

  const createUser = async (user: (typeof testUsers)[0]) => {
    setLoading(user.email)
    setMessages({ ...messages, [user.email]: "" })

    try {
      // 1. Kullanıcıyı oluştur
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
      })

      if (authError) throw authError

      if (authData.user) {
        // 2. Profile oluştur
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          role: user.role,
          full_name: user.fullName,
        })

        if (profileError) throw profileError

        setMessages({
          ...messages,
          [user.email]: `✅ ${user.role} kullanıcısı başarıyla oluşturuldu!`,
        })
      }
    } catch (error: any) {
      setMessages({
        ...messages,
        [user.email]: `❌ Hata: ${error.message}`,
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Kullanıcıları Oluştur</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              <strong>Uyarı:</strong> Bu sayfa sadece development amaçlıdır. Production'da kullanmayın!
            </AlertDescription>
          </Alert>

          {testUsers.map((user) => (
            <div key={user.email} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{user.fullName}</span>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                </div>
                <p className="text-sm text-gray-600">{user.email}</p>
                <p className="text-xs text-gray-500">Şifre: {user.password}</p>
                {messages[user.email] && <p className="text-xs">{messages[user.email]}</p>}
              </div>
              <Button onClick={() => createUser(user)} disabled={loading === user.email} size="sm">
                {loading === user.email ? "Oluşturuluyor..." : "Oluştur"}
              </Button>
            </div>
          ))}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Test Kullanıcıları:</h3>
            <div className="space-y-1 text-sm text-blue-800">
              <p>
                <strong>Admin:</strong> admin@test.com / 123456
              </p>
              <p>
                <strong>Operatör:</strong> operator@test.com / 123456
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
