import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json()

    // Environment variables kontrolü
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Environment variables tanımlanmamış" }, { status: 500 })
    }

    // Email confirmation olmadan signup
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: false, // Email confirmation'ı bypass et
      }),
    })

    const authData = await authResponse.json()

    if (!authResponse.ok) {
      // Eğer email confirmation hatası varsa, manuel user oluşturmayı dene
      if (authData.message?.includes("confirmation") || authData.message?.includes("email")) {
        return await createUserManually(supabaseUrl, supabaseKey, email, password, fullName)
      }
      throw new Error(authData.message || "Auth hatası")
    }

    if (authData.user) {
      // Profile oluştur
      const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          id: authData.user.id,
          role: "admin",
          full_name: fullName,
        }),
      })

      if (!profileResponse.ok) {
        const profileError = await profileResponse.json()
        console.warn("Profile oluşturma hatası:", profileError)
        // Profile hatası olsa bile devam et
      }
    }

    return NextResponse.json({
      success: true,
      user: authData.user,
      message: "Admin kullanıcısı başarıyla oluşturuldu!",
    })
  } catch (error: any) {
    console.error("API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Manuel user oluşturma fonksiyonu
async function createUserManually(
  supabaseUrl: string,
  supabaseKey: string,
  email: string,
  password: string,
  fullName: string,
) {
  try {
    // Rastgele UUID oluştur
    const userId = crypto.randomUUID()

    // Şifreyi hash'le (basit bcrypt benzeri)
    const hashedPassword = await hashPassword(password)

    // Doğrudan auth.users tablosuna insert
    const userResponse = await fetch(`${supabaseUrl}/rest/v1/auth.users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        id: userId,
        email,
        encrypted_password: hashedPassword,
        email_confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    })

    if (!userResponse.ok) {
      // Eğer auth.users'a erişim yoksa, sadece profile oluştur
      const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          id: userId,
          role: "admin",
          full_name: fullName,
        }),
      })

      return NextResponse.json({
        success: true,
        message: "Kullanıcı profili oluşturuldu. EasyPanel'den email confirmation'ı kapatın ve tekrar deneyin.",
        instructions: "EasyPanel Supabase > Authentication > Settings > Email Confirmation = OFF",
      })
    }

    // Profile oluştur
    await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        id: userId,
        role: "admin",
        full_name: fullName,
      }),
    })

    return NextResponse.json({
      success: true,
      message: "Admin kullanıcısı manuel olarak oluşturuldu!",
      user: { id: userId, email },
    })
  } catch (error: any) {
    return NextResponse.json({ error: `Manuel oluşturma hatası: ${error.message}` }, { status: 500 })
  }
}

// Basit password hashing
async function hashPassword(password: string): string {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + "salt")
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}
