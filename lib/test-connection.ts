import { supabase } from "./supabase"

export async function testSupabaseConnection() {
  try {
    // Basit bir bağlantı testi
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error("Supabase connection error:", error)
      return false
    }

    console.log("✅ Supabase connection successful")
    return true
  } catch (error) {
    console.error("❌ Supabase connection failed:", error)
    return false
  }
}

// Health check endpoint
export async function healthCheck() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
      },
    })
    return response.ok
  } catch (error) {
    console.error("Health check failed:", error)
    return false
  }
}
