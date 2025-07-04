import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { securityLogger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { cutoffDate, deleteAll } = await request.json();
    const cookieStore = await cookies();

    // Create Supabase client with proper cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch (error) {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing user sessions.
              console.warn("Failed to set cookies:", error);
            }
          },
        },
      }
    );

    // Get the current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      securityLogger.warn("Session error in delete logs", {
        error: sessionError.message,
        code: sessionError.status,
      });
      return NextResponse.json(
        { error: "Session error - Please login again" },
        { status: 401 }
      );
    }

    if (!session?.user) {
      securityLogger.warn("No session found for delete logs request", {
        hasSession: !!session,
        sessionId: session?.access_token ? "present" : "missing",
      });
      return NextResponse.json(
        { error: "Unauthorized - Please login again" },
        { status: 401 }
      );
    }

    const user = session.user;

    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      securityLogger.warn("Failed to get user profile for log deletion", {
        userId: user.id,
        error: profileError.message,
        code: profileError.code,
      });
      return NextResponse.json(
        { error: "Failed to verify user permissions" },
        { status: 403 }
      );
    }

    if (!profile) {
      securityLogger.warn("User profile not found for log deletion", {
        userId: user.id,
      });
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 403 }
      );
    }

    if (profile.role !== "admin") {
      securityLogger.warn("Non-admin user attempted to delete logs", {
        userId: user.id,
        userRole: profile.role,
        userEmail: user.email,
      });
      return NextResponse.json(
        { error: "Bu işlem için admin yetkisi gereklidir" },
        { status: 403 }
      );
    }

    let result;

    if (deleteAll) {
      securityLogger.info("Admin deleting all logs", {
        userId: user.id,
        userEmail: user.email,
      });

      const { data, error } = await supabase.rpc("delete_all_logs");

      if (error) {
        securityLogger.error("Error deleting all logs", {
          error: error.message,
          userId: user.id,
          code: error.code,
        });
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      result = data;
    } else {
      if (!cutoffDate) {
        securityLogger.warn("Missing cutoff date for log deletion", {
          userId: user.id,
        });
        return NextResponse.json(
          { error: "Cutoff date is required" },
          { status: 400 }
        );
      }

      securityLogger.info("Admin deleting logs before date", {
        cutoffDate,
        userId: user.id,
        userEmail: user.email,
      });

      const { data, error } = await supabase.rpc("delete_logs_before_date", {
        cutoff_date: cutoffDate,
      });

      if (error) {
        securityLogger.error("Error deleting logs before date", {
          error: error.message,
          cutoffDate,
          userId: user.id,
          code: error.code,
        });
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      result = data;
    }

    const deletedCount = result?.deleted_count || 0;
    const message = deleteAll
      ? `Tüm loglar silindi (${deletedCount} kayıt)`
      : `${deletedCount} log kaydı silindi`;

    securityLogger.info("Log deletion completed successfully", {
      deletedCount,
      userId: user.id,
      userEmail: user.email,
      deleteAll,
    });

    return NextResponse.json({
      success: true,
      message,
      deleted_count: deletedCount,
    });
  } catch (error) {
    securityLogger.error("Unexpected error in delete logs API", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Log silme işlemi başarısız",
      },
      { status: 500 }
    );
  }
}
