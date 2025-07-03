"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  User,
  Store,
  CheckCircle,
  AlertTriangle,
  Filter,
  X,
  Info,
} from "lucide-react";

interface Satis {
  id: number;
  operator_id: number | null;
  firma_id: number | null;
  grup_gelis_tarihi: string | null;
  magaza_giris_tarihi: string | null;
  grup_pax: number | null;
  magaza_pax: number | null;
  tur_id: number | null;
  rehber_id: number | null;
  magaza_id: number | null;
  created_at: string;
  // Joined relations
  firmalar?: { firma_adi: string };
  magazalar?: { magaza_adi: string };
  operatorler?: { operator_adi: string };
  rehberler?: { rehber_adi: string };
  turlar?: { tur_adi: string };
  magaza_satis_kalemleri?: Array<{
    adet: number;
    birim_fiyat: number;
    created_at: string;
  }>;
  rehber_satis_kalemleri?: Array<{
    adet: number;
    birim_fiyat: number;
    created_at: string;
  }>;
  // Derived properties for comparison logic
  calculated_magaza_tutari?: number;
  calculated_rehber_tutari?: number;
  display_date?: string;
}

interface KarsilastirmaItem {
  satis_id: number;
  satis_bilgisi: {
    satis_tarihi: string;
    tur: string;
    grup_pax: number;
    magaza_pax: number;
    firma_adi: string;
    magaza_adi: string;
    operator_adi: string;
    rehber_adi: string;
  };
  magaza_tutari: number;
  rehber_tutari: number;
  uyumlu: boolean;
  fark: number;
  durum: "uyumlu" | "uyumsuz" | "rehber_yok" | "magaza_yok";
}

interface Rehber {
  id: number;
  rehber_adi: string;
}

export default function RehberBildirimleriPage() {
  const { userRole, user } = useAuth();
  const [satislar, setSatislar] = useState<Satis[]>([]);
  const [rehberler, setRehberler] = useState<Rehber[]>([]);
  const [karsilastirma, setKarsilastirma] = useState<KarsilastirmaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [durumFilter, setDurumFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [userRehberId, setUserRehberId] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (info: string) => {
    console.log("DEBUG:", info);
    setDebugInfo((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${info}`,
    ]);
  };

  useEffect(() => {
    addDebugInfo(
      `Component mounted. User: ${user?.email || "null"}, Role: ${
        userRole || "null"
      }`
    );
    if (user && userRole) {
      fetchUserProfile();
    }
  }, [user, userRole]);

  useEffect(() => {
    addDebugInfo(`UserRehberId changed: ${userRehberId}, Role: ${userRole}`);
    if (userRole === "rehber" && userRehberId) {
      addDebugInfo("Fetching data for rehber user");
      fetchData();
    } else if (userRole !== "rehber" && userRole !== null) {
      addDebugInfo("Fetching data for non-rehber user");
      fetchData();
    } else {
      addDebugInfo("Not fetching data - conditions not met");
    }
  }, [userRehberId, userRole]);

  useEffect(() => {
    createKarsilastirma();
  }, [satislar, durumFilter]);

  const fetchUserProfile = async () => {
    addDebugInfo("Starting fetchUserProfile");
    if (!user) {
      addDebugInfo("No user found");
      return;
    }

    if (userRole !== "rehber") {
      addDebugInfo("User is not rehber, skipping profile fetch");
      setUserRehberId("not-rehber"); // Set a flag to indicate non-rehber user
      return;
    }

    try {
      addDebugInfo(`Fetching profile for user: ${user.id}`);

      // Profile'dan full_name'i al
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      if (error) {
        addDebugInfo(`Profile fetch error: ${error.message}`);
        throw error;
      }

      addDebugInfo(`Profile fetched: ${JSON.stringify(profile)}`);

      if (!profile?.full_name) {
        addDebugInfo("No full_name in profile");
        setUserRehberId(null);
        return;
      }

      // Full name ile rehberler tablosunda eşleşme ara
      const { data: rehberMatch, error: rehberError } = await supabase
        .from("rehberler")
        .select("id, rehber_adi")
        .ilike("rehber_adi", profile.full_name.trim())
        .single();

      if (rehberError) {
        addDebugInfo(`Rehber match error: ${rehberError.message}`);

        // Tam eşleşme bulunamazsa, benzer isim ara
        const { data: similarRehber, error: similarError } = await supabase
          .from("rehberler")
          .select("id, rehber_adi")
          .ilike("rehber_adi", `%${profile.full_name.trim()}%`)
          .limit(1)
          .single();

        if (similarError) {
          addDebugInfo(`Similar rehber search failed: ${similarError.message}`);
          setUserRehberId(null);
          return;
        }

        if (similarRehber) {
          addDebugInfo(
            `Found similar rehber: ${JSON.stringify(similarRehber)}`
          );
          setUserRehberId(similarRehber.id);
        } else {
          addDebugInfo("No matching rehber found");
          setUserRehberId(null);
        }
      } else {
        addDebugInfo(
          `Found exact rehber match: ${JSON.stringify(rehberMatch)}`
        );
        setUserRehberId(rehberMatch.id);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      addDebugInfo(
        `Profile fetch failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      setMessage(
        `Profil bilgisi alınamadı: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const fetchData = async () => {
    addDebugInfo("Starting fetchData");
    try {
      // Önce satislar tablosunun yapısını kontrol edelim
      addDebugInfo("Checking satislar table structure");

      // Rehber kullanıcısı için sadece kendi satışlarını getir
      let satisQuery = supabase.from("satislar").select(`
          id,
          grup_gelis_tarihi,
          magaza_giris_tarihi,
          grup_pax,
          magaza_pax,
          rehber_id,
          magaza_id,
          tur_id,
          operator_id,
          firma_id,
          created_at,
          firmalar (firma_adi),
          magazalar (magaza_adi),
          operatorler (operator_adi),
          rehberler (rehber_adi),
          turlar (tur_adi),
          magaza_satis_kalemleri (adet, birim_fiyat, created_at),
          rehber_satis_kalemleri (adet, birim_fiyat, created_at)
        `);

      // Rehber kullanıcısı ise sadece kendi satışlarını filtrele
      if (
        userRole === "rehber" &&
        userRehberId &&
        userRehberId !== "not-rehber"
      ) {
        addDebugInfo(`Filtering sales for rehber_id: ${userRehberId}`);
        satisQuery = satisQuery.eq("rehber_id", userRehberId);
      } else {
        addDebugInfo("Fetching all sales (admin/standart user)");
      }

      const { data: satisData, error: satisError } = await satisQuery.order(
        "created_at",
        { ascending: false }
      );

      if (satisError) {
        addDebugInfo(`Sales fetch error: ${satisError.message}`);
        throw satisError;
      }

      addDebugInfo(`Sales fetched: ${satisData?.length || 0} records`);

      // Rehberleri getir - rehber kullanıcısı ise sadece kendisini getir
      let rehberQuery = supabase.from("rehberler").select("id, rehber_adi");

      if (
        userRole === "rehber" &&
        userRehberId &&
        userRehberId !== "not-rehber"
      ) {
        addDebugInfo(`Filtering rehberler for id: ${userRehberId}`);
        rehberQuery = rehberQuery.eq("id", userRehberId);
      } else {
        addDebugInfo("Fetching all rehberler");
      }

      const { data: rehberData, error: rehberError } = await rehberQuery.order(
        "rehber_adi"
      );

      if (rehberError) {
        addDebugInfo(`Rehberler fetch error: ${rehberError.message}`);
        throw rehberError;
      }

      addDebugInfo(`Rehberler fetched: ${rehberData?.length || 0} records`);

      if (satisData) {
        const processedSatisData = satisData.map((satis) => {
          const calculated_magaza_tutari =
            satis.magaza_satis_kalemleri?.reduce(
              (sum, item) => sum + (item.adet || 0) * (item.birim_fiyat || 0),
              0
            ) || 0;
          const calculated_rehber_tutari =
            satis.rehber_satis_kalemleri?.reduce(
              (sum, item) => sum + (item.adet || 0) * (item.birim_fiyat || 0),
              0
            ) || 0;

          // Tarih için önce magaza_giris_tarihi, sonra grup_gelis_tarihi, son olarak created_at kullan
          const display_date =
            satis.magaza_giris_tarihi ||
            satis.grup_gelis_tarihi ||
            satis.created_at;

          return {
            ...satis,
            calculated_magaza_tutari,
            calculated_rehber_tutari,
            display_date,
          };
        });
        setSatislar(processedSatisData);
        addDebugInfo(`Processed ${processedSatisData.length} sales records`);
      } else {
        setSatislar([]);
        addDebugInfo("No sales data received");
      }

      setRehberler(rehberData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      addDebugInfo(
        `Data fetch failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      setMessage(
        `Veri çekme hatası: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setLoading(false);
      addDebugInfo("Loading completed");
    }
  };

  const createKarsilastirma = () => {
    addDebugInfo(`Creating karsilastirma with ${satislar.length} sales`);
    const karsilastirmaMap: { [key: string]: KarsilastirmaItem } = {};

    // Tüm satışları grupla (aynı tarih, firma, mağaza, operatör, tur)
    satislar.forEach((satis) => {
      const key = `${satis.display_date}-${satis.firmalar?.firma_adi}-${satis.magazalar?.magaza_adi}-${satis.operatorler?.operator_adi}-${satis.turlar?.tur_adi}`;

      if (!karsilastirmaMap[key]) {
        karsilastirmaMap[key] = {
          satis_id: satis.id,
          satis_bilgisi: {
            satis_tarihi: satis.display_date || "",
            tur: satis.turlar?.tur_adi || "",
            grup_pax: satis.grup_pax || 0,
            magaza_pax: satis.magaza_pax || 0,
            firma_adi: satis.firmalar?.firma_adi || "",
            magaza_adi: satis.magazalar?.magaza_adi || "",
            operator_adi: satis.operatorler?.operator_adi || "",
            rehber_adi: satis.rehberler?.rehber_adi || "",
          },
          magaza_tutari: 0,
          rehber_tutari: 0,
          uyumlu: false,
          fark: 0,
          durum: "magaza_yok",
        };
      }
      // Sum up magaza totals from calculated field
      karsilastirmaMap[key].magaza_tutari +=
        satis.calculated_magaza_tutari || 0;
      // Sum up rehber totals from calculated field
      karsilastirmaMap[key].rehber_tutari +=
        satis.calculated_rehber_tutari || 0;
    });

    // Uyumluluk hesapla
    Object.values(karsilastirmaMap).forEach((item) => {
      item.fark = Math.abs(item.magaza_tutari - item.rehber_tutari);
      item.uyumlu = item.fark < 0.01;

      if (item.magaza_tutari > 0 && item.rehber_tutari > 0) {
        item.durum = item.uyumlu ? "uyumlu" : "uyumsuz";
      } else if (item.magaza_tutari > 0 && item.rehber_tutari === 0) {
        item.durum = "rehber_yok";
      } else if (item.magaza_tutari === 0 && item.rehber_tutari > 0) {
        item.durum = "magaza_yok";
      } else {
        item.durum = "magaza_yok";
      }
    });

    let filteredKarsilastirma = Object.values(karsilastirmaMap);

    // Durum filtresini uygula
    if (durumFilter !== "all") {
      filteredKarsilastirma = filteredKarsilastirma.filter(
        (item) => item.durum === durumFilter
      );
    }

    setKarsilastirma(filteredKarsilastirma);
    addDebugInfo(
      `Karsilastirma created: ${filteredKarsilastirma.length} items`
    );
  };

  const getDurumBadge = (item: KarsilastirmaItem) => {
    switch (item.durum) {
      case "uyumlu":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Uyumlu
          </Badge>
        );
      case "uyumsuz":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Uyumsuz (€{item.fark.toFixed(2)} fark)
          </Badge>
        );
      case "rehber_yok":
        return (
          <Badge variant="secondary">
            <Phone className="w-3 h-3 mr-1" />
            Rehber Bildirimi Yok
          </Badge>
        );
      case "magaza_yok":
        return (
          <Badge variant="secondary">
            <Store className="w-3 h-3 mr-1" />
            Mağaza Bildirimi Yok
          </Badge>
        );
      default:
        return null;
    }
  };

  if (
    userRole !== "admin" &&
    userRole !== "standart" &&
    userRole !== "rehber"
  ) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>Bu sayfaya erişim yetkiniz yok.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (userRole === "rehber" && userRehberId === null && !loading) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Rehber bilginiz bulunamadı. Profile'ınızdaki isim (
            {user?.user_metadata?.full_name || "bilinmiyor"}) ile rehberler
            tablosunda eşleşme bulunamadı. Lütfen sistem yöneticisi ile
            iletişime geçin.
          </AlertDescription>
        </Alert>

        {/* Debug bilgileri */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="w-5 h-5 mr-2" />
              Debug Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm font-mono">
              {debugInfo.map((info, index) => (
                <div key={index} className="text-gray-600">
                  {info}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Veriler yükleniyor...</p>

          {/* Debug bilgileri loading sırasında */}
          <Card className="mt-4 max-w-md">
            <CardHeader>
              <CardTitle className="text-sm">Debug Bilgileri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-xs font-mono text-left">
                {debugInfo.slice(-5).map((info, index) => (
                  <div key={index} className="text-gray-600">
                    {info}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Bekleyen Satışlar filtresi güncellendi: rehber_id atanmış ancak rehber_satis_kalemleri olmayan satışlar.
  const bekleyenSatislar = satislar.filter(
    (satis) =>
      satis.rehber_id !== null && // Rehber atanmış olmalı
      (!satis.rehber_satis_kalemleri ||
        satis.rehber_satis_kalemleri.length === 0) // Rehber satış kalemi olmamalı
  );

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {userRole === "rehber"
              ? "Satış Bildirimlerim"
              : "Rehber Bildirimleri Karşılaştırması"}
          </h1>
          <p className="text-gray-600">
            {userRole === "rehber"
              ? "Size atanan satışlar ve bildirim durumlarınız"
              : "Mağaza satışları ile rehber tarafından bildirilen satış kalemlerini karşılaştırın"}
          </p>
          {(userRole === "standart" || userRole === "rehber") && (
            <p className="text-sm text-green-600 mt-1">
              💡 Rehber bildirimlerinde fiyat bilgilerini görebilirsiniz.
            </p>
          )}
          {userRole === "rehber" &&
            userRehberId &&
            userRehberId !== "not-rehber" && (
              <p className="text-sm text-blue-600 mt-1">
                📋 Sadece size atanan {satislar.length} satış kaydı
                gösteriliyor. (Rehber ID: {userRehberId})
              </p>
            )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtrele
          </Button>
        </div>
      </div>

      {/* Debug bilgileri - sadece development için */}
      {process.env.NODE_ENV === "development" && debugInfo.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="w-5 h-5 mr-2" />
              Debug Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm font-mono max-h-40 overflow-y-auto">
              {debugInfo.map((info, index) => (
                <div key={index} className="text-gray-600">
                  {info}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtreler */}
      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Filtreler
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDurumFilter("all")}
              >
                <X className="w-4 h-4 mr-2" />
                Temizle
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Durum</Label>
                <Select value={durumFilter} onValueChange={setDurumFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tüm Durumlar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Durumlar</SelectItem>
                    <SelectItem value="uyumlu">Uyumlu</SelectItem>
                    <SelectItem value="uyumsuz">Uyumsuz</SelectItem>
                    <SelectItem value="rehber_yok">
                      Rehber Bildirimi Yok
                    </SelectItem>
                    <SelectItem value="magaza_yok">
                      Mağaza Bildirimi Yok
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {message && (
        <Alert className="mb-4">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {/* Bekleyen Satışlar */}
      {bekleyenSatislar.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="w-5 h-5 mr-2" />
              {userRole === "rehber"
                ? `Bildirim Beklenen Satışlarınız (${bekleyenSatislar.length})`
                : `Rehber Satış Kalemi Bekleyen Satışlar (${bekleyenSatislar.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bekleyenSatislar.slice(0, 6).map((satis) => (
                <Card key={satis.id} className="border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <Badge variant="outline">
                          {satis.turlar?.tur_adi || "N/A"}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          #{satis.id}
                        </span>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">
                          {satis.firmalar?.firma_adi}
                        </div>
                        <div className="text-gray-600">
                          {satis.magazalar?.magaza_adi}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        <div>
                          📅{" "}
                          {new Date(
                            satis.display_date || ""
                          ).toLocaleDateString("tr-TR")}
                        </div>
                        <div>
                          👥 Grup: {satis.grup_pax} | Mağaza: {satis.magaza_pax}
                        </div>
                        <div>
                          🎯 Rehber: {satis.rehberler?.rehber_adi || "N/A"}
                        </div>
                        {(userRole === "admin" || userRole === "rehber") && (
                          <div>
                            💰 Mağaza Tutarı: €
                            {satis.calculated_magaza_tutari?.toFixed(2) ||
                              "0.00"}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {bekleyenSatislar.length > 6 && (
              <div className="text-center mt-4">
                <span className="text-sm text-gray-500">
                  ve {bekleyenSatislar.length - 6} satış daha...
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Karşılaştırma Tablosu */}
      <Card>
        <CardHeader>
          <CardTitle>
            {userRole === "rehber"
              ? `Satış Bildirimlerim (${karsilastirma.length})`
              : `Mağaza - Rehber Satış Kalemi Karşılaştırması (${karsilastirma.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {karsilastirma.length === 0 ? (
            <div className="text-center py-8">
              <Phone className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {userRole === "rehber"
                  ? "Henüz size atanan satış yok"
                  : "Henüz karşılaştırılacak satış yok"}
              </h3>
              <p className="text-gray-500">
                {userRole === "rehber"
                  ? "Size atanan satışlar burada görünecek."
                  : "Satış kayıtları ve rehber bildirimleri burada görünecek."}
              </p>
              {userRole === "rehber" && (
                <div className="mt-4 text-sm text-gray-400">
                  <p>Rehber ID: {userRehberId || "Bulunamadı"}</p>
                  <p>Toplam Satış: {satislar.length}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Satış Bilgisi</TableHead>
                    <TableHead>Rehber</TableHead>
                    {(userRole === "admin" || userRole === "rehber") && (
                      <TableHead>Mağaza Tutarı</TableHead>
                    )}
                    {(userRole === "admin" || userRole === "rehber") && (
                      <TableHead>Rehber Tutarı</TableHead>
                    )}
                    <TableHead>Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {karsilastirma.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">#{item.satis_id}</div>
                          <div className="text-sm text-gray-600">
                            {item.satis_bilgisi.firma_adi} -{" "}
                            {item.satis_bilgisi.magaza_adi}
                          </div>
                          <div className="text-xs text-gray-500">
                            📅{" "}
                            {new Date(
                              item.satis_bilgisi.satis_tarihi
                            ).toLocaleDateString("tr-TR")}
                            {item.satis_bilgisi.tur &&
                              ` | ${item.satis_bilgisi.tur}`}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          {item.satis_bilgisi.rehber_adi || "-"}
                        </div>
                      </TableCell>
                      {(userRole === "admin" || userRole === "rehber") && (
                        <TableCell className="font-medium">
                          €{item.magaza_tutari.toFixed(2)}
                        </TableCell>
                      )}
                      {(userRole === "admin" || userRole === "rehber") && (
                        <TableCell className="font-medium">
                          €{item.rehber_tutari.toFixed(2)}
                        </TableCell>
                      )}
                      <TableCell>{getDurumBadge(item)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
