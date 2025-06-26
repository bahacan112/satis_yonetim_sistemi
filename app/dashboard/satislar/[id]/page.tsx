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
  magaza_bildirimi_notu: string | null; // This now comes from satis_aciklamasi in bildirim_karsilastirma view
  rehber_bildirimi_notu: string | null; // This now comes from satis_aciklamasi in bildirim_karsilastirma view
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
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center h-40">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2">Yükleniyor...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="pt-6">
            <div className="bg-red-50 border-red-200 border p-4 rounded-md">
              <h3 className="text-red-800 font-medium">Hata</h3>
              <p className="text-red-600">{error}</p>
              <Button onClick={fetchSatisDetay} className="mt-4">
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
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="pt-6">
            <div className="bg-yellow-50 border-yellow-200 border p-4 rounded-md">
              <h3 className="text-yellow-800 font-medium">Satış Bulunamadı</h3>
              <p className="text-yellow-600">
                Bu ID ile bir satış kaydı bulunamadı.
              </p>
              <Button
                onClick={() => router.push("/dashboard/satislar")}
                className="mt-4"
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
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Satış #{satis.id}</CardTitle>
              <CardDescription>
                {new Date(satis.satis_tarihi).toLocaleDateString("tr-TR")}{" "}
                tarihli satış detayları
              </CardDescription>
            </div>
            <div>{getDurumBadge(satis.durum)}</div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Genel Bilgiler */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Genel Bilgiler</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="font-medium">Firma:</dt>
                    <dd>{satis.firma_adi}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Mağaza:</dt>
                    <dd>{satis.magaza_adi}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Operatör:</dt>
                    <dd>{satis.operator_adi}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Rehber:</dt>
                    <dd>{satis.rehber_adi}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Tur:</dt>
                    <dd>{satis.tur}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Grup PAX:</dt>
                    <dd>{satis.grup_pax}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Mağaza PAX:</dt>
                    <dd>{satis.magaza_pax}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Bildirim Karşılaştırma */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Bildirim Karşılaştırma
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {/* Mağaza Bildirimi */}
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-2">Mağaza Bildirimi</h3>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt>Tutar:</dt>
                        <dd className="font-bold">
                          {satis.magaza_bildirimi_tutar?.toLocaleString(
                            "tr-TR"
                          )}{" "}
                          €
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt>Tarih:</dt>
                        <dd>
                          {satis.magaza_bildirimi_tarihi
                            ? new Date(
                                satis.magaza_bildirimi_tarihi
                              ).toLocaleDateString("tr-TR")
                            : "-"}
                        </dd>
                      </div>
                      {satis.magaza_bildirimi_notu && (
                        <div className="mt-2">
                          <dt className="font-medium">Not:</dt>
                          <dd className="text-sm mt-1 bg-gray-50 p-2 rounded">
                            {satis.magaza_bildirimi_notu}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* Rehber Bildirimi */}
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-2">Rehber Bildirimi</h3>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt>Tutar:</dt>
                        <dd className="font-bold">
                          {satis.rehber_bildirimi_tutar?.toLocaleString(
                            "tr-TR"
                          ) || "-"}{" "}
                          €
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt>Tarih:</dt>
                        <dd>
                          {satis.rehber_bildirimi_tarihi
                            ? new Date(
                                satis.rehber_bildirimi_tarihi
                              ).toLocaleDateString("tr-TR")
                            : "-"}
                        </dd>
                      </div>
                      {satis.rehber_bildirimi_notu && (
                        <div className="mt-2">
                          <dt className="font-medium">Not:</dt>
                          <dd className="text-sm mt-1 bg-gray-50 p-2 rounded">
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
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Tutar Farkı:</span>
                      <span className="font-bold text-red-600">
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
          <Button onClick={() => router.push("/dashboard/satislar")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Satışlar Listesine Dön
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
