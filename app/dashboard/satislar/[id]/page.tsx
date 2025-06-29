"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface SatisDetay {
  id: number;
  satis_tarihi: string;
  firma_id: number;
  firma_adi: string;
  magaza_id: number;
  magaza_adi: string;
  operator_id: number;
  operator_adi: string;
  rehber_id: number;
  rehber_adi: string;
  tur: string;
  grup_pax: number;
  magaza_pax: number;
  magaza_bildirimi_tutar: number;
  rehber_bildirimi_tutar: number;
  magaza_bildirimi_tarihi: string | null;
  rehber_bildirimi_tarihi: string | null;
  magaza_bildirimi_notu: string | null;
  rehber_bildirimi_notu: string | null;
  tutar_farki: number;
  durum: string;
}

export default function SatisDetayPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [satis, setSatis] = useState<SatisDetay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSatisDetay();
  }, []);

  const fetchSatisDetay = async () => {
    setLoading(true);
    setError(null);
    try {
      // Satış detaylarını getir
      const { data, error } = await supabase
        .from("bildirim_karsilastirma")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error) throw error;

      // Satış detaylarını set et
      setSatis(data);

      // Satış kalemlerini getir (eğer varsa)
      const { data: satisKalemleri, error: satisKalemleriError } =
        await supabase
          .from("satis_kalemleri")
          .select("*")
          .eq("satis_id", params.id);

      // Satış kalemleri tablosu yoksa hata vermeyecek
      if (
        satisKalemleriError &&
        !satisKalemleriError.message.includes("does not exist")
      ) {
        console.error("Satış kalemleri getirme hatası:", satisKalemleriError);
      }
    } catch (error: any) {
      console.error("Satış detayı getirme hatası:", error);
      setError(`Satış detayı getirme hatası: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getDurumBadge = (durum: string) => {
    switch (durum) {
      case "UYUMLU":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" /> Uyumlu
          </Badge>
        );
      case "UYUMSUZ":
        return (
          <Badge className="bg-red-500">
            <XCircle className="h-3 w-3 mr-1" /> Uyumsuz
          </Badge>
        );
      case "REHBER_BILDIRIMI_YOK":
        return (
          <Badge className="bg-yellow-500">
            <AlertCircle className="h-3 w-3 mr-1" /> Rehber Bildirimi Yok
          </Badge>
        );
      case "MAGAZA_BILDIRIMI_YOK":
        return (
          <Badge className="bg-orange-500">
            <AlertCircle className="h-3 w-3 mr-1" /> Mağaza Bildirimi Yok
          </Badge>
        );
      default:
        return <Badge className="bg-gray-500">{durum}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-4 px-4 sm:py-10">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center h-40">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-sm">Yükleniyor...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-4 px-4 sm:py-10">
        <Card>
          <CardContent className="pt-6">
            <div className="bg-red-50 border-red-200 border p-4 rounded-md">
              <h3 className="text-red-800 font-medium text-sm sm:text-base">
                Hata
              </h3>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <Button
                onClick={fetchSatisDetay}
                className="mt-4 w-full sm:w-auto text-sm"
              >
                Yeniden Dene
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!satis) {
    return (
      <div className="container mx-auto py-4 px-4 sm:py-10">
        <Card>
          <CardContent className="pt-6">
            <div className="bg-yellow-50 border-yellow-200 border p-4 rounded-md">
              <h3 className="text-yellow-800 font-medium text-sm sm:text-base">
                Satış Bulunamadı
              </h3>
              <p className="text-yellow-600 text-sm mt-1">
                Bu ID ile bir satış kaydı bulunamadı.
              </p>
              <Button
                onClick={() => router.push("/dashboard/satislar")}
                className="mt-4 w-full sm:w-auto text-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Satışlar Listesine Dön
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-4 sm:py-10">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl">
                Satış #{satis.id}
              </CardTitle>
              <CardDescription className="text-sm">
                {new Date(satis.satis_tarihi).toLocaleDateString("tr-TR")}{" "}
                tarihli satış detayları
              </CardDescription>
            </div>
            <div className="w-full sm:w-auto">{getDurumBadge(satis.durum)}</div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Genel Bilgiler */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">
                  Genel Bilgiler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <dt className="font-medium text-sm">Firma:</dt>
                    <dd className="text-sm">{satis.firma_adi}</dd>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <dt className="font-medium text-sm">Mağaza:</dt>
                    <dd className="text-sm">{satis.magaza_adi}</dd>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <dt className="font-medium text-sm">Operatör:</dt>
                    <dd className="text-sm">{satis.operator_adi}</dd>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <dt className="font-medium text-sm">Rehber:</dt>
                    <dd className="text-sm">{satis.rehber_adi}</dd>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <dt className="font-medium text-sm">Tur:</dt>
                    <dd className="text-sm">{satis.tur}</dd>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <dt className="font-medium text-sm">Grup PAX:</dt>
                    <dd className="text-sm">{satis.grup_pax}</dd>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                    <dt className="font-medium text-sm">Mağaza PAX:</dt>
                    <dd className="text-sm">{satis.magaza_pax}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Bildirim Karşılaştırma */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">
                  Bildirim Karşılaştırma
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Mağaza Bildirimi */}
                  <div className="border rounded-md p-3 sm:p-4">
                    <h3 className="font-medium mb-2 text-sm sm:text-base">
                      Mağaza Bildirimi
                    </h3>
                    <dl className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <dt className="text-sm">Tutar:</dt>
                        <dd className="font-bold text-sm">
                          {satis.magaza_bildirimi_tutar?.toLocaleString(
                            "tr-TR"
                          )}{" "}
                          €
                        </dd>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <dt className="text-sm">Tarih:</dt>
                        <dd className="text-sm">
                          {satis.magaza_bildirimi_tarihi
                            ? new Date(
                                satis.magaza_bildirimi_tarihi
                              ).toLocaleDateString("tr-TR")
                            : "-"}
                        </dd>
                      </div>
                      {satis.magaza_bildirimi_notu && (
                        <div className="mt-2">
                          <dt className="font-medium text-sm">Not:</dt>
                          <dd className="text-xs sm:text-sm mt-1 bg-gray-50 p-2 rounded break-words">
                            {satis.magaza_bildirimi_notu}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* Rehber Bildirimi */}
                  <div className="border rounded-md p-3 sm:p-4">
                    <h3 className="font-medium mb-2 text-sm sm:text-base">
                      Rehber Bildirimi
                    </h3>
                    <dl className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <dt className="text-sm">Tutar:</dt>
                        <dd className="font-bold text-sm">
                          {satis.rehber_bildirimi_tutar?.toLocaleString(
                            "tr-TR"
                          ) || "-"}{" "}
                          €
                        </dd>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <dt className="text-sm">Tarih:</dt>
                        <dd className="text-sm">
                          {satis.rehber_bildirimi_tarihi
                            ? new Date(
                                satis.rehber_bildirimi_tarihi
                              ).toLocaleDateString("tr-TR")
                            : "-"}
                        </dd>
                      </div>
                      {satis.rehber_bildirimi_notu && (
                        <div className="mt-2">
                          <dt className="font-medium text-sm">Not:</dt>
                          <dd className="text-xs sm:text-sm mt-1 bg-gray-50 p-2 rounded break-words">
                            {satis.rehber_bildirimi_notu}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>

                {/* Fark Bilgisi */}
                {satis.durum === "UYUMSUZ" && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <span className="font-medium text-sm">Tutar Farkı:</span>
                      <span className="font-bold text-red-600 text-sm">
                        {satis.tutar_farki?.toLocaleString("tr-TR")} €
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            onClick={() => router.push("/dashboard/satislar")}
            className="w-full sm:w-auto text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Satışlar Listesine Dön
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
