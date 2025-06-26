import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const { email, password, rehber_id, full_name } = await request.json()

    // Environment variables kontrolü
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceRoleKey = process.env.SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Environment variables tanımlanmamış" }, { status: 500 })
    }

    // Service role key kullan (admin işlemleri için)
    const authKey = serviceRoleKey || supabaseKey

    // Supabase client oluştur (service role key ile)
    const supabase = createClient(supabaseUrl, authKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // Önce bu email ile kullanıcı var mı kontrol et
    const { data: existingUser, error: userCheckError } = await supabase.auth.admin.listUsers()

    if (existingUser?.users?.some((user) => user.email === email)) {
      return NextResponse.json({ error: "Bu e-posta adresi ile zaten bir kullanıcı mevcut" }, { status: 400 })
    }

    // Admin API kullanarak kullanıcı oluştur
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Email doğrulamasını bypass et
      user_metadata: {
        full_name,
        rehber_id, // Rehber ID'sini user metadata'ya ekle
        role: "rehber",
      },
    })

    if (userError) {
      console.error("Kullanıcı oluşturma hatası:", userError)

      // Yaygın hataları kontrol et
      if (userError.message?.includes("email")) {
        return NextResponse.json({ error: "Geçersiz e-posta adresi" }, { status: 400 })
      }
      if (userError.message?.includes("password")) {
        return NextResponse.json({ error: "Şifre en az 6 karakter olmalı" }, { status: 400 })
      }

      return NextResponse.json({ error: userError.message }, { status: 400 })
    }

    if (!userData.user) {
      return NextResponse.json({ error: "Kullanıcı oluşturulamadı" }, { status: 400 })
    }

    // Profiles tablosuna sadece id ve role ekle
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userData.user.id,
      role: "rehber",
      full_name: full_name || null,
    })

    if (profileError) {
      console.error("Profile oluşturma hatası:", profileError)

      // RLS hatası kontrolü
      if (profileError.message?.includes("row-level security") || profileError.message?.includes("policy")) {
        return NextResponse.json({
          success: true,
          user: userData.user,
          message: "Kullanıcı oluşturuldu, ancak profil oluşturulamadı. RLS'i kontrol edin.",
          warning: "RLS hatası: Profiles tablosunda RLS politikalarını kontrol edin.",
        })
      }

      // Profil oluşturulamadı, kullanıcıyı sil
      await supabase.auth.admin.deleteUser(userData.user.id)
      return NextResponse.json(
        {
          error: `Profile oluşturulamadı: ${profileError.message}`,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      user: userData.user,
      message: "Rehber kullanıcısı başarıyla oluşturuldu!",
    })
  } catch (error: any) {
    console.error("API Error:", error)
    return NextResponse.json(
      {
        error: `Kullanıcı oluşturma hatası: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
