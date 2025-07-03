import { type NextRequest, NextResponse } from "next/server"
import { monitoredSupabase } from "@/lib/supabase-monitored"

export async function POST(request: NextRequest) {
  try {
    const { cutoffDate, deleteAll } = await request.json()

    // Auth kontrolü
    const {
      data: { user },
      error: authError,
    } = await monitoredSupabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Admin kontrolü
    const { data: profile } = await monitoredSupabase.from("profiles").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Bu işlem için admin yetkisi gereklidir" }, { status: 403 })
    }

    let result

    if (deleteAll) {
      // Tüm logları sil
      const { data, error } = await monitoredSupabase.rpc("delete_all_logs")

      if (error) {
        console.error("Delete all logs error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      result = data
    } else {
      // Belirli tarihten önceki logları sil
      if (!cutoffDate) {
        return NextResponse.json({ error: "Cutoff date is required" }, { status: 400 })
      }

      const { data, error } = await monitoredSupabase.rpc("delete_logs_before_date", {
        cutoff_date: cutoffDate,
      })

      if (error) {
        console.error("Delete logs before date error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      result = data
    }

    const message = deleteAll
      ? `Tüm loglar silindi (${result.deleted_count} kayıt)`
      : `${result.deleted_count} log kaydı silindi`

    return NextResponse.json({
      success: true,
      message,
      deleted_count: result.deleted_count,
    })
  } catch (error) {
    console.error("Delete logs API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Log silme işlemi başarısız" },
      { status: 500 },
    )
  }
}
