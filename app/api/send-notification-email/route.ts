import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { notificationId, userEmail } = await request.json();

    if (!notificationId || !userEmail) {
      return NextResponse.json(
        { error: "Notification ID and user email are required" },
        { status: 400 }
      );
    }

    // Get notification details
    const { data: notification, error: notificationError } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", notificationId)
      .single();

    if (notificationError || !notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    // Get admin users who have email notifications enabled
    const { data: adminUsers, error: adminError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("role", "admin")
      .eq("email_notifications", true);

    if (adminError) {
      console.error("Error fetching admin users:", adminError);
      return NextResponse.json(
        { error: "Failed to fetch admin users" },
        { status: 500 }
      );
    }

    if (!adminUsers || adminUsers.length === 0) {
      return NextResponse.json(
        { message: "No admin users with email notifications enabled" },
        { status: 200 }
      );
    }

    // Here you would integrate with your email service (SendGrid, Resend, etc.)
    // For now, we'll just log the email details
    const emailData = {
      to: adminUsers.map((admin) => admin.email),
      subject: `Yeni Bildirim: ${notification.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Yeni Bildirim</h2>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2563eb;">${
              notification.title
            }</h3>
            <p style="color: #666; margin: 10px 0;"><strong>Tip:</strong> ${
              notification.type
            }</p>
            <p style="color: #666; margin: 10px 0;"><strong>Tarih:</strong> ${new Date(
              notification.created_at
            ).toLocaleString("tr-TR")}</p>
            <div style="background-color: white; padding: 15px; border-radius: 4px; margin: 15px 0;">
              <p style="margin: 0; white-space: pre-wrap;">${
                notification.message
              }</p>
            </div>
          </div>
          <p style="color: #888; font-size: 12px;">
            Bu e-posta otomatik olarak gönderilmiştir. Bildirim ayarlarınızı değiştirmek için dashboard'a giriş yapın.
          </p>
        </div>
      `,
    };

    console.log("Email would be sent to:", emailData);

    // TODO: Implement actual email sending here
    // Example with Resend:
    // const { data, error } = await resend.emails.send(emailData);

    return NextResponse.json(
      { message: "Email notifications queued successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending notification email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
