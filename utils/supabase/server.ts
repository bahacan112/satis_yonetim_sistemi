import { createClient } from "@supabase/supabase-js"

export const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  })
}

// Bu fonksiyon sadece server-side API route'larda kullanılmalı
export const createAdminClient = () => {
  // Server-side kontrolü
  if (typeof window !== "undefined") {
    throw new Error("Admin client can only be used on server-side")
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    console.warn("SERVICE_ROLE_KEY is not defined, falling back to regular client")
    return createSupabaseClient()
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
