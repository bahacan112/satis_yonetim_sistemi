"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Database, CheckCircle, Server } from "lucide-react"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [hasAdminUser, setHasAdminUser] = useState<boolean | null>(null)
  const [tablesExist, setTablesExist] = useState<boolean | null>(null)
  const [checkingTables, setCheckingTables] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkTables()
  }, [])

  useEffect(() => {
    if (!loading && tablesExist !== null) {
      if (tablesExist) {
        checkForAdminUser()
      }
    }
  }, [loading, tablesExist])

  useEffect(() => {
    if (!loading && hasAdminUser !== null && tablesExist !== null) {
      if (user) {
        router.push("/dashboard")
      } else if (hasAdminUser && tablesExist) {
        router.push("/login")
      }
    }
  }, [user, loading, hasAdminUser, tablesExist, router])

  const checkTables = async () => {
    try {
      setCheckingTables(true)
      const { error } = await supabase.from("profiles").select("count").limit(1)

      if (error) {
        if (error.message.includes("does not exist")) {
          setTablesExist(false)
        } else {
          throw error
        }
      } else {
        setTablesExist(true)
      }
    } catch (error: any) {
      console.error("Error checking tables:", error)
      setError(error.message)
      setTablesExist(false)
    } finally {
      setCheckingTables(false)
    }
  }

  const checkForAdminUser = async () => {
    try {
      const { data, error } = await supabase.from("profiles").select("id").eq("role", "admin").limit(1)

      if (error) throw error
      setHasAdminUser(data && data.length > 0)
    } catch (error: any) {
      console.error("Error checking for admin user:", error)
      setError(error.message)
      setHasAdminUser(false)
    }
  }

  if (loading || checkingTables) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Server className="w-12 h-12 mx-auto mb-4 text-blue-500" />
          <h1 className="text-2xl font-bold mb-4">Self-Hosted Satış Yönetim Sistemi</h1>
          <p>Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!tablesExist) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Database className="w-12 h-12 mx-auto mb-2 text-blue-500" />
            <CardTitle>Self-Hosted Supabase Kurulumu</CardTitle>
            <CardDescription>Veritabanı tabloları henüz oluşturulmamış</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Hata: {error || "Veritabanı tabloları bulunamadı. SQL scriptlerini çalıştırmanız gerekiyor."}
              </AlertDescription>
            </Alert>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Self-Hosted Supabase Çözümü:</h3>
              <ol className="text-sm space-y-1">
                <li>1. http://localhost:3000 adresinde Supabase Studio'yu açın</li>
                <li>2. SQL Editor'e gidin</li>
                <li>3. Aşağıdaki SQL scriptlerini sırayla çalıştırın:</li>
              </ol>
              <div className="mt-2 space-y-2">
                <Button asChild variant="outline" size="sm" className="w-full">
                  <a href="/sql-scripts/01-create-tables" target="_blank" rel="noreferrer">
                    1. Tabloları Oluştur
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <a href="/sql-scripts/02-create-policies" target="_blank" rel="noreferrer">
                    2. Politikaları Oluştur
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <a href="/sql-scripts/03-seed-data" target="_blank" rel="noreferrer">
                    3. Örnek Verileri Ekle
                  </a>
                </Button>
                <Button asChild variant="destructive" size="sm" className="w-full">
                  <a href="/sql-scripts/04-disable-rls" target="_blank" rel="noreferrer">
                    4. RLS Devre Dışı Bırak (Development)
                  </a>
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={checkTables} className="flex-1">
                Tabloları Kontrol Et
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <a href="/test-connection">Bağlantı Testi</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!hasAdminUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
            <CardTitle>Self-Hosted Supabase Hazır!</CardTitle>
            <CardDescription>Şimdi bir admin kullanıcısı oluşturalım</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Self-Hosted Supabase:</strong> Email confirmation varsayılan olarak kapalıdır.
              </AlertDescription>
            </Alert>
            <p className="text-gray-600">
              Self-hosted Supabase veritabanı tabloları başarıyla oluşturuldu. Sistemi kullanmaya başlamak için bir
              admin kullanıcısı oluşturun.
            </p>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <a href="/simple-setup">Hızlı Admin Oluştur</a>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <a href="/setup">Detaylı Kurulum</a>
              </Button>
              <Button asChild variant="outline" size="sm" className="w-full">
                <a href="/self-hosted-guide">Self-Hosted Rehberi</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
