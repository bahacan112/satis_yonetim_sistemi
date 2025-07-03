import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      console.error("reCAPTCHA verification failed: No token provided");
      return NextResponse.json(
        {
          success: false,
          error: "CAPTCHA token is required",
        },
        { status: 400 }
      );
    }

    // Development ortamında her zaman başarılı dön
    if (process.env.NODE_ENV === "development") {
      console.log("Development mode: CAPTCHA verification bypassed");
      return NextResponse.json({ success: true });
    }

    // Production ortamında Google reCAPTCHA API'sini kullan
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      console.error("RECAPTCHA_SECRET_KEY environment variable is not set");
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error",
        },
        { status: 500 }
      );
    }

    console.log("Verifying reCAPTCHA with Google API...");

    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify`;
    const response = await fetch(verifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();

    console.log("Google reCAPTCHA API response:", {
      success: data.success,
      errorCodes: data["error-codes"],
      hostname: data.hostname,
      challengeTs: data.challenge_ts,
    });

    if (data.success) {
      return NextResponse.json({ success: true });
    } else {
      console.error("reCAPTCHA verification failed:", data["error-codes"]);
      return NextResponse.json(
        {
          success: false,
          error: "CAPTCHA verification failed",
          details: data["error-codes"],
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("CAPTCHA verification error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
