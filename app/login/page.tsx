"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import Script from "next/script";
import { Shield, Loader2 } from "lucide-react";

declare global {
  interface Window {
    grecaptcha: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark";
          size?: "normal" | "compact";
        }
      ) => number;
      reset: (widgetId?: number) => void;
      getResponse: (widgetId?: number) => string;
      ready: (callback: () => void) => void;
    };
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaLoaded, setCaptchaLoaded] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef<HTMLDivElement>(null);
  const captchaWidgetId = useRef<number | null>(null);
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  // reCAPTCHA site key (test key - production'da değiştirin)
  const RECAPTCHA_SITE_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"; // Test key

  // Eğer kullanıcı zaten giriş yapmışsa dashboard'a yönlendir
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  // reCAPTCHA yüklendiğinde çalışır
  const onCaptchaLoad = () => {
    console.log("reCAPTCHA loaded");
    setCaptchaLoaded(true);

    if (window.grecaptcha && captchaRef.current) {
      window.grecaptcha.ready(() => {
        if (captchaRef.current) {
          captchaWidgetId.current = window.grecaptcha.render(
            captchaRef.current,
            {
              sitekey: RECAPTCHA_SITE_KEY,
              callback: (token: string) => {
                console.log(
                  "CAPTCHA completed:",
                  token.substring(0, 20) + "..."
                );
                setCaptchaToken(token);
                setError(""); // CAPTCHA tamamlandığında hata mesajını temizle
              },
              "expired-callback": () => {
                console.log("CAPTCHA expired");
                setCaptchaToken("");
                setError("CAPTCHA süresi doldu, lütfen tekrar doğrulayın");
              },
              "error-callback": () => {
                console.log("CAPTCHA error");
                setCaptchaToken("");
                setError("CAPTCHA hatası oluştu, lütfen sayfayı yenileyin");
              },
              theme: "light",
              size: "normal",
            }
          );
        }
      });
    }
  };

  const resetCaptcha = () => {
    if (window.grecaptcha && captchaWidgetId.current !== null) {
      window.grecaptcha.reset(captchaWidgetId.current);
      setCaptchaToken("");
    }
  };

  const verifyCaptcha = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/verify-captcha", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error("CAPTCHA verification error:", error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // CAPTCHA kontrolü
      if (!captchaToken) {
        setError("Lütfen CAPTCHA doğrulamasını tamamlayın");
        setLoading(false);
        return;
      }

      // CAPTCHA doğrulama
      const captchaValid = await verifyCaptcha(captchaToken);
      if (!captchaValid) {
        setError("CAPTCHA doğrulaması başarısız. Lütfen tekrar deneyin.");
        resetCaptcha();
        setLoading(false);
        return;
      }

      console.log("Login attempt for:", email);

      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email,
          password,
        }
      );

      console.log("Login response:", {
        hasUser: !!data.user,
        hasError: !!authError,
        errorMessage: authError?.message,
      });

      if (authError) {
        console.error("Login error:", authError);
        setError(authError.message || "Giriş yapılırken bir hata oluştu");
        resetCaptcha(); // Hata durumunda CAPTCHA'yı sıfırla
        setLoading(false);
        return;
      }

      if (data.user) {
        console.log("Login successful, waiting for auth context update...");
        // Auth context otomatik olarak güncellenecek ve useEffect ile yönlendirme yapılacak
      }
    } catch (error: any) {
      console.error("Login exception:", error);
      setError(error.message || "Giriş yapılırken bir hata oluştu");
      resetCaptcha(); // Hata durumunda CAPTCHA'yı sıfırla
      setLoading(false);
    }
  };

  // Eğer kullanıcı zaten giriş yapmışsa loading göster
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Dashboard'a yönlendiriliyor...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* reCAPTCHA Script */}
      <Script
        src="https://www.google.com/recaptcha/api.js"
        onLoad={onCaptchaLoad}
        strategy="lazyOnload"
      />

      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              Giriş Yap
            </CardTitle>
            <CardDescription className="text-center">
              Satış yönetim sistemine giriş yapın
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Şifre</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {/* reCAPTCHA */}
              <div className="space-y-2">
                <Label>Güvenlik Doğrulaması</Label>
                <div className="flex justify-center">
                  {!captchaLoaded ? (
                    <div className="flex items-center justify-center p-4 border border-gray-300 rounded bg-gray-50 w-80 h-20">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm text-gray-600">
                        CAPTCHA yükleniyor...
                      </span>
                    </div>
                  ) : (
                    <div ref={captchaRef} />
                  )}
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !captchaToken}
              >
                {loading ? (
                  <div className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Giriş yapılıyor...
                  </div>
                ) : (
                  "Giriş Yap"
                )}
              </Button>
            </form>

            {/* CAPTCHA Status */}
            <div className="mt-4 text-center">
              <div className="text-xs text-gray-500">
                <p>CAPTCHA: {captchaToken ? "✓ Doğrulandı" : "⏳ Bekliyor"}</p>
                <p className="mt-1">
                  Test ortamı - Production'da gerçek CAPTCHA key kullanın
                </p>
              </div>
            </div>

            {/* reCAPTCHA Terms */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Bu site reCAPTCHA ile korunmaktadır ve Google{" "}
                <a
                  href="https://policies.google.com/privacy"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Gizlilik Politikası
                </a>{" "}
                ve{" "}
                <a
                  href="https://policies.google.com/terms"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Hizmet Şartları
                </a>{" "}
                geçerlidir.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
