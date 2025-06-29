import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js"; // Supabase client'ı doğrudan import ediyoruz

export async function POST(request: NextRequest) {
  try {
    const { rehber_id, new_password } = await request.json();
    console.log("Şifre güncelleme isteği alındı. Rehber ID:", rehber_id);

    // Gerekli alanların kontrolü
    if (!rehber_id || !new_password) {
      console.error("Eksik rehber_id veya new_password.");
      return NextResponse.json(
        { error: "Rehber ID ve yeni şifre gereklidir." },
        { status: 400 }
      );
    }

    // Şifre uzunluğu kontrolü
    if (new_password.length < 6) {
      console.error("Şifre çok kısa.");
      return NextResponse.json(
        { error: "Şifre en az 6 karakter olmalıdır." },
        { status: 400 }
      );
    }

    // Ortam değişkenlerinin kontrolü
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
      .select("id, rehber_id, role") // Hata ayıklama için daha fazla alan seçildi
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

    // Kullanıcının şifresini güncelle
    console.log(`Kullanıcı ID: ${profile.id} için şifre güncelleniyor.`);
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      profile.id,
      {
        password: new_password,
      }
    );

    if (updateError) {
      console.error("Şifre güncelleme hatası:", updateError);
      return NextResponse.json(
        { error: `Şifre güncellenemedi: ${updateError.message}` },
        { status: 400 }
      );
    }

    console.log("Şifre başarıyla güncellendi.");
    return NextResponse.json({
      success: true,
      message: "Şifre başarıyla güncellendi!",
    });
  } catch (error: any) {
    console.error("API Genel Hata Yakalandı:", error);
    return NextResponse.json(
      { error: `Şifre güncelleme hatası: ${error.message}` },
      { status: 500 }
    );
  }
}
