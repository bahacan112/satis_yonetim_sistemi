"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, XCircle, Filter, RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface RehberSatisDurum {
  id: string;
  satis_id: string;
  urun_adi: string;
  adet: number;
  birim_fiyat: number;
  toplam_tutar: number;
  status: "onaylandı" | "beklemede" | "iptal";
  satis_aciklamasi: string | null;
  satis_tarihi: string;
  firma_adi: string;
  magaza_adi: string;
  tur_adi: string;
  created_at: string;
  updated_at?: string;
}

interface DurumOzet {
  bekleyen_adet: number;
  bekleyen_tutar: number;
  iptal_adet: number;
  iptal_tutar: number;
}

export default function RehberDurumPage() {
  const { userRole, user } = useAuth();
  const [bekleyenSatislar, setBekleyenSatislar] = useState<RehberSatisDurum[]>(
    []
  );
  const [iptalSatislar, setIptalSatislar] = useState<RehberSatisDurum[]>([]);
  const [durumOzet, setDurumOzet] = useState<DurumOzet>({
    bekleyen_adet: 0,
    bekleyen_tutar: 0,
    iptal_adet: 0,
    iptal_tutar: 0,
  });
  const [loading, setLoading] = useState(true);
  const [userRehberId, setUserRehberId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  // Filtreler
  const [dateFilter, setDateFilter] = useState("");
  const [minAmountFilter, setMinAmountFilter] = useState("");
  const [activeTab, setActiveTab] = useState("bekleyen");

  useEffect(() => {
    if (user && userRole === "rehber") {
      fetchUserProfile();
    }
  }, [user, userRole]);

  useEffect(() => {
    if (userRehberId) {
      fetchDurumlar();
    }
  }, [userRehberId]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (!profile?.full_name) {
        setMessage("Profile'ınızda isim bilgisi bulunamadı.");
        return;
      }

      const { data: rehberMatch, error: rehberError } = await supabase
        .from("rehberler")
        .select("id, rehber_adi")
        .ilike("rehber_adi", profile.full_name.trim())
        .single();

      if (rehberError) {
        const { data: similarRehber, error: similarError } = await supabase
          .from("rehberler")
          .select("id, rehber_adi")
          .ilike("rehber_adi", `%${profile.full_name.trim()}%`)
          .limit(1)
          .single();

        if (similarError || !similarRehber) {
          setMessage(
            `Rehber kaydınız bulunamadı. Profile isminiz: ${profile.full_name}`
          );
          return;
        }

        setUserRehberId(similarRehber.id);
      } else {
        setUserRehberId(rehberMatch.id);
      }
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      setMessage(`Profil bilgisi alınamadı: ${error.message}`);
    }
  };

  const fetchDurumlar = async () => {
    try {
      // Bekleyen satışlar (mağaza satış kalemlerine göre)
      const { data: bekleyenData, error: bekleyenError } = await supabase
        .from("satislar_detay_view")
        .select("*")
        .eq("rehber_id", userRehberId)
        .eq("kaynak_tipi", "MAGAZA") // Sadece mağaza satış kalemleri
        .eq("status", "beklemede") // Direkt status
        .order("tarih", { ascending: false });

      if (bekleyenError) throw bekleyenError;

      // İptal edilen satışlar (mağaza satış kalemlerine göre)
      const { data: iptalData, error: iptalError } = await supabase
        .from("satislar_detay_view")
        .select("*")
        .eq("rehber_id", userRehberId)
        .eq("kaynak_tipi", "MAGAZA") // Sadece mağaza satış kalemleri
        .eq("status", "iptal") // Direkt status
        .order("tarih", { ascending: false });

      if (iptalError) throw iptalError;

      const bekleyenSatislarData: RehberSatisDurum[] = (bekleyenData || []).map(
        (item: any) => ({
          id: item.kalem_id, // kalem_id kullan
          satis_id: item.satis_id,
          urun_adi: item.urun_adi || "N/A",
          adet: item.adet || 0, // Direkt adet
          birim_fiyat: item.birim_fiyat || 0, // Direkt birim_fiyat
          toplam_tutar: item.kalem_toplam_tutar || 0, // Hesaplanmış toplam
          status: item.status || "beklemede", // Direkt status
          satis_aciklamasi: item.satis_aciklamasi, // Direkt açıklama
          satis_tarihi: item.tarih || item.created_at,
          firma_adi: item.firma_adi || "N/A",
          magaza_adi: item.magaza_adi || "N/A",
          tur_adi: item.tur_adi || "N/A",
          created_at: item.created_at,
        })
      );

      const iptalSatislarData: RehberSatisDurum[] = (iptalData || []).map(
        (item: any) => ({
          id: item.kalem_id, // kalem_id kullan
          satis_id: item.satis_id,
          urun_adi: item.urun_adi || "N/A",
          adet: item.adet || 0, // Direkt adet
          birim_fiyat: item.birim_fiyat || 0, // Direkt birim_fiyat
          toplam_tutar: item.kalem_toplam_tutar || 0, // Hesaplanmış toplam
          status: item.status || "iptal", // Direkt status
          satis_aciklamasi: item.satis_aciklamasi, // Direkt açıklama
          satis_tarihi: item.tarih || item.created_at,
          firma_adi: item.firma_adi || "N/A",
          magaza_adi: item.magaza_adi || "N/A",
          tur_adi: item.tur_adi || "N/A",
          created_at: item.created_at,
        })
      );

      setBekleyenSatislar(bekleyenSatislarData);
      setIptalSatislar(iptalSatislarData);

      // Özet hesapla
      const ozet: DurumOzet = {
        bekleyen_adet: bekleyenSatislarData.length,
        bekleyen_tutar: bekleyenSatislarData.reduce(
          (sum, item) => sum + item.toplam_tutar,
          0
        ),
        iptal_adet: iptalSatislarData.length,
        iptal_tutar: iptalSatislarData.reduce(
          (sum, item) => sum + item.toplam_tutar,
          0
        ),
      };

      setDurumOzet(ozet);
    } catch (error: any) {
      console.error("Error fetching durumlar:", error);
      setMessage(`Durum verileri alınamadı: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (data: RehberSatisDurum[]) => {
    let filtered = [...data];

    // Tarih filtresi
    if (dateFilter) {
      filtered = filtered.filter((item) =>
        item.satis_tarihi.startsWith(dateFilter)
      );
    }

    // Minimum tutar filtresi
    if (minAmountFilter) {
      const minAmount = Number.parseFloat(minAmountFilter);
      filtered = filtered.filter((item) => item.toplam_tutar >= minAmount);
    }

    return filtered;
  };

  const clearFilters = () => {
    setDateFilter("");
    setMinAmountFilter("");
  };

  const refreshData = () => {
    setLoading(true);
    fetchDurumlar();
    toast({
      title: "Veriler yenilendi",
      description: "Satış durumları güncellendi.",
    });
  };

  const renderTable = (
    data: RehberSatisDurum[],
    emptyMessage: string,
    emptyIcon: React.ReactNode
  ) => {
    const filteredData = applyFilters(data);

    if (filteredData.length === 0) {
      return (
        <div className="text-center py-8">
          {emptyIcon}
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {emptyMessage}
          </h3>
          <p className="text-gray-500">
            {data.length === 0
              ? "Henüz kayıt yok."
              : "Seçilen filtrelere uygun kayıt bulunamadı."}
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarih</TableHead>
              <TableHead>Tur/Firma</TableHead>
              <TableHead>Ürün</TableHead>
              <TableHead>Adet</TableHead>
              <TableHead>Birim Fiyat</TableHead>
              <TableHead>Toplam</TableHead>
              <TableHead>Açıklama</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(item.satis_tarihi).toLocaleDateString("tr-TR")}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium">{item.tur_adi}</div>
                    <div className="text-gray-500">
                      {item.firma_adi} - {item.magaza_adi}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{item.urun_adi}</TableCell>
                <TableCell>{item.adet}</TableCell>
                <TableCell>€{item.birim_fiyat.toFixed(2)}</TableCell>
                <TableCell>
                  <div className="font-bold text-lg">
                    €{item.toplam_tutar.toFixed(2)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs truncate text-sm text-gray-600">
                    {item.satis_aciklamasi || "-"}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  if (userRole !== "rehber") {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Bu sayfa sadece rehber kullanıcıları içindir.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Durum verileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!userRehberId) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            {message || "Rehber bilginiz bulunamadı."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Satış Durumlarım</h1>
          <p className="text-gray-600">
            Bekleyen ve iptal edilen satışlarınızı görüntüleyin
          </p>
        </div>
        <Button onClick={refreshData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Yenile
        </Button>
      </div>

      {message && (
        <Alert className="mb-4">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Bekleyen Satışlar
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              €{durumOzet.bekleyen_tutar.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {durumOzet.bekleyen_adet} adet satış
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              İptal Edilen Satışlar
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              €{durumOzet.iptal_tutar.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {durumOzet.iptal_adet} adet satış
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtreler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtreler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date-filter">Tarih (YYYY-MM)</Label>
              <Input
                id="date-filter"
                type="month"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="amount-filter">Min. Tutar</Label>
              <Input
                id="amount-filter"
                type="number"
                step="0.01"
                value={minAmountFilter}
                onChange={(e) => setMinAmountFilter(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
              >
                Filtreleri Temizle
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bekleyen" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Bekleyen Satışlar ({durumOzet.bekleyen_adet})
          </TabsTrigger>
          <TabsTrigger value="iptal" className="flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            İptal Edilen ({durumOzet.iptal_adet})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bekleyen">
          <Card>
            <CardHeader>
              <CardTitle className="text-yellow-600">
                Bekleyen Satışlar - Toplam: €
                {applyFilters(bekleyenSatislar)
                  .reduce((sum, item) => sum + item.toplam_tutar, 0)
                  .toFixed(2)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderTable(
                bekleyenSatislar,
                "Bekleyen satış bulunamadı",
                <Clock className="w-12 h-12 mx-auto text-yellow-400 mb-4" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="iptal">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">
                İptal Edilen Satışlar - Toplam: €
                {applyFilters(iptalSatislar)
                  .reduce((sum, item) => sum + item.toplam_tutar, 0)
                  .toFixed(2)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderTable(
                iptalSatislar,
                "İptal edilen satış bulunamadı",
                <XCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
