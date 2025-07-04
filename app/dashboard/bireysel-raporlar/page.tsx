"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Users,
  Store,
  Building2,
  Package,
  Download,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { BireyselRaporFilters } from "./components/bireysel-rapor-filters";
import { BireyselRaporStatistics } from "./components/bireysel-rapor-statistics";
import { BireyselRaporChart } from "./components/bireysel-rapor-chart";
import { ComparisonView } from "../analizler/components/comparison-view";

export type AnalysisType =
  | "rehber"
  | "magaza"
  | "firma"
  | "urun"
  | "operator"
  | "tur";
export type ChartType = "bar" | "line" | "pie" | "area" | "donut";
export type MetricType = "totalSales" | "totalAmount" | "paxAverage";

export interface BireyselRaporFiltersType {
  analysisType: AnalysisType;
  chartType: ChartType;
  selectedItems: string[];
  dateRange: {
    start: Date;
    end: Date;
  };
  isComparison: boolean;
  selectedOperators: string[];
  metricType: MetricType;
}

export interface BireyselRaporData {
  id: string;
  name: string;
  totalSales: number;
  totalAmount: number;
  totalCancelledAmount: number;
  totalApprovedAmount: number;
  totalPendingAmount: number;
  averageAmount: number;
  salesCount: number;
  paxTotal: number;
  paxAverage: number;
  data: Array<{
    date: string;
    value: number;
    amount: number;
    pax: number;
  }>;
}

export interface BireyselRaporStatisticsType {
  topPerformer: {
    name: string;
    value: number;
    type: string;
  };
  worstPerformer: {
    name: string;
    value: number;
    type: string;
  };
  average: number;
  total: number;
  growth: number;
  totalItems: number;
}

export default function BireyselRaporlarPage() {
  const { user, userRole } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<BireyselRaporData[]>([]);
  const [statistics, setStatistics] =
    useState<BireyselRaporStatisticsType | null>(null);
  const [viewExists, setViewExists] = useState<boolean | null>(null);
  const [operators, setOperators] = useState<{ id: string; adi: string }[]>([]);
  const [filters, setFilters] = useState<BireyselRaporFiltersType>({
    analysisType: "rehber",
    chartType: "bar",
    selectedItems: [],
    dateRange: {
      start: new Date(new Date().setMonth(new Date().getMonth() - 6)), // Son 6 ay
      end: new Date(),
    },
    isComparison: false,
    selectedOperators: [],
    metricType: "totalSales",
  });

  const checkViewExists = async () => {
    try {
      const { data, error } = await supabase
        .from("satislar_detay_view")
        .select("satis_id")
        .limit(1);
      if (error) {
        console.error("View check error:", error);
        setViewExists(false);
        return false;
      }
      setViewExists(true);
      return true;
    } catch (error) {
      console.error("View check exception:", error);
      setViewExists(false);
      return false;
    }
  };

  const fetchOperators = async () => {
    try {
      const { data, error } = await supabase
        .from("operatorler")
        .select("id, operator_adi")
        .order("operator_adi", { ascending: true });
      if (error) throw error;
      setOperators(
        data ? data.map((op: any) => ({ id: op.id, adi: op.operator_adi })) : []
      );
    } catch (error) {
      console.error("Error fetching operators:", error);
      setOperators([]);
    }
  };

  const fetchAnalysisData = async () => {
    if (!viewExists) return;

    setLoading(true);
    try {
      console.log("Fetching data with filters:", filters);

      // Tarih aralığını ayarla - bitiş tarihine 23:59:59 ekle
      const startDate = new Date(filters.dateRange.start);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(filters.dateRange.end);
      endDate.setHours(23, 59, 59, 999);

      let query = supabase.from("satislar_detay_view").select("*");

      // Hem satis_tarihi hem de magaza_giris_tarihi'ni kontrol et
      query = query.or(
        `satis_tarihi.gte.${
          startDate.toISOString().split("T")[0]
        },magaza_giris_tarihi.gte.${startDate.toISOString().split("T")[0]}`
      );
      query = query.or(
        `satis_tarihi.lte.${
          endDate.toISOString().split("T")[0]
        },magaza_giris_tarihi.lte.${endDate.toISOString().split("T")[0]}`
      );

      if (
        filters.selectedOperators &&
        filters.selectedOperators.length > 0 &&
        filters.selectedOperators[0] !== "all"
      ) {
        query = query.in("operator_id", filters.selectedOperators);
      }

      const { data: salesData, error } = await query;

      if (error) {
        console.error("Query error:", error);
        throw error;
      }

      console.log("Raw data count:", salesData?.length || 0);
      console.log("Sample data:", salesData?.slice(0, 3));

      const groupedData = groupDataByAnalysisType(
        salesData || [],
        filters.analysisType
      );
      const stats = calculateStatistics(groupedData, filters.metricType);

      console.log("Grouped data count:", groupedData.length);
      console.log("Sample grouped data:", groupedData.slice(0, 2));

      setAnalysisData(groupedData);
      setStatistics(stats);
    } catch (error) {
      console.error("Error fetching analysis data:", error);
    } finally {
      setLoading(false);
    }
  };

  const groupDataByAnalysisType = (
    data: any[],
    type: AnalysisType
  ): BireyselRaporData[] => {
    const grouped: { [key: string]: any } = {};

    data.forEach((item) => {
      let key: string;
      let name: string;

      switch (type) {
        case "rehber":
          key = item.rehber_id?.toString() || "unknown";
          name = item.rehber_adi || "Bilinmeyen Rehber";
          break;
        case "magaza":
          key = item.magaza_id?.toString() || "unknown";
          name = item.magaza_adi || "Bilinmeyen Mağaza";
          break;
        case "firma":
          key = item.firma_id?.toString() || "unknown";
          name = item.firma_adi || "Bilinmeyen Firma";
          break;
        case "urun":
          key = item.urun_id?.toString() || "unknown";
          name = item.urun_adi || "Bilinmeyen Ürün";
          break;
        case "operator":
          key = item.operator_id?.toString() || "unknown";
          name = item.operator_adi || "Bilinmeyen Operatör";
          break;
        case "tur":
          key = item.tur_id?.toString() || "unknown";
          name = item.tur_adi || "Bilinmeyen Tur";
          break;
        default:
          key = "unknown";
          name = "Bilinmeyen";
      }

      if (!grouped[key]) {
        grouped[key] = {
          id: key,
          name,
          totalSales: 0,
          totalAmount: 0,
          totalCancelledAmount: 0,
          totalApprovedAmount: 0,
          totalPendingAmount: 0,
          salesCount: 0,
          paxTotal: 0,
          paxAverage: 0,
          data: [],
        };
      }

      const currentItemAmount =
        Number.parseFloat(item.toplam_tutar || item.birim_fiyat * item.adet) ||
        0;

      if (item.status === "iptal") {
        grouped[key].totalCancelledAmount += currentItemAmount;
      } else if (item.status === "onaylandı") {
        grouped[key].totalApprovedAmount += currentItemAmount;
        grouped[key].totalAmount += currentItemAmount;
      } else if (item.status === "beklemede") {
        grouped[key].totalPendingAmount += currentItemAmount;
      }

      const paxCount = Number.parseInt(item.magaza_pax) || 0;

      grouped[key].totalSales += paxCount;
      grouped[key].salesCount += 1;
      grouped[key].paxTotal += paxCount;

      // Tarih için hem satis_tarihi hem de magaza_giris_tarihi'ni kontrol et
      const dateToUse =
        item.satis_tarihi || item.magaza_giris_tarihi || item.created_at;
      const dateKey = new Date(dateToUse).toISOString().split("T")[0];
      const existingDateIndex = grouped[key].data.findIndex(
        (d: any) => d.date === dateKey
      );

      const chartAmount =
        item.status === "onaylandı" || item.status === "beklemede"
          ? currentItemAmount
          : 0;

      if (existingDateIndex >= 0) {
        grouped[key].data[existingDateIndex].value += paxCount;
        grouped[key].data[existingDateIndex].amount += chartAmount;
        grouped[key].data[existingDateIndex].pax += paxCount;
      } else {
        grouped[key].data.push({
          date: dateKey,
          value: paxCount,
          amount: chartAmount,
          pax: paxCount,
        });
      }
    });

    Object.values(grouped).forEach((item: any) => {
      item.totalAmount =
        item.totalCancelledAmount +
        item.totalApprovedAmount +
        item.totalPendingAmount;
      item.averageAmount =
        item.salesCount > 0 ? item.totalAmount / item.salesCount : 0;
      item.paxAverage =
        item.paxTotal > 0 ? item.totalAmount / item.paxTotal : 0;
      item.data.sort(
        (a: any, b: any) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    });

    return Object.values(grouped);
  };

  const calculateStatistics = (
    data: BireyselRaporData[],
    metricType: MetricType
  ): BireyselRaporStatisticsType => {
    if (data.length === 0) {
      return {
        topPerformer: { name: "-", value: 0, type: metricType },
        worstPerformer: { name: "-", value: 0, type: metricType },
        average: 0,
        total: 0,
        growth: 0,
        totalItems: 0,
      };
    }

    let sortedData: BireyselRaporData[] = [];
    let totalValue = 0;
    let averageValue = 0;

    switch (metricType) {
      case "totalSales":
        sortedData = [...data].sort((a, b) => b.totalSales - a.totalSales);
        totalValue = data.reduce((sum, item) => sum + item.totalSales, 0);
        averageValue = data.length > 0 ? totalValue / data.length : 0;
        break;
      case "totalAmount":
        sortedData = [...data].sort((a, b) => b.totalAmount - a.totalAmount);
        totalValue = data.reduce((sum, item) => sum + item.totalAmount, 0);
        averageValue = data.length > 0 ? totalValue / data.length : 0;
        break;
      case "paxAverage":
        sortedData = [...data].sort((a, b) => b.paxAverage - a.paxAverage); // Sort by pax average
        totalValue = data.reduce((sum, item) => sum + item.paxAverage, 0); // Sum of individual pax averages
        averageValue = data.length > 0 ? totalValue / data.length : 0; // Average of individual pax averages
        break;
    }

    return {
      topPerformer: {
        name: sortedData[0]?.name || "-",
        value:
          metricType === "totalSales"
            ? sortedData[0]?.totalSales || 0
            : metricType === "totalAmount"
            ? sortedData[0]?.totalAmount || 0
            : sortedData[0]?.paxAverage || 0,
        type: metricType,
      },
      worstPerformer: {
        name: sortedData[sortedData.length - 1]?.name || "-",
        value:
          metricType === "totalSales"
            ? sortedData[sortedData.length - 1]?.totalSales || 0
            : metricType === "totalAmount"
            ? sortedData[sortedData.length - 1]?.totalAmount || 0
            : sortedData[sortedData.length - 1]?.paxAverage || 0,
        type: metricType,
      },
      average: averageValue,
      total: totalValue,
      growth: 0,
      totalItems: data.length,
    };
  };

  const handleFiltersChange = (
    newFilters: Partial<BireyselRaporFiltersType>
  ) => {
    console.log("Filter change:", newFilters);
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleDownloadPdf = useCallback(async () => {
    setLoading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      const input = document.getElementById("bireysel-raporlar-content");
      if (input) {
        const canvas = await html2canvas(input, { scale: 2 });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(
          `Bireysel_Raporlar_${
            filters.analysisType
          }_${filters.dateRange.start.toLocaleDateString()}_${filters.dateRange.end.toLocaleDateString()}.pdf`
        );
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleRowClick = (id: string, type: AnalysisType) => {
    router.push(`/dashboard/bireysel-raporlar/${id}?type=${type}`);
  };

  useEffect(() => {
    checkViewExists();
    fetchOperators();
  }, []);

  useEffect(() => {
    console.log("Effect triggered with:", {
      viewExists,
      analysisType: filters.analysisType,
      startDate: filters.dateRange.start,
      endDate: filters.dateRange.end,
      selectedOperators: filters.selectedOperators,
      metricType: filters.metricType,
    });

    if (viewExists) {
      fetchAnalysisData();
    }
  }, [
    viewExists,
    filters.analysisType,
    filters.dateRange.start,
    filters.dateRange.end,
    filters.selectedOperators,
    filters.metricType,
  ]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Giriş Yapmanız Gerekiyor</h2>
          <p className="text-muted-foreground">
            Rapor sayfasını görüntülemek için lütfen giriş yapın.
          </p>
        </div>
      </div>
    );
  }

  if (viewExists === false) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Bireysel Raporlar</h1>
            <p className="text-muted-foreground">
              Detaylı bireysel raporlar ve performans analizleri
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Kurulum Gerekli
            </CardTitle>
            <CardDescription>
              Raporlar sayfasını kullanabilmek için önce satışlar detay view'ini
              oluşturmanız gerekiyor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>
                Raporlar sayfası için gerekli veritabanı view'i henüz
                oluşturulmamış.
              </p>
              <div className="flex gap-2">
                <Badge variant="outline">Satışlar Detay View</Badge>
                <Badge variant="destructive">Eksik</Badge>
              </div>
              <div className="pt-4">
                <a
                  href="/sql-scripts/85-recreate-satislar-detay-view-final"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  View'i Oluştur
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (viewExists === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Kontrol Ediliyor...</h2>
          <p className="text-muted-foreground">
            Veritabanı yapısı kontrol ediliyor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sayfa Başlığı */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bireysel Raporlar</h1>
          <CardDescription>
            {filters.dateRange.start.toLocaleDateString()} -{" "}
            {filters.dateRange.end.toLocaleDateString()} performans verileri (
            {filters.metricType === "totalSales" && "Toplam Satış"}
            {filters.metricType === "totalAmount" && "Toplam Tutar"}
            {filters.metricType === "paxAverage" && "Pax Ortalaması"})
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {filters.dateRange.start.toLocaleDateString()} -{" "}
            {filters.dateRange.end.toLocaleDateString()}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            {filters.analysisType === "rehber" && <Users className="h-3 w-3" />}
            {filters.analysisType === "magaza" && <Store className="h-3 w-3" />}
            {filters.analysisType === "firma" && (
              <Building2 className="h-3 w-3" />
            )}
            {filters.analysisType === "urun" && <Package className="h-3 w-3" />}
            {filters.analysisType === "operator" && (
              <Users className="h-3 w-3" />
            )}
            {filters.analysisType === "tur" && <Package className="h-3 w-3" />}
            {filters.analysisType === "rehber" && "Rehber Analizi"}
            {filters.analysisType === "magaza" && "Mağaza Analizi"}
            {filters.analysisType === "firma" && "Firma Analizi"}
            {filters.analysisType === "urun" && "Ürün Analizi"}
            {filters.analysisType === "operator" && "Operatör Analizi"}
            {filters.analysisType === "tur" && "Tur Analizi"}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            {filters.metricType === "totalSales" && "Toplam Satış"}
            {filters.metricType === "totalAmount" && "Toplam Tutar"}
            {filters.metricType === "paxAverage" && "Pax Ortalaması"}
          </Badge>
          <Button onClick={handleDownloadPdf} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            PDF İndir
          </Button>
        </div>
      </div>

      <div id="bireysel-raporlar-content">
        {/* Filtreler */}
        <BireyselRaporFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          loading={loading}
          operators={operators}
        />
        {/* İstatistik Kartları */}
        {statistics && (
          <BireyselRaporStatistics
            statistics={statistics}
            userRole={userRole}
            loading={loading}
          />
        )}
        {/* Ana İçerik */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
            <TabsTrigger value="comparison">Karşılaştırma</TabsTrigger>
            <TabsTrigger value="detailed">Detaylı Analiz</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <BireyselRaporChart
              data={analysisData}
              filters={filters}
              userRole={userRole}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            <ComparisonView
              data={analysisData}
              filters={filters}
              onFiltersChange={handleFiltersChange}
              userRole={userRole}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="detailed" className="space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Detaylı Performans Tablosu</CardTitle>
                  <CardDescription>
                    Tüm {filters.analysisType} verilerinin detaylı analizi
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">
                            {filters.analysisType === "rehber" && "Rehber"}
                            {filters.analysisType === "magaza" && "Mağaza"}
                            {filters.analysisType === "firma" && "Firma"}
                            {filters.analysisType === "urun" && "Ürün"}
                            {filters.analysisType === "operator" && "Operatör"}
                            {filters.analysisType === "tur" && "Tur"}
                          </th>
                          <th className="text-right p-2">Toplam Satış Adedi</th>
                          <th className="text-right p-2">İptal Tutar (€)</th>
                          <th className="text-right p-2">
                            Onaylanan Tutar (€)
                          </th>
                          <th className="text-right p-2">Bekleyen Tutar (€)</th>
                          <th className="text-right p-2">Toplam Tutar (€)</th>
                          <th className="text-right p-2">İşlem Sayısı</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysisData
                          .sort((a, b) => {
                            if (filters.metricType === "totalSales")
                              return b.totalSales - a.totalSales;
                            if (filters.metricType === "totalAmount")
                              return b.totalAmount - a.totalAmount;
                            if (filters.metricType === "paxAverage")
                              return b.paxAverage - a.paxAverage; // Sort by pax average
                            return 0;
                          })
                          .map((item, index) => (
                            <tr
                              key={item.id}
                              className="border-b hover:bg-muted/50 cursor-pointer"
                              onClick={() =>
                                handleRowClick(item.id, filters.analysisType)
                              }
                            >
                              <td className="p-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-muted-foreground">
                                    #{index + 1}
                                  </span>
                                  {item.name}
                                </div>
                              </td>
                              <td className="text-right p-2 font-medium">
                                {item.totalSales.toLocaleString()}
                              </td>
                              <td className="text-right p-2 font-medium">
                                €
                                {item.totalCancelledAmount.toLocaleString(
                                  "tr-TR",
                                  {
                                    minimumFractionDigits: 2,
                                  }
                                )}
                              </td>
                              <td className="text-right p-2 font-medium">
                                €
                                {item.totalApprovedAmount.toLocaleString(
                                  "tr-TR",
                                  {
                                    minimumFractionDigits: 2,
                                  }
                                )}
                              </td>
                              <td className="text-right p-2 font-medium">
                                €
                                {item.totalPendingAmount.toLocaleString(
                                  "tr-TR",
                                  {
                                    minimumFractionDigits: 2,
                                  }
                                )}
                              </td>
                              <td className="text-right p-2 font-medium">
                                €
                                {item.totalAmount.toLocaleString("tr-TR", {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                              <td className="text-right p-2">
                                {item.salesCount}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
