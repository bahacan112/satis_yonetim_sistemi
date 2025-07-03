import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const { email, password, role, fullName } = await request.json()

    // Environment variables kontrolü
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceRoleKey = process.env.SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Environment variables tanımlanmamış" }, { status: 500 })
    }

    // Use service role key if available for admin operations
    const authKey = serviceRoleKey || supabaseKey

    // Supabase client oluştur (service role key ile)
    const supabase = createClient(supabaseUrl, authKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // Try direct admin API approach first
    try {
      // Admin API kullanarak kullanıcı oluştur
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Email doğrulamasını bypass et
        user_metadata: { full_name: fullName },
      })

      if (userError) {
        console.error("Admin API error:", userError)
        throw userError
      }

      if (userData.user) {
        // Profile oluştur
        const { error: profileError } = await supabase.from("profiles").insert({
          id: userData.user.id,
          role: role || "operator",
          full_name: fullName || null,
        })

        if (profileError) {
          console.error("Profile creation error:", profileError)

          // RLS hatası kontrolü - yine de başarılı kabul et
          if (profileError.message?.includes("row-level security") || profileError.message?.includes("policy")) {
            return NextResponse.json({
              success: true,
              user: userData.user,
              message: `${role === "admin" ? "Admin" : "Operatör"} kullanıcısı oluşturuldu, ancak profil oluşturulamadı. RLS'i kontrol edin.`,
              warning:
                "RLS hatası: SQL Editor'de ALTER TABLE profiles DISABLE ROW LEVEL SECURITY; komutunu çalıştırın.",
            })
          }

          return NextResponse.json(
            {
              error: `Profile oluşturulamadı: ${profileError.message}`,
              user: userData.user,
            },
            { status: 500 },
          )
        }

        return NextResponse.json({
          success: true,
          user: userData.user,
          message: `${role === "admin" ? "Admin" : "Operatör"} kullanıcısı başarıyla oluşturuldu!`,
        })
      }
    } catch (adminError) {
      console.error("Admin API approach failed:", adminError)
      // Continue to fallback approach
    }

    // Fallback to regular signup
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${request.nextUrl.origin}/auth/callback`,
        data: {
          full_name: fullName,
        },
      },
    })

    if (authError) {
      console.error("Auth error:", authError)

      // Email confirmation hatası kontrolü
      if (authError.message?.includes("confirmation") || authError.message?.includes("email")) {
        return NextResponse.json(
          {
            error:
              "Email confirmation hatası. EasyPanel'de Authentication > Settings > 'Enable email confirmations' seçeneğini kapatın.",
            instructions: "EasyPanel Supabase > Authentication > Settings > Email Confirmation = OFF",
          },
          { status: 400 },
        )
      }

      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Kullanıcı oluşturulamadı" }, { status: 400 })
    }

    // Profile oluştur - RLS devre dışıysa bu çalışmalı
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      role: role || "operator",
      full_name: fullName || null,
    })

    if (profileError) {
      console.error("Profile creation error:", profileError)

      // RLS hatası kontrolü
      if (profileError.message?.includes("row-level security") || profileError.message?.includes("policy")) {
        return NextResponse.json({
          success: true,
          user: authData.user,
          message: `Kullanıcı oluşturuldu, ancak profil oluşturulamadı. RLS'i kontrol edin.`,
          warning: "RLS hatası: SQL Editor'de ALTER TABLE profiles DISABLE ROW LEVEL SECURITY; komutunu çalıştırın.",
        })
      }

      return NextResponse.json(
        {
          error: `Profile oluşturulamadı: ${profileError.message}`,
          user: authData.user,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      user: authData.user,
      message: `${role === "admin" ? "Admin" : "Operatör"} kullanıcısı başarıyla oluşturuldu!`,
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
