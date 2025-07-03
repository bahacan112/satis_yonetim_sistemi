"use client";

import React from "react";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Clock,
  XCircle,
  CheckCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// Types for the data fetched from the view
interface MuhasebeSummaryRow {
  magaza_id: string;
  magaza_adi: string;
  firma_id: string | null; // Added firma_id
  firma_adi: string | null;
  toplam_satis_tutari: number;
  toplam_acente_komisyon_tutari: number;
  toplam_ofis_komisyon_tutari: number;
  bekleyen_satis_tutari: number;
  bekleyen_acente_komisyon_tutari: number;
  bekleyen_ofis_komisyon_tutari: number;
  iptal_satis_tutari: number;
  toplam_acente_tahsilat: number;
  toplam_ofis_tahsilat: number;
  toplam_tahsilat: number;
  kalan_acente_alacagi: number;
  kalan_ofis_alacagi: number;
  kalan_bakiye: number;
  onaylanan_kalem_sayisi: number;
  bekleyen_kalem_sayisi: number;
  iptal_kalem_sayisi: number;
  toplam_kalem_sayisi: number;
}

// New structure for grouped data
interface GroupedFirmaMuhasebe {
  firma_id: string;
  firma_adi: string;
  total_toplam_satis_tutari: number;
  total_toplam_acente_komisyon_tutari: number;
  total_toplam_ofis_komisyon_tutari: number;
  total_bekleyen_satis_tutari: number;
  total_bekleyen_acente_komisyon_tutari: number;
  total_bekleyen_ofis_komisyon_tutari: number;
  total_iptal_satis_tutari: number;
  total_toplam_acente_tahsilat: number;
  total_toplam_ofis_tahsilat: number;
  total_toplam_tahsilat: number;
  total_kalan_acente_alacagi: number;
  total_kalan_ofis_alacagi: number;
  total_kalan_bakiye: number;
  total_onaylanan_kalem_sayisi: number;
  total_bekleyen_kalem_sayisi: number;
  total_iptal_kalem_sayisi: number;
  total_toplam_kalem_sayisi: number;
  magazalar: MuhasebeSummaryRow[]; // Array of individual store summaries
}

export default function MuhasebePage() {
  const router = useRouter();
  const [groupedFirmaData, setGroupedFirmaData] = useState<
    GroupedFirmaMuhasebe[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFirms, setExpandedFirms] = useState<Set<string>>(new Set()); // State for expanded firm IDs

  useEffect(() => {
    fetchSummaryData();
  }, []);

  const fetchSummaryData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: rawMuhasebeData, error: muhasebeError } = await supabase
        .from("magaza_muhasebe_summary_view")
        .select("*");

      if (muhasebeError) throw muhasebeError;

      const groupedByFirma = new Map<string, GroupedFirmaMuhasebe>();

      rawMuhasebeData?.forEach((magazaItem) => {
        const firmaId = magazaItem.firma_id || "no-firma"; // Handle cases where firma_id might be null
        const firmaAdi = magazaItem.firma_adi || "Firma Atanmamış";

        if (!groupedByFirma.has(firmaId)) {
          groupedByFirma.set(firmaId, {
            firma_id: firmaId,
            firma_adi: firmaAdi,
            total_toplam_satis_tutari: 0,
            total_toplam_acente_komisyon_tutari: 0,
            total_toplam_ofis_komisyon_tutari: 0,
            total_bekleyen_satis_tutari: 0,
            total_bekleyen_acente_komisyon_tutari: 0,
            total_bekleyen_ofis_komisyon_tutari: 0,
            total_iptal_satis_tutari: 0,
            total_toplam_acente_tahsilat: 0,
            total_toplam_ofis_tahsilat: 0,
            total_toplam_tahsilat: 0,
            total_kalan_acente_alacagi: 0,
            total_kalan_ofis_alacagi: 0,
            total_kalan_bakiye: 0,
            total_onaylanan_kalem_sayisi: 0,
            total_bekleyen_kalem_sayisi: 0,
            total_iptal_kalem_sayisi: 0,
            total_toplam_kalem_sayisi: 0,
            magazalar: [],
          });
        }

        const firmaEntry = groupedByFirma.get(firmaId)!;
        firmaEntry.magazalar.push(magazaItem);

        // Aggregate totals for the firm
        firmaEntry.total_toplam_satis_tutari += magazaItem.toplam_satis_tutari;
        firmaEntry.total_toplam_acente_komisyon_tutari +=
          magazaItem.toplam_acente_komisyon_tutari;
        firmaEntry.total_toplam_ofis_komisyon_tutari +=
          magazaItem.toplam_ofis_komisyon_tutari;
        firmaEntry.total_bekleyen_satis_tutari +=
          magazaItem.bekleyen_satis_tutari;
        firmaEntry.total_bekleyen_acente_komisyon_tutari +=
          magazaItem.bekleyen_acente_komisyon_tutari;
        firmaEntry.total_bekleyen_ofis_komisyon_tutari +=
          magazaItem.bekleyen_ofis_komisyon_tutari;
        firmaEntry.total_iptal_satis_tutari += magazaItem.iptal_satis_tutari;
        firmaEntry.total_toplam_acente_tahsilat +=
          magazaItem.toplam_acente_tahsilat;
        firmaEntry.total_toplam_ofis_tahsilat +=
          magazaItem.toplam_ofis_tahsilat;
        firmaEntry.total_toplam_tahsilat += magazaItem.toplam_tahsilat;
        firmaEntry.total_kalan_acente_alacagi +=
          magazaItem.kalan_acente_alacagi;
        firmaEntry.total_kalan_ofis_alacagi += magazaItem.kalan_ofis_alacagi;
        firmaEntry.total_kalan_bakiye += magazaItem.kalan_bakiye;
        firmaEntry.total_onaylanan_kalem_sayisi +=
          magazaItem.onaylanan_kalem_sayisi;
        firmaEntry.total_bekleyen_kalem_sayisi +=
          magazaItem.bekleyen_kalem_sayisi;
        firmaEntry.total_iptal_kalem_sayisi += magazaItem.iptal_kalem_sayisi;
        firmaEntry.total_toplam_kalem_sayisi += magazaItem.toplam_kalem_sayisi;
      });

      setGroupedFirmaData(Array.from(groupedByFirma.values()));
    } catch (err: any) {
      console.error("Error fetching muhasebe summary:", err.message);
      setError("Muhasebe özeti yüklenirken bir hata oluştu: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) {
      return groupedFirmaData;
    }
    return groupedFirmaData.filter(
      (firma) =>
        firma.firma_adi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        firma.magazalar.some((magaza) =>
          magaza.magaza_adi.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );
  }, [groupedFirmaData, searchTerm]);

  const calculateOverallTotals = (data: GroupedFirmaMuhasebe[]) => {
    return data.reduce(
      (acc, firma) => {
        acc.totalSales += firma.total_toplam_satis_tutari;
        acc.totalAcenteCommission += firma.total_toplam_acente_komisyon_tutari;
        acc.totalOfficeCommission += firma.total_toplam_ofis_komisyon_tutari;
        acc.totalCollection += firma.total_toplam_tahsilat;
        acc.totalPendingSales += firma.total_bekleyen_satis_tutari;
        acc.totalRemainingBalance += firma.total_kalan_bakiye;
        return acc;
      },
      {
        totalSales: 0,
        totalAcenteCommission: 0,
        totalOfficeCommission: 0,
        totalCollection: 0,
        totalPendingSales: 0,
        totalRemainingBalance: 0,
      }
    );
  };

  const overallTotals = useMemo(
    () => calculateOverallTotals(filteredData),
    [filteredData]
  );

  const toggleFirmExpansion = (firmaId: string) => {
    setExpandedFirms((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(firmaId)) {
        newSet.delete(firmaId);
      } else {
        newSet.add(firmaId);
      }
      return newSet;
    });
  };

  if (loading) {
    return <div className="p-6 text-center">Muhasebe özeti yükleniyor...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Firma Muhasebe Raporu
        </h1>
        <p className="text-gray-600">
          Tüm firmaların ve mağazaların muhasebe özetini görüntüleyin.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Satış</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₺{overallTotals.totalSales.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Onaylanan satışlar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Acente Komisyonu
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₺{overallTotals.totalAcenteCommission.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Onaylanan satışlardan acente payı
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ofis Komisyonu
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₺{overallTotals.totalOfficeCommission.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Onaylanan satışlardan ofis payı
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Toplam Tahsilat
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₺{overallTotals.totalCollection.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Yapılan tüm tahsilatlar
            </p>
          </CardContent>
        </Card>
        <Card className="border-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">
              Bekleyen Satış
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ₺{overallTotals.totalPendingSales.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Onay bekleyen satışlar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Export */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Firma veya mağaza adına göre ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button className="w-full sm:w-auto">
          <Download className="w-4 h-4 mr-2" />
          Dışa Aktar
        </Button>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle>Mağaza Muhasebe Detayları</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Firma / Mağaza</TableHead>
                  <TableHead className="md:w-[150px]">Onaylı Satış</TableHead>
                  <TableHead className="md:w-[150px]">Bekleme Satış</TableHead>
                  <TableHead className="md:w-[150px]">İptal Satış</TableHead>
                  <TableHead className="md:w-[150px]">Acente Hakediş</TableHead>
                  <TableHead className="md:w-[150px]">
                    Bekleme Acente Hakediş
                  </TableHead>
                  <TableHead className="md:w-[150px]">
                    Acente Tahsilat
                  </TableHead>
                  <TableHead className="md:w-[150px]">Ofis Hakediş</TableHead>
                  <TableHead className="md:w-[150px]">Ofis Tahsilat</TableHead>
                  <TableHead className="md:w-[150px]">
                    Kalan Acente Hakedişi
                  </TableHead>
                  <TableHead className="md:w-[150px]">
                    Kalan Ofis Hakedişi
                  </TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={14}
                      className="text-center text-muted-foreground"
                    >
                      Gösterilecek veri bulunamadı.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((firma) => (
                    <React.Fragment key={firma.firma_id}>
                      <TableRow className="bg-gray-50 hover:bg-gray-100">
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFirmExpansion(firma.firma_id)}
                          >
                            {expandedFirms.has(firma.firma_id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">
                          <span className="font-bold text-lg">
                            {firma.firma_adi}
                          </span>
                          <Badge variant="secondary" className="ml-2 text-sm">
                            {firma.magazalar.length} Mağaza
                          </Badge>
                        </TableCell>
                        <TableCell>
                          ₺{firma.total_toplam_satis_tutari.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          ₺{firma.total_bekleyen_satis_tutari.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          ₺{firma.total_iptal_satis_tutari.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          ₺
                          {firma.total_toplam_acente_komisyon_tutari.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          ₺
                          {firma.total_bekleyen_acente_komisyon_tutari.toFixed(
                            2
                          )}
                        </TableCell>
                        <TableCell>
                          ₺{firma.total_toplam_acente_tahsilat.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          ₺{firma.total_toplam_ofis_komisyon_tutari.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          ₺{firma.total_toplam_ofis_tahsilat.toFixed(2)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            firma.total_kalan_acente_alacagi > 0
                              ? "text-red-600"
                              : "text-green-600",
                            "font-semibold"
                          )}
                        >
                          ₺{firma.total_kalan_acente_alacagi.toFixed(2)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            firma.total_kalan_ofis_alacagi > 0
                              ? "text-red-600"
                              : "text-green-600",
                            "font-semibold"
                          )}
                        >
                          ₺{firma.total_kalan_ofis_alacagi.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-1">
                            {firma.total_onaylanan_kalem_sayisi > 0 && (
                              <Badge
                                variant="outline"
                                className="text-green-600 border-green-100"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {firma.total_onaylanan_kalem_sayisi}
                              </Badge>
                            )}
                            {firma.total_bekleyen_kalem_sayisi > 0 && (
                              <Badge
                                variant="outline"
                                className="text-orange-600 border-orange-100"
                              >
                                <Clock className="w-3 h-3 mr-1" />
                                {firma.total_bekleyen_kalem_sayisi}
                              </Badge>
                            )}
                            {firma.total_iptal_kalem_sayisi > 0 && (
                              <Badge
                                variant="outline"
                                className="text-red-600 border-red-100"
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                {firma.total_iptal_kalem_sayisi}
                              </Badge>
                            )}
                            {firma.total_toplam_kalem_sayisi === 0 && (
                              <Badge
                                variant="outline"
                                className="text-gray-600 border-gray-500/10"
                              >
                                Veri Yok
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {/* Firma seviyesinde detay butonu yok, mağazalar için olacak */}
                        </TableCell>
                      </TableRow>

                      {expandedFirms.has(firma.firma_id) &&
                        firma.magazalar.map((magaza, magazaIndex) => (
                          <TableRow
                            key={magaza.magaza_id}
                            className={`hover:bg-gray-200 transition-colors ${
                              magazaIndex % 2 === 0
                                ? "bg-gray-100"
                                : "bg-gray-50"
                            }`}
                          >
                            <TableCell></TableCell>{" "}
                            {/* Empty cell for expand button column */}
                            <TableCell className="pl-8 font-medium text-gray-700">
                              {magaza.magaza_adi}
                            </TableCell>
                            <TableCell>
                              ₺{magaza.toplam_satis_tutari.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              ₺{magaza.bekleyen_satis_tutari.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              ₺{magaza.iptal_satis_tutari.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              ₺{magaza.toplam_acente_komisyon_tutari.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              ₺
                              {magaza.bekleyen_acente_komisyon_tutari.toFixed(
                                2
                              )}
                            </TableCell>
                            <TableCell>
                              ₺{magaza.toplam_acente_tahsilat.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              ₺{magaza.toplam_ofis_komisyon_tutari.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              ₺{magaza.toplam_ofis_tahsilat.toFixed(2)}
                            </TableCell>
                            <TableCell
                              className={cn(
                                magaza.kalan_acente_alacagi > 0
                                  ? "text-red-600"
                                  : "text-green-600",
                                "font-semibold"
                              )}
                            >
                              ₺{magaza.kalan_acente_alacagi.toFixed(2)}
                            </TableCell>
                            <TableCell
                              className={cn(
                                magaza.kalan_ofis_alacagi > 0
                                  ? "text-red-600"
                                  : "text-green-600",
                                "font-semibold"
                              )}
                            >
                              ₺{magaza.kalan_ofis_alacagi.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-center gap-1">
                                {magaza.onaylanan_kalem_sayisi > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="text-green-600 border-green-100"
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    {magaza.onaylanan_kalem_sayisi}
                                  </Badge>
                                )}
                                {magaza.bekleyen_kalem_sayisi > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="text-orange-600 border-orange-100"
                                  >
                                    <Clock className="w-3 h-3 mr-1" />
                                    {magaza.bekleyen_kalem_sayisi}
                                  </Badge>
                                )}
                                {magaza.iptal_kalem_sayisi > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="text-red-600 border-red-100"
                                  >
                                    <XCircle className="w-3 h-3 mr-1" />
                                    {magaza.iptal_kalem_sayisi}
                                  </Badge>
                                )}
                                {magaza.toplam_kalem_sayisi === 0 && (
                                  <Badge
                                    variant="outline"
                                    className="text-gray-600 border-gray-500/10"
                                  >
                                    Veri Yok
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/muhasebe/${magaza.magaza_id}`
                                  )
                                }
                              >
                                Detay
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
