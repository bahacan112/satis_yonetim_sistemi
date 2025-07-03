import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "CAPTCHA token gerekli" },
        { status: 400 }
      );
    }

    // Test environment için Google'ın test secret key'i
    // Production'da gerçek secret key kullanın
    const secretKey =
      process.env.RECAPTCHA_SECRET_KEY ||
      "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe";

    const verificationURL = "https://www.google.com/recaptcha/api/siteverify";

    const verificationResponse = await fetch(verificationURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const verificationData = await verificationResponse.json();

    if (verificationData.success) {
      // Başarılı CAPTCHA doğrulaması
      console.log("CAPTCHA verification successful:", {
        timestamp: new Date().toISOString(),
        score: verificationData.score,
        action: verificationData.action,
      });

      return NextResponse.json({
        success: true,
        message: "CAPTCHA doğrulaması başarılı",
      });
    } else {
      // Başarısız CAPTCHA doğrulaması
      console.error("CAPTCHA verification failed:", {
        timestamp: new Date().toISOString(),
        errors: verificationData["error-codes"],
      });

      return NextResponse.json(
        {
          success: false,
          error: "CAPTCHA doğrulaması başarısız",
          details: verificationData["error-codes"],
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("CAPTCHA verification error:", error);

    return NextResponse.json(
      { success: false, error: "CAPTCHA doğrulama hatası" },
      { status: 500 }
    );
  }
}
