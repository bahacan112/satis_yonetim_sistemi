import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// Type definitions - UUID'ye güncellenmiş
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: "admin" | "standart" | "rehber"
          full_name: string | null
          created_at: string
          magaza_id: string | null
          rehber_id: string | null // UUID'ye güncellendi
        }
        Insert: {
          id: string
          role?: "admin" | "standart" | "rehber"
          full_name?: string | null
          created_at?: string
          magaza_id?: string | null
          rehber_id?: string | null // UUID'ye güncellendi
        }
        Update: {
          id?: string
          role?: "admin" | "standart" | "rehber"
          full_name?: string | null
          created_at?: string
          magaza_id?: string | null
          rehber_id?: string | null // UUID'ye güncellendi
        }
      }
      firmalar: {
        Row: {
          id: string
          firma_adi: string
          kayit_tarihi: string | null
          il: string | null
          sektor: string | null
          created_at: string
        }
        Insert: {
          id?: string
          firma_adi: string
          kayit_tarihi?: string | null
          il?: string | null
          sektor?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          firma_adi?: string
          kayit_tarihi?: string | null
          il?: string | null
          sektor?: string | null
          created_at?: string
        }
      }
      magazalar: {
        Row: {
          id: string
          magaza_adi: string
          firma_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          magaza_adi: string
          firma_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          magaza_adi?: string
          firma_id?: string | null
          created_at?: string
        }
      }
      turlar: {
        Row: {
          id: string // UUID'ye güncellendi
          tur_adi: string
          tur_aciklamasi: string | null
          operator_id: string | null
          created_at: string
        }
        Insert: {
          id?: string // UUID'ye güncellendi
          tur_adi: string
          tur_aciklamasi?: string | null
          operator_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string // UUID'ye güncellendi
          tur_adi?: string
          tur_aciklamasi?: string | null
          operator_id?: string | null
          created_at?: string
        }
      }
      urunler: {
        Row: {
          id: string // UUID'ye güncellendi
          urun_adi: string
          urun_aciklamasi: string | null
          created_at: string
        }
        Insert: {
          id?: string // UUID'ye güncellendi
          urun_adi: string
          urun_aciklamasi?: string | null
          created_at?: string
        }
        Update: {
          id?: string // UUID'ye güncellendi
          urun_adi?: string
          urun_aciklamasi?: string | null
          created_at?: string
        }
      }
      rehberler: {
        Row: {
          id: string // UUID'ye güncellendi
          rehber_adi: string
          telefon: string | null
          email: string | null
          adres: string | null
          notlar: string | null
          aktif: boolean
          created_at: string
        }
        Insert: {
          id?: string // UUID'ye güncellendi
          rehber_adi: string
          telefon?: string | null
          email?: string | null
          adres?: string | null
          notlar?: string | null
          aktif?: boolean
          created_at?: string
        }
        Update: {
          id?: string // UUID'ye güncellendi
          rehber_adi?: string
          telefon?: string | null
          email?: string | null
          adres?: string | null
          notlar?: string | null
          aktif?: boolean
          created_at?: string
        }
      }
      satislar: {
        Row: {
          id: string // UUID'ye güncellendi
          operator_id: string | null
          firma_id: string | null
          grup_gelis_tarihi: string | null
          magaza_giris_tarihi: string | null
          satis_tarihi: string | null
          grup_pax: number | null
          magaza_pax: number | null
          tur_id: string | null // UUID'ye güncellendi
          rehber_id: string | null // UUID'ye güncellendi
          magaza_id: string | null
          created_at: string
        }
        Insert: {
          id?: string // UUID'ye güncellendi
          operator_id?: string | null
          firma_id?: string | null
          grup_gelis_tarihi?: string | null
          magaza_giris_tarihi?: string | null
          satis_tarihi?: string | null
          grup_pax?: number | null
          magaza_pax?: number | null
          tur_id?: string | null // UUID'ye güncellendi
          rehber_id?: string | null // UUID'ye güncellendi
          magaza_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string // UUID'ye güncellendi
          operator_id?: string | null
          firma_id?: string | null
          grup_gelis_tarihi?: string | null
          magaza_giris_tarihi?: string | null
          satis_tarihi?: string | null
          grup_pax?: number | null
          magaza_pax?: number | null
          tur_id?: string | null // UUID'ye güncellendi
          rehber_id?: string | null // UUID'ye güncellendi
          magaza_id?: string | null
          created_at?: string
        }
      }
      magaza_satis_kalemleri: {
        Row: {
          id: string // UUID'ye güncellendi
          satis_id: string // UUID'ye güncellendi
          urun_id: string // UUID'ye güncellendi
          adet: number
          birim_fiyat: number
          acente_komisyonu: number | null
          rehber_komisyonu: number | null
          kaptan_komisyonu: number | null
          ofis_komisyonu: number | null
          bekleme: boolean | null
          vade_tarihi: string | null
          status: string | null
          created_at: string
        }
        Insert: {
          id?: string // UUID'ye güncellendi
          satis_id: string // UUID'ye güncellendi
          urun_id: string // UUID'ye güncellendi
          adet: number
          birim_fiyat: number
          acente_komisyonu?: number | null
          rehber_komisyonu?: number | null
          kaptan_komisyonu?: number | null
          ofis_komisyonu?: number | null
          bekleme?: boolean | null
          vade_tarihi?: string | null
          status?: string | null
          created_at?: string
        }
        Update: {
          id?: string // UUID'ye güncellendi
          satis_id?: string // UUID'ye güncellendi
          urun_id?: string // UUID'ye güncellendi
          adet?: number
          birim_fiyat?: number
          acente_komisyonu?: number | null
          rehber_komisyonu?: number | null
          kaptan_komisyonu?: number | null
          ofis_komisyonu?: number | null
          bekleme?: boolean | null
          vade_tarihi?: string | null
          status?: string | null
          created_at?: string
        }
      }
      rehber_satis_kalemleri: {
        Row: {
          id: string // UUID'ye güncellendi
          satis_id: string // UUID'ye güncellendi
          urun_id: string // UUID'ye güncellendi
          adet: number
          birim_fiyat: number
          bekleme: boolean | null
          vade_tarihi: string | null
          status: string | null
          created_at: string
        }
        Insert: {
          id?: string // UUID'ye güncellendi
          satis_id: string // UUID'ye güncellendi
          urun_id: string // UUID'ye güncellendi
          adet: number
          birim_fiyat: number
          bekleme?: boolean | null
          vade_tarihi?: string | null
          status?: string | null
          created_at?: string
        }
        Update: {
          id?: string // UUID'ye güncellendi
          satis_id?: string // UUID'ye güncellendi
          urun_id?: string // UUID'ye güncellendi
          adet?: number
          birim_fiyat?: number
          bekleme?: boolean | null
          vade_tarihi?: string | null
          status?: string | null
          created_at?: string
        }
      }
      tahsilatlar: {
        Row: {
          id: string // UUID'ye güncellendi
          magaza_id: string
          tahsilat_tarihi: string
          odeme_kanali: string
          acente_payi: number
          ofis_payi: number
          created_at: string
        }
        Insert: {
          id?: string // UUID'ye güncellendi
          magaza_id: string
          tahsilat_tarihi: string
          odeme_kanali: string
          acente_payi?: number
          ofis_payi?: number
          created_at?: string
        }
        Update: {
          id?: string // UUID'ye güncellendi
          magaza_id?: string
          tahsilat_tarihi?: string
          odeme_kanali?: string
          acente_payi?: number
          ofis_payi?: number
          created_at?: string
        }
      }
      magaza_urunler: {
        Row: {
          id: string // UUID'ye güncellendi
          magaza_id: string
          urun_id: string // UUID'ye güncellendi
          acente_komisyonu: number
          rehber_komisyonu: number
          kaptan_komisyonu: number
          ofis_komisyonu: number
          aktif: boolean
          created_at: string
        }
        Insert: {
          id?: string // UUID'ye güncellendi
          magaza_id: string
          urun_id: string // UUID'ye güncellendi
          acente_komisyonu?: number
          rehber_komisyonu?: number
          kaptan_komisyonu?: number
          ofis_komisyonu?: number
          aktif?: boolean
          created_at?: string
        }
        Update: {
          id?: string // UUID'ye güncellendi
          magaza_id?: string
          urun_id?: string // UUID'ye güncellendi
          acente_komisyonu?: number
          rehber_komisyonu?: number
          kaptan_komisyonu?: number
          ofis_komisyonu?: number
          aktif?: boolean
          created_at?: string
        }
      }
    }
  }
}
