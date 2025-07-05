"use client";

import type React from "react";

import { useState, useRef } from "react";
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
import { Eye, EyeOff, Shield, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase-monitored";
import { toast } from "sonner";
import ReCAPTCHA from "react-google-recaptcha";
import { useI18n } from '@/contexts/i18n-context';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const router = useRouter();
  const { t } = useI18n();

  const handleCaptchaChange = (token: string | null) => {
    setCaptchaToken(token);
  };

  const handleCaptchaExpired = () => {
    setCaptchaToken(null);
    toast.error(t('auth.captchaExpired'));
  };

  const handleCaptchaError = () => {
    setCaptchaToken(null);
    toast.error(t('auth.captchaFailed'));
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

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error("Captcha verification error:", error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError(t('auth.fillAllFields'));
      return;
    }

    if (!captchaToken) {
      setError(t('auth.completeCaptcha'));
      return;
    }

    setLoading(true);

    try {
      // Verify captcha first
      const captchaValid = await verifyCaptcha(captchaToken);
      if (!captchaValid) {
        setError(t('auth.captchaFailed'));
        recaptchaRef.current?.reset();
        setCaptchaToken(null);
        return;
      }

      // Attempt login
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email,
          password,
        }
      );

      if (authError) {
        setError(authError.message);
        recaptchaRef.current?.reset();
        setCaptchaToken(null);
        return;
      }

      if (data.user) {
        toast.success(t('auth.loginSuccess'));
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(t('auth.loginError'));
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {t('auth.loginTitle')}
          </CardTitle>
          <CardDescription className="text-center">
            {t('auth.loginDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t('auth.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            {/* reCAPTCHA */}
            <div className="flex justify-center">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
                onChange={handleCaptchaChange}
                onExpired={handleCaptchaExpired}
                onErrored={handleCaptchaError}
                theme="light"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !captchaToken}
            >
              {loading ? t('auth.loggingIn') : t('auth.login')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
