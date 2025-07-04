import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabaseClient() {
  const cookieStore = cookies(); // cookies() fonksiyonunu doğrudan çağırıyoruz

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: any) => {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Bu hata, bir Sunucu Bileşeni'nden setAll çağrıldığında oluşabilir.
            // Kullanıcı oturumlarını yenileyen bir middleware'iniz varsa bu göz ardı edilebilir.
            console.warn("Failed to set cookie in server client:", error);
          }
        },
        remove: (name: string, options: any) => {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            console.warn("Failed to remove cookie in server client:", error);
          }
        },
      },
    }
  );
}

export const createClient = createServerSupabaseClient;
