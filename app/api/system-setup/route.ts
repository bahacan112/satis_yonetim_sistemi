import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * Checks whether the required database tables exist and if an admin user is already present.
 * Returns:
 *  • { tablesExist: false, hasAdminUser: false } ➜ Tables are missing
 *  • { tablesExist: true,  hasAdminUser: false } ➜ Tables exist but no admin
 *  • { tablesExist: true,  hasAdminUser: true }  ➜ Ready - nothing to set up
 *
 * Any unexpected error is logged and returned with HTTP 500.
 */
export async function GET() {
  try {
    // 1️⃣  Does the `profiles` table exist?
    const { error: tableError } = await supabase
      .from("profiles")
      .select("count")
      .limit(1);

    if (tableError) {
      // PostgreSQL “relation does not exist” → code 42P01
      const missingTable =
        tableError.code === "42P01" ||
        tableError.message.toLowerCase().includes("does not exist");

      if (missingTable) {
        return NextResponse.json({ tablesExist: false, hasAdminUser: false });
      }

      // Any other error while hitting the DB
      console.error("Table check failed:", tableError);
      return NextResponse.json(
        {
          tablesExist: false,
          hasAdminUser: false,
          error: "Table check failed",
          details: tableError.message,
        },
        { status: 500 }
      );
    }

    // 2️⃣  Tables exist – check for an admin user
    const { data: admins, error: adminError } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .limit(1);

    if (adminError) {
      console.error("Admin lookup failed:", adminError);
      return NextResponse.json(
        {
          tablesExist: true,
          hasAdminUser: false,
          error: "Admin lookup failed",
          details: adminError.message,
        },
        { status: 500 }
      );
    }

    const hasAdminUser = (admins?.length ?? 0) > 0;
    return NextResponse.json({ tablesExist: true, hasAdminUser });
  } catch (err) {
    console.error("System-setup API unexpected error:", err);
    return NextResponse.json(
      {
        tablesExist: false,
        hasAdminUser: false,
        error: "Unexpected error",
        details: err.message,
      },
      { status: 500 }
    );
  }
}
