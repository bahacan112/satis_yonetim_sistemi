import { createBrowserClient } from "@supabase/ssr"

// createClient bir adlandırılmış dışa aktarımdır.
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}
