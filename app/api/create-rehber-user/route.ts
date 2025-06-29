import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { email, password, rehber_id, full_name } = await request.json();

    // Input validation
    if (!email || !password || !rehber_id || !full_name) {
      return NextResponse.json(
        { error: "Email, şifre, rehber ID ve tam ad gerekli." },
        { status: 400 }
      );
    }

    // Environment variables kontrolü
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error(
        "Environment variables tanımlanmamış: NEXT_PUBLIC_SUPABASE_URL veya NEXT_PUBLIC_SUPABASE_ANON_KEY"
      );
      return NextResponse.json(
        {
          error:
            "Sunucu yapılandırma hatası: Supabase URL veya Anon Key eksik.",
        },
        { status: 500 }
      );
    }

    if (!serviceRoleKey) {
      console.error("Environment variable tanımlanmamış: SERVICE_ROLE_KEY");
      return NextResponse.json(
        {
          error:
            "Sunucu yapılandırma hatası: SERVICE_ROLE_KEY eksik. Admin işlemleri için gereklidir.",
        },
        { status: 500 }
      );
    }

    // Supabase client oluştur (service role key ile)
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Önce bu email ile kullanıcı var mı kontrol et
    const { data: existingUsers, error: userListError } =
      await supabase.auth.admin.listUsers();

    if (userListError) {
      console.error("Kullanıcı listeleme hatası:", userListError);
      return NextResponse.json(
        {
          error: `Kullanıcı kontrolü sırasında hata: ${userListError.message}`,
        },
        { status: 500 }
      );
    }

    if (existingUsers?.users?.some((user) => user.email === email)) {
      return NextResponse.json(
        { error: "Bu e-posta adresi ile zaten bir kullanıcı mevcut." },
        { status: 400 }
      );
    }

    // Admin API kullanarak kullanıcı oluştur
    const { data: userData, error: userError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Email doğrulamasını bypass et
        user_metadata: {
          full_name,
          rehber_id, // Rehber ID'sini user metadata'ya ekle
          role: "rehber",
        },
      });

    if (userError) {
      console.error("Kullanıcı oluşturma hatası:", userError);
      // Yaygın hataları kontrol et
      if (userError.message?.includes("email")) {
        return NextResponse.json(
          { error: "Geçersiz e-posta adresi formatı." },
          { status: 400 }
        );
      }
      if (userError.message?.includes("password")) {
        return NextResponse.json(
          { error: "Şifre en az 6 karakter olmalı." },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: userError.message }, { status: 400 });
    }

    if (!userData.user) {
      return NextResponse.json(
        { error: "Kullanıcı oluşturulamadı, beklenmedik bir hata oluştu." },
        { status: 400 }
      );
    }

    // Profiles tablosuna id, role, full_name ve rehber_id ekle
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userData.user.id,
      role: "rehber",
      full_name: full_name || null,
      rehber_id: rehber_id, // Rehber ID'sini profiles tablosuna da ekle
    });

    if (profileError) {
      console.error("Profile oluşturma hatası:", profileError);
      // RLS hatası kontrolü
      if (
        profileError.message?.includes("row-level security") ||
        profileError.message?.includes("policy")
      ) {
        // Kullanıcı oluşturuldu ama profil oluşturulamadı, kullanıcıya uyarı verip RLS'i kontrol etmesini söylemek daha iyi
        return NextResponse.json(
          {
            success: true,
            user: userData.user,
            message:
              "Kullanıcı başarıyla oluşturuldu, ancak profil bilgileri kaydedilemedi. Lütfen RLS politikalarınızı kontrol edin.",
            warning: `Profil oluşturma hatası: ${profileError.message}`,
          },
          { status: 200 }
        ); // 200 OK, çünkü kullanıcı oluşturuldu
      }

      // Profil oluşturulamadı, kullanıcıyı geri al (sil)
      await supabase.auth.admin.deleteUser(userData.user.id);
      return NextResponse.json(
        {
          error: `Profil oluşturulamadı: ${profileError.message}. Kullanıcı geri alındı.`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: userData.user,
        message: "Rehber kullanıcısı başarıyla oluşturuldu!",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API Genel Hata:", error);
    return NextResponse.json(
      {
        error: `Kullanıcı oluşturma sırasında beklenmedik bir hata oluştu: ${error.message}`,
      },
      { status: 500 }
    );
  }
}
