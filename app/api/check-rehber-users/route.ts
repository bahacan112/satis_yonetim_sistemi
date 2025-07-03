import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const { rehber_ids } = await request.json()

    // Environment variables kontrolü
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceRoleKey = process.env.SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Environment variables tanımlanmamış" }, { status: 500 })
    }

    // Service role key kullan (admin işlemleri için)
    const authKey = serviceRoleKey || supabaseKey

    // Supabase client oluştur
    const supabase = createClient(supabaseUrl, authKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const userStatus: Record<string, boolean> = {}

    // Service role key varsa auth users'ı kontrol et
    if (serviceRoleKey) {
      try {
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

        if (!authError && authUsers?.users) {
          // Her rehber ID için kullanıcı var mı kontrol et
          rehber_ids.forEach((rehber_id: string) => {
            const hasUser = authUsers.users.some(
              (user) => user.user_metadata?.rehber_id === rehber_id && user.user_metadata?.role === "rehber",
            )
            userStatus[rehber_id] = hasUser
          })
        } else {
          console.error("Auth users alınamadı:", authError)
          // Hata durumunda tüm rehberler için false döndür
          rehber_ids.forEach((rehber_id: string) => {
            userStatus[rehber_id] = false
          })
        }
      } catch (error) {
        console.error("Auth API hatası:", error)
        // Hata durumunda tüm rehberler için false döndür
        rehber_ids.forEach((rehber_id: string) => {
          userStatus[rehber_id] = false
        })
      }
    } else {
      // Service role key yoksa profiles tablosundan kontrol et
      try {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, role, full_name")
          .eq("role", "rehber")

        if (!profilesError && profilesData) {
          // Şimdilik profiles tablosunda rehber_id olmadığı için
          // sadece rehber rolündeki kullanıcı sayısını kontrol ediyoruz
          const rehberUserCount = profilesData.length

          // Eğer rehber kullanıcısı varsa ilk rehber için true döndür (geçici çözüm)
          if (rehberUserCount > 0 && rehber_ids.length > 0) {
            userStatus[rehber_ids[0]] = true
            // Diğerleri için false
            rehber_ids.slice(1).forEach((rehber_id: string) => {
              userStatus[rehber_id] = false
            })
          } else {
            rehber_ids.forEach((rehber_id: string) => {
              userStatus[rehber_id] = false
            })
          }
        } else {
          console.error("Profiles sorgu hatası:", profilesError)
          rehber_ids.forEach((rehber_id: string) => {
            userStatus[rehber_id] = false
          })
        }
      } catch (error) {
        console.error("Profiles API hatası:", error)
        rehber_ids.forEach((rehber_id: string) => {
          userStatus[rehber_id] = false
        })
      }
    }

    return NextResponse.json({
      success: true,
      userStatus,
    })
  } catch (error: any) {
    console.error("API Error:", error)
    return NextResponse.json(
      {
        error: `Kullanıcı durumu kontrol hatası: ${error.message}`,
        userStatus: {},
      },
      { status: 500 },
    )
  }
}
