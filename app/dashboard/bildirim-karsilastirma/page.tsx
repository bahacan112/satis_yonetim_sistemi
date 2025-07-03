"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  AlertTriangle,
  CheckCircle,
  Phone,
  Store,
  Filter,
  X,
  Play,
  ExternalLink,
  Eye,
} from "lucide-react";
import Link from "next/link";

interface BildirimKarsilastirma {
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
  magaza_satis_id: number | null;
  rehber_satis_id: number | null;
  magaza_toplam_adet: number;
  magaza_toplam_tutar: number;
  rehber_toplam_adet: number;
  rehber_toplam_tutar: number;
  adet_farki: number;
  tutar_farki: number;
  durum: "UYUMLU" | "UYUMSUZ" | "REHBER_BILDIRIMI_YOK" | "MAGAZA_BILDIRIMI_YOK";
}

interface Filters {
  baslangic_tarihi: string;
  bitis_tarihi: string;
  firma_id: string;
  durum: string;
}

export default function BildirimKarsilastirmaPage() {
  const router = useRouter();
  const { userRole } = useAuth();
  const [karsilastirmalar, setKarsilastirmalar] = useState<
    BildirimKarsilastirma[]
  >([]);
  const [firmalar, setFirmalar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewExists, setViewExists] = useState(true);
  const [debugMode, setDebugMode] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    baslangic_tarihi: "",
    bitis_tarihi: "",
    firma_id: "all",
    durum: "all",
  });

  useEffect(() => {
    checkViewExists();
  }, []);

  useEffect(() => {
    if (viewExists) {
      fetchData();
    }
  }, [viewExists]);

  useEffect(() => {
    if (viewExists) {
      applyFilters();
    }
  }, [filters, viewExists]);

  const checkViewExists = async () => {
    try {
      // View'ın varlığını kontrol et
      const { data, error } = await supabase
        .from("bildirim_karsilastirma")
        .select("satis_tarihi")
        .limit(1);

      if (error && error.message.includes("does not exist")) {
        console.log("View does not exist");
        setViewExists(false);
      } else {
        setViewExists(true);
      }
    } catch (error) {
      console.error("Error checking view:", error);
      setViewExists(false);
    }
  };

  const fetchData = async () => {
    try {
      if (!viewExists) {
        return;
      }

      const { data: karsilastirmaData, error: karsilastirmaError } =
        await supabase
          .from("bildirim_karsilastirma")
          .select("*")
          .order("satis_tarihi", { ascending: false });

      if (karsilastirmaError) throw karsilastirmaError;

      console.log("Karşılaştırma verileri:", karsilastirmaData); // Debug için

      const { data: firmaData, error: firmaError } = await supabase
        .from("firmalar")
        .select("id, firma_adi")
        .order("firma_adi");

      if (firmaError) throw firmaError;

      setKarsilastirmalar(karsilastirmaData || []);
      setFirmalar(firmaData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    try {
      if (!viewExists) {
        return;
      }

      let query = supabase.from("bildirim_karsilastirma").select("*");

      if (filters.baslangic_tarihi) {
        query = query.gte("satis_tarihi", filters.baslangic_tarihi);
      }

      if (filters.bitis_tarihi) {
        query = query.lte("satis_tarihi", filters.bitis_tarihi);
      }

      if (filters.firma_id && filters.firma_id !== "all") {
        query = query.eq("firma_id", Number.parseInt(filters.firma_id));
      }

      if (filters.durum && filters.durum !== "all") {
        query = query.eq("durum", filters.durum);
      }

      query = query.order("satis_tarihi", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      setKarsilastirmalar(data || []);
    } catch (error) {
      console.error("Error applying filters:", error);
    }
  };

  const clearFilters = () => {
    setFilters({
      baslangic_tarihi: "",
      bitis_tarihi: "",
      firma_id: "all",
      durum: "all",
    });
  };

  // Alternatif yöntem - doğrudan satışlar tablosundan arama
  const handleRowClick = async (
    karsilastirma: BildirimKarsilastirma,
    event: React.MouseEvent
  ) => {
    // Event'i durdur ki başka elementler etkilenmesin
    event.preventDefault();
    event.stopPropagation();

    console.log("Satıra tıklandı:", karsilastirma); // Debug için

    try {
      // Aynı tarih, firma, mağaza için satışları bul
      const { data: satislar, error } = await supabase
        .from("satislar")
        .select("id, bildirim_tipi")
        .eq("satis_tarihi", karsilastirma.satis_tarihi)
        .eq("firma_id", karsilastirma.firma_id)
        .eq("magaza_id", karsilastirma.magaza_id);

      if (error) throw error;

      console.log("Bulunan satışlar:", satislar);

      if (satislar && satislar.length > 0) {
        // Önce mağaza bildirimi varsa onu seç
        const magazaSatis = satislar.find((s) => s.bildirim_tipi === "magaza");
        const rehberSatis = satislar.find((s) => s.bildirim_tipi === "rehber");

        const secilenSatis = magazaSatis || rehberSatis;
        if (secilenSatis) {
          const url = `/dashboard/satislar/${secilenSatis.id}`;
          console.log("Yönlendiriliyor:", url);
          router.push(url);
        } else {
          console.log("Uygun satış bulunamadı!");
          alert("Bu kayıt için satış detayı bulunamadı.");
        }
      } else {
        console.log("Satış bulunamadı!");
        alert("Bu kayıt için satış detayı bulunamadı.");
      }
    } catch (error) {
      console.error("Error finding sales:", error);
      alert("Satış detayları yüklenirken hata oluştu.");
    }
  };

  const getDurumBadge = (durum: string) => {
    switch (durum) {
      case "UYUMLU":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Uyumlu
          </Badge>
        );
      case "UYUMSUZ":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Uyumsuz
          </Badge>
        );
      case "REHBER_BILDIRIMI_YOK":
        return (
          <Badge variant="secondary">
            <Store className="w-3 h-3 mr-1" />
            Sadece Mağaza
          </Badge>
        );
      case "MAGAZA_BILDIRIMI_YOK":
        return (
          <Badge variant="secondary">
            <Phone className="w-3 h-3 mr-1" />
            Sadece Rehber
          </Badge>
        );
      default:
        return <Badge variant="outline">Bilinmiyor</Badge>;
    }
  };

  const getUyumsuzlukSayisi = () => {
    return karsilastirmalar.filter((k) => k.durum === "UYUMSUZ").length;
  };

  const getRehberEksikSayisi = () => {
    return karsilastirmalar.filter((k) => k.durum === "REHBER_BILDIRIMI_YOK")
      .length;
  };

  const getMagazaEksikSayisi = () => {
    return karsilastirmalar.filter((k) => k.durum === "MAGAZA_BILDIRIMI_YOK")
      .length;
  };

  if (userRole !== "admin") {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTitle>Yetkisiz Erişim</AlertTitle>
          <AlertDescription>
            Bu sayfaya sadece admin kullanıcılar erişebilir.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!viewExists) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTitle>Veritabanı Yapısı Eksik</AlertTitle>
          <AlertDescription>
            Bildirim karşılaştırma sistemi için gerekli veritabanı yapısı
            bulunamadı. Lütfen önce SQL scriptini çalıştırın.
          </AlertDescription>
        </Alert>
        <div className="mt-4 space-x-2">
          <Button asChild>
            <Link href="/sql-scripts/09-bildirim-sistemi">
              <Play className="mr-2 h-4 w-4" /> SQL Scriptini Çalıştır
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/sql-scripts/09-bildirim-sistemi-guncelleme">
              <Play className="mr-2 h-4 w-4" /> View'ı Güncelle
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="p-6">Yükleniyor...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Bildirim Karşılaştırma
          </h1>
          <p className="text-gray-600">
            Mağaza ve rehber bildirimlerini karşılaştırın ve uyumsuzlukları
            tespit edin
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtrele
          </Button>
          <Button variant="outline" onClick={() => setDebugMode(!debugMode)}>
            <Eye className="w-4 h-4 mr-2" />
            Debug {debugMode ? "Kapat" : "Aç"}
          </Button>
        </div>
      </div>

      {/* Debug Bilgileri */}
      {debugMode && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Debug Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Toplam kayıt:</strong> {karsilastirmalar.length}
              </div>
              <div>
                <strong>View durumu:</strong>{" "}
                {viewExists ? "Mevcut" : "Mevcut değil"}
              </div>
              <div>
                <strong>Not:</strong> View güncellenmemiş. Satış ID'leri
                gelmiyor. Alternatif yöntem kullanılıyor.
              </div>
              <div className="mt-4">
                <Button asChild>
                  <Link href="/sql-scripts/09-bildirim-sistemi-guncelleme">
                    <Play className="mr-2 h-4 w-4" /> View'ı Güncelle
                  </Link>
                </Button>
              </div>
              {karsilastirmalar.length > 0 && (
                <div>
                  <strong>İlk kayıt örneği:</strong>
                  <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto">
                    {JSON.stringify(karsilastirmalar[0], null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {karsilastirmalar.length}
            </div>
            <div className="text-sm text-gray-500">Toplam Ziyaret</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {getUyumsuzlukSayisi()}
            </div>
            <div className="text-sm text-gray-500">Uyumsuz Bildirim</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {getRehberEksikSayisi()}
            </div>
            <div className="text-sm text-gray-500">Rehber Bildirimi Eksik</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {getMagazaEksikSayisi()}
            </div>
            <div className="text-sm text-gray-500">Mağaza Bildirimi Eksik</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtreler */}
      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Filtreler
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Temizle
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label>Başlangıç Tarihi</Label>
                <Input
                  type="date"
                  value={filters.baslangic_tarihi}
                  onChange={(e) =>
                    setFilters({ ...filters, baslangic_tarihi: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Bitiş Tarihi</Label>
                <Input
                  type="date"
                  value={filters.bitis_tarihi}
                  onChange={(e) =>
                    setFilters({ ...filters, bitis_tarihi: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Firma</Label>
                <Select
                  value={filters.firma_id}
                  onValueChange={(value) =>
                    setFilters({ ...filters, firma_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Firmalar</SelectItem>
                    {firmalar.map((firma) => (
                      <SelectItem key={firma.id} value={firma.id.toString()}>
                        {firma.firma_adi}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Durum</Label>
                <Select
                  value={filters.durum}
                  onValueChange={(value) =>
                    setFilters({ ...filters, durum: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Durumlar</SelectItem>
                    <SelectItem value="UYUMLU">Uyumlu</SelectItem>
                    <SelectItem value="UYUMSUZ">Uyumsuz</SelectItem>
                    <SelectItem value="REHBER_BILDIRIMI_YOK">
                      Rehber Bildirimi Yok
                    </SelectItem>
                    <SelectItem value="MAGAZA_BILDIRIMI_YOK">
                      Mağaza Bildirimi Yok
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Bildirim Karşılaştırma Listesi
            <div className="text-sm font-normal text-gray-500 flex items-center">
              <ExternalLink className="w-4 h-4 mr-1" />
              Detay için satıra tıklayın
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {karsilastirmalar.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Henüz bildirim karşılaştırması bulunmuyor. Lütfen önce mağaza ve
              rehber bildirimleri ekleyin.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Firma - Mağaza</TableHead>
                  <TableHead>Operatör</TableHead>
                  <TableHead>Rehber</TableHead>
                  <TableHead>Tur</TableHead>
                  <TableHead>Mağaza Bildirimi</TableHead>
                  <TableHead>Rehber Bildirimi</TableHead>
                  <TableHead>Fark</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {karsilastirmalar.map((karsilastirma, index) => (
                  <TableRow
                    key={index}
                    className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                      karsilastirma.durum === "UYUMSUZ"
                        ? "bg-red-50 hover:bg-red-100"
                        : ""
                    }`}
                    onClick={(e) => handleRowClick(karsilastirma, e)}
                  >
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(
                          karsilastirma.satis_tarihi
                        ).toLocaleDateString("tr-TR")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {karsilastirma.firma_adi}
                        </div>
                        <div className="text-sm text-gray-500">
                          {karsilastirma.magaza_adi}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{karsilastirma.operator_adi || "-"}</TableCell>
                    <TableCell>{karsilastirma.rehber_adi || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {karsilastirma.tur || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Adet: {karsilastirma.magaza_toplam_adet}</div>
                        <div>
                          Tutar: €{karsilastirma.magaza_toplam_tutar.toFixed(2)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Adet: {karsilastirma.rehber_toplam_adet}</div>
                        <div>
                          Tutar: €{karsilastirma.rehber_toplam_tutar.toFixed(2)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div
                          className={
                            karsilastirma.adet_farki !== 0
                              ? "text-red-600 font-medium"
                              : "text-gray-500"
                          }
                        >
                          Adet: {karsilastirma.adet_farki > 0 ? "+" : ""}
                          {karsilastirma.adet_farki}
                        </div>
                        <div
                          className={
                            karsilastirma.tutar_farki !== 0
                              ? "text-red-600 font-medium"
                              : "text-gray-500"
                          }
                        >
                          Tutar: {karsilastirma.tutar_farki > 0 ? "+" : ""}€
                          {karsilastirma.tutar_farki.toFixed(2)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getDurumBadge(karsilastirma.durum)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
