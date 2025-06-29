import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { rehber_id } = await request.json();
    console.log(
      "Rehber kullanıcı kaldırma isteği alındı. Rehber ID:",
      rehber_id
    );

    if (!rehber_id) {
      console.error("Eksik rehber_id.");
      return NextResponse.json(
        { error: "Rehber ID gereklidir." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error(
        "Ortam değişkenleri eksik: NEXT_PUBLIC_SUPABASE_URL veya SERVICE_ROLE_KEY."
      );
      return NextResponse.json(
        { error: "Sunucu yapılandırma hatası: Ortam değişkenleri eksik." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    console.log("Supabase client service role key ile başlatıldı.");

    // Rehber ID'sine göre kullanıcıyı profiles tablosunda bul
    console.log(
      `Profiles tablosunda rehber_id: ${rehber_id} ve rolü 'rehber' olan kullanıcı aranıyor.`
    );
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id") // Supabase Auth user ID'sini alıyoruz
      .eq("rehber_id", rehber_id)
      .eq("role", "rehber")
      .single();

    if (profileError) {
      console.error("Profil çekme hatası:", profileError);
      return NextResponse.json(
        {
          error: `Profil bulunamadı veya sorgu hatası: ${profileError.message}`,
        },
        { status: 404 }
      );
    }

    if (!profile) {
      console.error(
        `Profiles tablosunda rehber_id: ${rehber_id} ve rolü 'rehber' olan profil bulunamadı.`
      );
      return NextResponse.json(
        { error: "Rehber kullanıcısı bulunamadı." },
        { status: 404 }
      );
    }

    console.log("Profil bulundu:", profile);

    // Önce profiles kaydını sil
    console.log(`Profiles tablosundan ID: ${profile.id} siliniyor.`);
    const { error: profileDeleteError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", profile.id);

    if (profileDeleteError) {
      console.error("Profile silme hatası:", profileDeleteError);
      return NextResponse.json(
        { error: `Profil silinemedi: ${profileDeleteError.message}` },
        { status: 400 }
      );
    }
    console.log("Profil başarıyla silindi.");

    // Sonra Supabase Auth kullanıcısını sil
    console.log(`Supabase Auth kullanıcısı ID: ${profile.id} siliniyor.`);
    const { error: userDeleteError } = await supabase.auth.admin.deleteUser(
      profile.id
    );

    if (userDeleteError) {
      console.error("Kullanıcı silme hatası:", userDeleteError);
      return NextResponse.json(
        { error: `Kullanıcı silinemedi: ${userDeleteError.message}` },
        { status: 400 }
      );
    }
    console.log("Kullanıcı hesabı başarıyla kaldırıldı.");

    return NextResponse.json({
      success: true,
      message: "Kullanıcı hesabı başarıyla kaldırıldı!",
    });
  } catch (error: any) {
    console.error("API Genel Hata Yakalandı:", error);
    return NextResponse.json(
      { error: `Kullanıcı kaldırma hatası: ${error.message}` },
      { status: 500 }
    );
  }
}
