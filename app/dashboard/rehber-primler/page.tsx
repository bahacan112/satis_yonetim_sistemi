"use client";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
} from "lucide-react";

interface RehberPrim {
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
}

interface PrimOzet {
  toplam_onaylanan: number;
  toplam_bekleyen: number;
  toplam_iptal: number;
  adet_onaylanan: number;
  adet_bekleyen: number;
  adet_iptal: number;
}

export default function RehberPrimlerPage() {
  const { userRole, user } = useAuth();
  const [primler, setPrimler] = useState<RehberPrim[]>([]);
  const [filteredPrimler, setFilteredPrimler] = useState<RehberPrim[]>([]);
  const [primOzet, setPrimOzet] = useState<PrimOzet>({
    toplam_onaylanan: 0,
    toplam_bekleyen: 0,
    toplam_iptal: 0,
    adet_onaylanan: 0,
    adet_bekleyen: 0,
    adet_iptal: 0,
  });
  const [loading, setLoading] = useState(true);
  const [userRehberId, setUserRehberId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  // Filtreler
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "onaylandı" | "beklemede" | "iptal"
  >("all");
  const [minAmountFilter, setMinAmountFilter] = useState("");

  useEffect(() => {
    if (user && userRole === "rehber") {
      fetchUserProfile();
    }
  }, [user, userRole]);

  useEffect(() => {
    if (userRehberId) {
      fetchPrimler();
    }
  }, [userRehberId]);

  useEffect(() => {
    applyFilters();
  }, [primler, dateFilter, statusFilter, minAmountFilter]);

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

  const fetchPrimler = async () => {
    try {
      // Mağaza satış kalemlerini detaylı bilgilerle getir (rehber atanmış olanlar)
      const { data, error } = await supabase
        .from("satislar_detay_view")
        .select("*")
        .eq("rehber_id", userRehberId)
        .eq("kaynak_tipi", "MAGAZA") // Sadece mağaza satış kalemleri
        .order("tarih", { ascending: false });

      if (error) throw error;

      const primlerData: RehberPrim[] = (data || []).map((item: any) => ({
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
      }));

      setPrimler(primlerData);
      calculatePrimOzet(primlerData);
    } catch (error: any) {
      console.error("Error fetching primler:", error);
      setMessage(`Prim verileri alınamadı: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const calculatePrimOzet = (data: RehberPrim[]) => {
    const ozet = data.reduce(
      (acc, prim) => {
        if (prim.status === "onaylandı") {
          acc.toplam_onaylanan += prim.toplam_tutar;
          acc.adet_onaylanan += 1;
        } else if (prim.status === "beklemede") {
          acc.toplam_bekleyen += prim.toplam_tutar;
          acc.adet_bekleyen += 1;
        } else if (prim.status === "iptal") {
          acc.toplam_iptal += prim.toplam_tutar;
          acc.adet_iptal += 1;
        }
        return acc;
      },
      {
        toplam_onaylanan: 0,
        toplam_bekleyen: 0,
        toplam_iptal: 0,
        adet_onaylanan: 0,
        adet_bekleyen: 0,
        adet_iptal: 0,
      }
    );

    setPrimOzet(ozet);
  };

  const applyFilters = () => {
    let filtered = [...primler];

    // Tarih filtresi
    if (dateFilter) {
      filtered = filtered.filter((prim) =>
        prim.satis_tarihi.startsWith(dateFilter)
      );
    }

    // Durum filtresi
    if (statusFilter !== "all") {
      filtered = filtered.filter((prim) => prim.status === statusFilter);
    }

    // Minimum tutar filtresi
    if (minAmountFilter) {
      const minAmount = Number.parseFloat(minAmountFilter);
      filtered = filtered.filter((prim) => prim.toplam_tutar >= minAmount);
    }

    setFilteredPrimler(filtered);
  };

  const clearFilters = () => {
    setDateFilter("");
    setStatusFilter("all");
    setMinAmountFilter("");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "onaylandı":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "beklemede":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "iptal":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "onaylandı":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Onaylandı
          </Badge>
        );
      case "beklemede":
        return <Badge variant="secondary">Beklemede</Badge>;
      case "iptal":
        return <Badge variant="destructive">İptal</Badge>;
      default:
        return <Badge variant="outline">Bilinmiyor</Badge>;
    }
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
          <p>Prim verileri yükleniyor...</p>
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Primlerim & Ödemelerim
        </h1>
        <p className="text-gray-600">
          Satışlarınızdan elde ettiğiniz primleri ve ödemeleri görüntüleyin
        </p>
      </div>

      {message && (
        <Alert className="mb-4">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Onaylanan Primler
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              €{primOzet.toplam_onaylanan.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {primOzet.adet_onaylanan} adet satış
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Bekleyen Primler
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              €{primOzet.toplam_bekleyen.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {primOzet.adet_bekleyen} adet satış
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">İptal Edilen</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              €{primOzet.toplam_iptal.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {primOzet.adet_iptal} adet satış
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <Label htmlFor="status-filter">Durum</Label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">Tümü</option>
                <option value="onaylandı">Onaylandı</option>
                <option value="beklemede">Beklemede</option>
                <option value="iptal">İptal</option>
              </select>
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

      {/* Prim Listesi */}
      <Card>
        <CardHeader>
          <CardTitle>
            Prim Detayları ({filteredPrimler.length} kayıt)
            <span className="ml-2 text-lg font-bold text-green-600">
              Toplam: €
              {filteredPrimler
                .filter((p) => p.status === "onaylandı")
                .reduce((sum, p) => sum + p.toplam_tutar, 0)
                .toFixed(2)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPrimler.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Prim kaydı bulunamadı
              </h3>
              <p className="text-gray-500">
                Seçilen filtrelere uygun prim kaydı yok.
              </p>
            </div>
          ) : (
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
                    <TableHead>Durum</TableHead>
                    <TableHead>Açıklama</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrimler.map((prim) => (
                    <TableRow key={prim.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(prim.satis_tarihi).toLocaleDateString(
                            "tr-TR"
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{prim.tur_adi}</div>
                          <div className="text-gray-500">
                            {prim.firma_adi} - {prim.magaza_adi}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {prim.urun_adi}
                      </TableCell>
                      <TableCell>{prim.adet}</TableCell>
                      <TableCell>€{prim.birim_fiyat.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="font-bold text-lg">
                          €{prim.toplam_tutar.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(prim.status)}
                          {getStatusBadge(prim.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-sm text-gray-600">
                          {prim.satis_aciklamasi || "-"}
                        </div>
                      </TableCell>
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
