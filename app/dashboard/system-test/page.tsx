"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import {
  Loader2,
  Terminal,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

export default function SystemTestPage() {
  const { userRole, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loginResult, setLoginResult] = useState<string | null>(null);
  const [dashResult, setDashResult] = useState<string | null>(null);
  const [salesResult, setSalesResult] = useState<string | null>(null);
  const [reportResult, setReportResult] = useState<string | null>(null);

  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingDash, setLoadingDash] = useState(false);
  const [loadingSales, setLoadingSales] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    if (!authLoading && userRole !== "admin") {
      router.push("/dashboard");
    }
  }, [authLoading, userRole, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (userRole !== "admin") {
    return (
      <Alert variant="destructive" className="max-w-lg mx-auto mt-10">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Erişim reddedildi</AlertTitle>
        <AlertDescription>
          Bu sayfayı yalnızca yöneticiler görüntüleyebilir.
        </AlertDescription>
      </Alert>
    );
  }

  function ResultAlert({ text }: { text: string }) {
    const variant = text.startsWith("✅")
      ? "success"
      : text.startsWith("⚠️")
      ? "warning"
      : "error";

    const color =
      variant === "success"
        ? "green"
        : variant === "warning"
        ? "yellow"
        : "red";

    const Icon =
      variant === "success"
        ? CheckCircle
        : variant === "warning"
        ? AlertTriangle
        : XCircle;

    return (
      <Alert className={`mt-4 border-${color}-500 text-${color}-700`}>
        <Icon className="h-4 w-4" />
        <AlertDescription>{text}</AlertDescription>
      </Alert>
    );
  }

  async function runLoginTest() {
    setLoadingLogin(true);
    setLoginResult(null);
    try {
      const start = performance.now();
      const res = await fetch("/api/system-setup");
      const data = await res.json();
      const dur = (performance.now() - start).toFixed(2);

      if (res.ok && data.tablesExist && data.hasAdminUser) {
        setLoginResult(
          `✅ Giriş ön kontrolü başarılı (${dur} ms) – tüm tablolar ve admin mevcut.`
        );
      } else {
        const msg = !data.tablesExist
          ? "tablolar eksik"
          : !data.hasAdminUser
          ? "admin kullanıcısı yok"
          : "bilinmeyen hata";
        setLoginResult(`❌ Giriş ön kontrolü başarısız (${dur} ms) – ${msg}.`);
      }
    } catch (e: any) {
      setLoginResult(`❌ Giriş ön kontrolü hatası: ${e.message}`);
    } finally {
      setLoadingLogin(false);
    }
  }

  async function runDashTest() {
    setLoadingDash(true);
    setDashResult(null);
    try {
      const start = performance.now();
      const { data: sales, error: e1 } = await supabase
        .from("satislar_detay_view")
        .select("*")
        .limit(500);

      const { data: muh, error: e2 } = await supabase
        .from("magaza_muhasebe_summary_view")
        .select("*")
        .limit(500);

      const dur = (performance.now() - start).toFixed(2);

      if (e1 || e2) throw e1 || e2;

      setDashResult(
        `✅ Dashboard verisi yüklendi (${dur} ms) – Satış: ${sales?.length}, Muhasebe: ${muh?.length}`
      );
    } catch (e: any) {
      setDashResult(`❌ Dashboard testi hatası: ${e.message}`);
    } finally {
      setLoadingDash(false);
    }
  }

  async function runSalesTest() {
    setLoadingSales(true);
    setSalesResult(null);
    try {
      const start = performance.now();
      const { data, error } = await supabase
        .from("satislar_detay_view")
        .select("*")
        .limit(1000);

      const dur = (performance.now() - start).toFixed(2);
      if (error) throw error;

      if (data && data.length) {
        setSalesResult(
          `✅ Satışlar verisi yüklendi (${dur} ms) – ${data.length} kayıt`
        );
      } else {
        setSalesResult(`⚠️ Satışlar verisi boş (${dur} ms) – kayıt bulunamadı`);
      }
    } catch (e: any) {
      setSalesResult(`❌ Satışlar testi hatası: ${e.message}`);
    } finally {
      setLoadingSales(false);
    }
  }

  async function runReportTest() {
    setLoadingReport(true);
    setReportResult(null);
    try {
      const start = performance.now();
      const { data: rehber, error: e0 } = await supabase
        .from("rehberler")
        .select("id")
        .limit(1);

      if (e0) throw e0;
      if (!rehber || rehber.length === 0) {
        setReportResult("⚠️ Rehber bulunamadı – bireysel rapor testi atlandı.");
        return;
      }

      const rehberId = rehber[0].id;
      const { data, error } = await supabase
        .from("satislar_detay_view")
        .select("*")
        .eq("rehber_id", rehberId)
        .limit(500);

      const dur = (performance.now() - start).toFixed(2);
      if (error) throw error;

      if (data && data.length) {
        setReportResult(
          `✅ Bireysel rapor verisi yüklendi (${dur} ms) – ${data.length} kayıt`
        );
      } else {
        setReportResult(`⚠️ Bireysel rapor verisi boş (${dur} ms) – kayıt yok`);
      }
    } catch (e: any) {
      setReportResult(`❌ Bireysel rapor testi hatası: ${e.message}`);
    } finally {
      setLoadingReport(false);
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Sistem Testleri</h1>
      <p className="text-gray-600 mb-8">
        Uygulamanın temel sayfalarının performansını ve veri doğruluğunu burada
        test edebilirsiniz.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LOGIN ------------------------------------------------------ */}
        <Card>
          <CardHeader>
            <CardTitle>Giriş Sayfası Ön Kontrolü</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Giriş için gerekli tabloların ve admin kullanıcısının mevcut olup
              olmadığını denetler.
            </p>
            <Button disabled={loadingLogin} onClick={runLoginTest}>
              {loadingLogin && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Testi Başlat
            </Button>
            {loginResult && <ResultAlert text={loginResult} />}
          </CardContent>
        </Card>

        {/* DASHBOARD -------------------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle>Dashboard Ana Sayfa Testi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Dashboard'da kullanılan ana verilerin yüklenme süresini test eder.
            </p>
            <Button disabled={loadingDash} onClick={runDashTest}>
              {loadingDash && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Testi Başlat
            </Button>
            {dashResult && <ResultAlert text={dashResult} />}
          </CardContent>
        </Card>

        {/* SALES ------------------------------------------------------ */}
        <Card>
          <CardHeader>
            <CardTitle>Satışlar Sayfası Testi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Satışlar sayfası için 1000 satır veri çekilerek performans
              ölçülür.
            </p>
            <Button disabled={loadingSales} onClick={runSalesTest}>
              {loadingSales && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Testi Başlat
            </Button>
            {salesResult && <ResultAlert text={salesResult} />}
          </CardContent>
        </Card>

        {/* REPORTS ---------------------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle>Bireysel Raporlar Sayfası Testi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Bir rehber için 500 satır veri çekilerek rapor sayfası performansı
              ölçülür.
            </p>
            <Button disabled={loadingReport} onClick={runReportTest}>
              {loadingReport && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Testi Başlat
            </Button>
            {reportResult && <ResultAlert text={reportResult} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
