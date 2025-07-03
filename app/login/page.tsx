"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
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
import { Loader2, Eye, EyeOff, Shield } from "lucide-react";
import { supabase } from "@/lib/supabase";
import ReCAPTCHA from "react-google-recaptcha";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState("");
  const [captchaLoaded, setCaptchaLoaded] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const router = useRouter();

  // reCAPTCHA site key - production'da gerçek key kullan
  const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  useEffect(() => {
    // reCAPTCHA script'inin yüklenip yüklenmediğini kontrol et
    const checkRecaptchaLoaded = () => {
      if (typeof window !== "undefined" && window.grecaptcha) {
        setCaptchaLoaded(true);
      }
    };

    // Script yüklendikten sonra kontrol et
    const timer = setTimeout(checkRecaptchaLoaded, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleCaptchaChange = (token: string | null) => {
    console.log("CAPTCHA token received:", token ? "✓" : "✗");
    setCaptchaToken(token);
    setCaptchaError("");
  };

  const handleCaptchaError = () => {
    console.error("reCAPTCHA error occurred");
    setCaptchaError(
      "CAPTCHA yüklenirken hata oluştu. Lütfen sayfayı yenileyin."
    );
    setCaptchaToken(null);
  };

  const handleCaptchaExpired = () => {
    console.warn("reCAPTCHA expired");
    setCaptchaToken(null);
    setCaptchaError("CAPTCHA süresi doldu. Lütfen tekrar doğrulayın.");
  };

  const verifyCaptcha = async (token: string): Promise<boolean> => {
    try {
      console.log("Verifying CAPTCHA token...");
      const response = await fetch("/api/verify-captcha", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      console.log("CAPTCHA verification result:", data.success ? "✓" : "✗");
      return data.success;
    } catch (error) {
      console.error("CAPTCHA verification error:", error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCaptchaError("");

    if (!email || !password) {
      setError("Email ve şifre gereklidir");
      return;
    }

    if (!captchaToken) {
      setCaptchaError("Lütfen güvenlik doğrulamasını tamamlayın");
      return;
    }

    setIsLoading(true);

    try {
      // CAPTCHA doğrulaması
      const isCaptchaValid = await verifyCaptcha(captchaToken);
      if (!isCaptchaValid) {
        setCaptchaError(
          "Güvenlik doğrulaması başarısız. Lütfen tekrar deneyin."
        );
        recaptchaRef.current?.reset();
        setCaptchaToken(null);
        return;
      }

      // Supabase ile giriş
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        // Hata durumunda CAPTCHA'yı sıfırla
        recaptchaRef.current?.reset();
        setCaptchaToken(null);
        return;
      }

      if (data.user) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Giriş yapılırken bir hata oluştu");
      // Hata durumunda CAPTCHA'yı sıfırla
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Şifrenizi girin"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Güvenlik Doğrulaması */}
            <div className="space-y-2">
              <Label>Güvenlik Doğrulaması</Label>
              <div className="flex justify-center">
                {RECAPTCHA_SITE_KEY ? (
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={RECAPTCHA_SITE_KEY}
                    onChange={handleCaptchaChange}
                    onError={handleCaptchaError}
                    onExpired={handleCaptchaExpired}
                    theme="light"
                    size="normal"
                  />
                ) : (
                  <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                    <p className="text-sm text-gray-500">
                      reCAPTCHA yapılandırılmamış
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      NEXT_PUBLIC_RECAPTCHA_SITE_KEY environment variable'ı
                      eksik
                    </p>
                  </div>
                )}
              </div>

              {captchaError && (
                <Alert variant="destructive">
                  <AlertDescription>{captchaError}</AlertDescription>
                </Alert>
              )}

              {/* Debug bilgisi - sadece development'ta göster */}
              {process.env.NODE_ENV === "development" && (
                <div className="text-xs text-gray-500 text-center">
                  <p>Site Key: {RECAPTCHA_SITE_KEY ? "✓ Mevcut" : "✗ Eksik"}</p>
                  <p>Token: {captchaToken ? "✓ Alındı" : "✗ Bekleniyor"}</p>
                </div>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || (!captchaToken && RECAPTCHA_SITE_KEY)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Giriş yapılıyor...
                </>
              ) : (
                "Giriş Yap"
              )}
            </Button>
          </form>

          {/* reCAPTCHA bilgi metni */}
          {RECAPTCHA_SITE_KEY && (
            <div className="mt-4 text-xs text-gray-500 text-center">
              Bu site reCAPTCHA ile korunmaktadır ve Google{" "}
              <a
                href="https://policies.google.com/privacy"
                className="underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Gizlilik Politikası
              </a>{" "}
              ve{" "}
              <a
                href="https://policies.google.com/terms"
                className="underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Hizmet Şartları
              </a>{" "}
              geçerlidir.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
