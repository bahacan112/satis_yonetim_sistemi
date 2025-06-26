"use client";
import { useState, useEffect, useCallback, use } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ArrowLeft, Download } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DetailedReportFilters } from "./components/detailed-report-filters";

// Re-use types from parent page or define locally if needed
export type AnalysisType =
  | "rehber"
  | "magaza"
  | "firma"
  | "urun"
  | "operator"
  | "tur";
export type TimeRange =
  | "haftalik"
  | "15gun"
  | "1ay"
  | "3ay"
  | "6ay"
  | "senelik";
export type ChartType = "bar" | "line" | "area" | "pie" | "donut";

export interface DetailedReportFiltersType {
  timeRange: TimeRange;
  selectedOperatorId: string | null;
  selectedProductId: string | null;
  selectedStoreId: string | null;
  dailyChartType: ChartType; // Specific chart type for daily summary
  productChartType: ChartType; // Specific chart type for product summary
  storeChartType: ChartType; // Specific chart type for store summary
}

interface DetailedSalesItem {
  satis_id: string;
  satis_tarihi: string;
  toplam_tutar: number;
  urun_adi: string;
  magaza_adi: string;
  rehber_adi: string;
  operator_adi: string;
  magaza_pax: number;
  grup_pax: number;
  status: "onaylandı" | "beklemede" | "iptal";
  urun_id: string;
  magaza_id: string;
  rehber_id: string;
  operator_id: string;
  firma_id: string;
  firma_adi: string;
}

interface DailySummary {
  date: string;
  totalSales: number;
  totalAmount: number;
  paxTotal: number;
  paxAverage: number;
}

interface ProductSummary {
  urun_adi: string;
  totalSales: number;
  totalAmount: number;
  paxTotal: number;
  paxAverage: number;
}

interface StoreSummary {
  magaza_adi: string;
  totalSales: number;
  totalAmount: number;
  paxTotal: number;
  paxAverage: number;
}

interface OptionType {
  id: string;
  name: string;
}

interface DetailedReportProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    type: AnalysisType;
  }>;
}

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00ff00",
  "#ff00ff",
  "#00ffff",
  "#ff0000",
  "#0000ff",
  "#ffff00",
];

export default function DetailedReportPage({
  params,
  searchParams,
}: DetailedReportProps) {
  const { id } = use(params);
  const { type } = use(searchParams);

  const { userRole } = useAuth();

  const [loading, setLoading] = useState(true);
  const [entityName, setEntityName] = useState("Yükleniyor...");
  const [salesData, setSalesData] = useState<DetailedSalesItem[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary[]>([]);
  const [productSummary, setProductSummary] = useState<ProductSummary[]>([]);
  const [storeSummary, setStoreSummary] = useState<StoreSummary[]>([]);

  const [operatorsOptions, setOperatorsOptions] = useState<OptionType[]>([]);
  const [productsOptions, setProductsOptions] = useState<OptionType[]>([]);
  const [storesOptions, setStoresOptions] = useState<OptionType[]>([]);

  const [filters, setFilters] = useState<DetailedReportFiltersType>({
    timeRange: "1ay",
    selectedOperatorId: null,
    selectedProductId: null,
    selectedStoreId: null,
    dailyChartType: "bar", // Default for daily summary
    productChartType: "bar", // Default for product summary
    storeChartType: "bar", // Default for store summary
  });

  const calculateDateRange = useCallback((timeRange: TimeRange) => {
    const end = new Date();
    const start = new Date();

    switch (timeRange) {
      case "haftalik":
        start.setDate(end.getDate() - 7);
        break;
      case "15gun":
        start.setDate(end.getDate() - 15);
        break;
      case "1ay":
        start.setMonth(end.getMonth() - 1);
        break;
      case "3ay":
        start.setMonth(end.getMonth() - 3);
        break;
      case "6ay":
        start.setMonth(end.getMonth() - 6);
        break;
      case "senelik":
        start.setFullYear(end.getFullYear() - 1);
        break;
    }
    return { start, end };
  }, []);

  const processSalesData = useCallback(
    (data: DetailedSalesItem[], role: string | null) => {
      const daily: { [key: string]: DailySummary } = {};
      const products: { [key: string]: ProductSummary } = {};
      const stores: { [key: string]: StoreSummary } = {};

      data.forEach((item) => {
        // Sadece 'onaylandı' statüsündeki satışları grafik/özet hesaplamalarına dahil et
        if (item.status !== "onaylandı") return;

        const saleDate = new Date(item.satis_tarihi);
        const dayKey = `${saleDate.getFullYear()}-${(saleDate.getMonth() + 1)
          .toString()
          .padStart(2, "0")}-${saleDate.getDate().toString().padStart(2, "0")}`;

        const amount =
          Number.parseFloat(item.toplam_tutar?.toString() || "0") || 0;
        const finalAmountForCharts = amount;

        const paxCount =
          Number.parseInt(item.magaza_pax?.toString() || "0") || 0;

        // Daily Summary
        if (!daily[dayKey]) {
          daily[dayKey] = {
            date: dayKey,
            totalSales: 0,
            totalAmount: 0,
            paxTotal: 0,
            paxAverage: 0,
          };
        }
        daily[dayKey].totalSales += 1;
        daily[dayKey].totalAmount += finalAmountForCharts;
        daily[dayKey].paxTotal += paxCount;

        // Product Summary
        const productName = item.urun_adi || "Bilinmeyen Ürün";
        if (!products[productName]) {
          products[productName] = {
            urun_adi: productName,
            totalSales: 0,
            totalAmount: 0,
            paxTotal: 0,
            paxAverage: 0,
          };
        }
        products[productName].totalSales += 1;
        products[productName].totalAmount += finalAmountForCharts;
        products[productName].paxTotal += paxCount;

        // Store Summary
        const storeName = item.magaza_adi || "Bilinmeyen Mağaza";
        if (!stores[storeName]) {
          stores[storeName] = {
            magaza_adi: storeName,
            totalSales: 0,
            totalAmount: 0,
            paxTotal: 0,
            paxAverage: 0,
          };
        }
        stores[storeName].totalSales += 1;
        stores[storeName].totalAmount += finalAmountForCharts;
        stores[storeName].paxTotal += paxCount;
      });

      // Calculate averages
      Object.values(daily).forEach((item) => {
        item.paxAverage =
          item.paxTotal > 0 ? item.totalAmount / item.paxTotal : 0;
      });

      Object.values(products).forEach((item) => {
        item.paxAverage =
          item.paxTotal > 0 ? item.totalAmount / item.paxTotal : 0;
      });

      Object.values(stores).forEach((item) => {
        item.paxAverage =
          item.paxTotal > 0 ? item.totalAmount / item.paxTotal : 0;
      });

      setDailySummary(
        Object.values(daily).sort((a, b) => a.date.localeCompare(b.date))
      );
      setProductSummary(
        Object.values(products).sort((a, b) => b.totalAmount - a.totalAmount)
      );
      setStoreSummary(
        Object.values(stores).sort((a, b) => b.totalAmount - a.totalAmount)
      );
    },
    []
  );

  const fetchFilterOptions = useCallback(async () => {
    try {
      const [operatorsRes, productsRes, storesRes] = await Promise.all([
        supabase
          .from("operatorler")
          .select("id, operator_adi")
          .order("operator_adi", { ascending: true }),
        supabase
          .from("urunler")
          .select("id, urun_adi")
          .order("urun_adi", { ascending: true }),
        supabase
          .from("magazalar")
          .select("id, magaza_adi")
          .order("magaza_adi", { ascending: true }),
      ]);

      if (operatorsRes.error) throw operatorsRes.error;
      if (productsRes.error) throw productsRes.error;
      if (storesRes.error) throw storesRes.error;

      setOperatorsOptions(
        operatorsRes.data?.map((op) => ({
          id: op.id,
          name: op.operator_adi,
        })) || []
      );
      setProductsOptions(
        productsRes.data?.map((p) => ({ id: p.id, name: p.urun_adi })) || []
      );
      setStoresOptions(
        storesRes.data?.map((s) => ({ id: s.id, name: s.magaza_adi })) || []
      );
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  }, []);

  const fetchDetailedData = useCallback(async () => {
    setLoading(true);
    try {
      let filterColumn: string;
      let nameColumn: string;

      switch (type) {
        case "rehber":
          filterColumn = "rehber_id";
          nameColumn = "rehber_adi";
          break;
        case "magaza":
          filterColumn = "magaza_id";
          nameColumn = "magaza_adi";
          break;
        case "firma":
          filterColumn = "firma_id";
          nameColumn = "firma_adi";
          break;
        case "urun":
          filterColumn = "urun_id";
          nameColumn = "urun_adi";
          break;
        case "operator":
          filterColumn = "operator_id";
          nameColumn = "operator_adi";
          break;
        case "tur":
          filterColumn = "tur_id";
          nameColumn = "tur_adi";
          break;
        default:
          console.error("Invalid analysis type:", type);
          setLoading(false);
          return;
      }

      const dateRange = calculateDateRange(filters.timeRange);

      let query = supabase
        .from("satislar_detay_view")
        .select("*")
        .eq(filterColumn, id)
        .gte("satis_tarihi", dateRange.start.toISOString())
        .lte("satis_tarihi", dateRange.end.toISOString());

      if (filters.selectedOperatorId) {
        query = query.eq("operator_id", filters.selectedOperatorId);
      }
      if (filters.selectedProductId) {
        query = query.eq("urun_id", filters.selectedProductId);
      }
      if (filters.selectedStoreId) {
        query = query.eq("magaza_id", filters.selectedStoreId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setSalesData(data || []);

      // Determine entity name from the first item or by fetching from respective table
      if (data && data.length > 0) {
        setEntityName((data[0] as any)?.[nameColumn] || "Bilinmeyen");
      } else {
        // If no sales data, try to fetch the entity name directly
        let nameFetchQuery;
        switch (type) {
          case "rehber":
            nameFetchQuery = supabase
              .from("rehberler")
              .select("rehber_adi")
              .eq("id", id)
              .single();
            break;
          case "magaza":
            nameFetchQuery = supabase
              .from("magazalar")
              .select("magaza_adi")
              .eq("id", id)
              .single();
            break;
          case "firma":
            nameFetchQuery = supabase
              .from("firmalar")
              .select("firma_adi")
              .eq("id", id)
              .single();
            break;
          case "urun":
            nameFetchQuery = supabase
              .from("urunler")
              .select("urun_adi")
              .eq("id", id)
              .single();
            break;
          case "operator":
            nameFetchQuery = supabase
              .from("operatorler")
              .select("operator_adi")
              .eq("id", id)
              .single();
            break;
          case "tur":
            nameFetchQuery = supabase
              .from("turlar")
              .select("tur_adi")
              .eq("id", id)
              .single();
            break;
          default:
            break;
        }
        if (nameFetchQuery) {
          const { data: nameData, error: nameError } = await nameFetchQuery;
          if (nameData && !nameError) {
            setEntityName((nameData as any)?.[nameColumn] || "Bilinmeyen");
          } else {
            setEntityName("Bilinmeyen");
          }
        } else {
          setEntityName("Bilinmeyen");
        }
      }

      // Process data for charts and tables
      processSalesData(data || [], userRole);
    } catch (error) {
      console.error("Error fetching detailed sales data:", error);
      setSalesData([]);
      setEntityName("Veri Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [id, type, userRole, filters, calculateDateRange, processSalesData]);

  const getTitle = () => {
    switch (type) {
      case "rehber":
        return "Rehber";
      case "magaza":
        return "Mağaza";
      case "firma":
        return "Firma";
      case "urun":
        return "Ürün";
      case "operator":
        return "Operatör";
      case "tur":
        return "Tur";
      default:
        return "Detaylı";
    }
  };

  const handleFiltersChange = useCallback(
    (newFilters: Partial<DetailedReportFiltersType>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  const handleDownloadPdf = useCallback(() => {
    const printContent = document.getElementById("detailed-report-content");
    if (!printContent) {
      alert("Yazdırılacak içerik bulunamadı.");
      return;
    }

    const originalBody = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;

    window.print();

    setTimeout(() => {
      document.body.innerHTML = originalBody;
      window.location.reload();
    }, 100);
  }, []);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    fetchDetailedData();
  }, [fetchDetailedData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const getAmountsByStatus = (sale: DetailedSalesItem, role: string | null) => {
    const total = Number.parseFloat(sale.toplam_tutar?.toString() || "0") || 0;
    let approvedAmount = 0;
    let cancelledAmount = 0;

    if (role === "admin") {
      if (sale.status === "iptal") {
        cancelledAmount = total;
      } else {
        approvedAmount = total;
      }
    }
    return { approvedAmount, cancelledAmount };
  };

  const totalApprovedAmountSum = salesData.reduce((sum, sale) => {
    const { approvedAmount } = getAmountsByStatus(sale, userRole);
    return sum + approvedAmount;
  }, 0);

  const totalCancelledAmountSum = salesData.reduce((sum, sale) => {
    const { cancelledAmount } = getAmountsByStatus(sale, userRole);
    return sum + cancelledAmount;
  }, 0);

  const totalPaxSum = salesData.reduce((sum, sale) => {
    return sum + (Number.parseInt(sale.magaza_pax?.toString() || "0") || 0);
  }, 0);

  const totalGroupPaxSum = salesData.reduce((sum, sale) => {
    return sum + (Number.parseInt(sale.grup_pax?.toString() || "0") || 0);
  }, 0);

  const renderChart = (data: any[], chartType: ChartType, dataKeyX: string) => {
    if (!data || data.length === 0) {
      return (
        <div className="h-48 flex items-center justify-center text-muted-foreground">
          Grafik verisi bulunamadı.
        </div>
      );
    }

    const chartProps = {
      width: "100%",
      height: 300,
    };

    const formatter = (value: any, name: string) => {
      if (name === "Toplam Tutar")
        return [
          `€${value.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`,
          name,
        ];
      if (name === "Pax Ortalaması") return [`€${value.toFixed(2)}`, name];
      return [value.toLocaleString("tr-TR"), name];
    };

    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer {...chartProps}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey={dataKeyX}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip formatter={formatter} />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="totalAmount"
                fill="#8884d8"
                name="Toplam Tutar"
              />
              <Bar
                yAxisId="right"
                dataKey="paxTotal"
                fill="#82ca9d"
                name="Toplam Pax Sayısı"
              />
            </BarChart>
          </ResponsiveContainer>
        );
      case "line":
        return (
          <ResponsiveContainer {...chartProps}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey={dataKeyX}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip formatter={formatter} />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="totalAmount"
                stroke="#8884d8"
                name="Toplam Tutar"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="paxTotal"
                stroke="#82ca9d"
                name="Toplam Pax Sayısı"
              />
            </LineChart>
          </ResponsiveContainer>
        );
      case "area":
        return (
          <ResponsiveContainer {...chartProps}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey={dataKeyX}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip formatter={formatter} />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="totalAmount"
                stroke="#8884d8"
                fill="#8884d8"
                name="Toplam Tutar"
                fillOpacity={0.3}
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="paxTotal"
                stroke="#82ca9d"
                fill="#82ca9d"
                name="Toplam Pax Sayısı"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      case "pie":
      case "donut":
        return (
          <ResponsiveContainer {...chartProps}>
            <PieChart>
              <Pie
                data={data.map((item) => ({
                  name: item[dataKeyX],
                  value: item.totalAmount,
                }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} (${((percent || 0) * 100).toFixed(0)}%)`
                }
                outerRadius={chartType === "donut" ? 120 : 140}
                innerRadius={chartType === "donut" ? 60 : 0}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => [
                  `€${value.toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                  })}`,
                  "Toplam Tutar",
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/bireysel-raporlar">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Geri Dön
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{getTitle()} Performans Detayı</h1>
          <p className="text-muted-foreground">
            {entityName} için detaylı satış ve performans analizi
          </p>
        </div>
        <Button onClick={handleDownloadPdf} disabled={loading}>
          <Download className="h-4 w-4 mr-2" />
          PDF İndir
        </Button>
      </div>

      <DetailedReportFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        loading={loading}
        operators={operatorsOptions}
        products={productsOptions}
        stores={storesOptions}
      />

      <div id="detailed-report-content">
        {salesData.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Veri Bulunamadı</CardTitle>
              <CardDescription>
                Seçilen kriterlere uygun satış verisi bulunamadı.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                Detaylı rapor için veri bulunamadı.
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Günlük Satış Performansı</CardTitle>
                <CardDescription>
                  Zamana göre toplam satış tutarı ve pax sayısı
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={filters.dailyChartType}
                  onValueChange={(value) =>
                    handleFiltersChange({ dailyChartType: value as ChartType })
                  }
                  className="mb-4"
                >
                  <TabsList>
                    <TabsTrigger value="bar">Çubuk Grafik</TabsTrigger>
                    <TabsTrigger value="line">Çizgi Grafik</TabsTrigger>
                    <TabsTrigger value="area">Alan Grafik</TabsTrigger>
                    <TabsTrigger value="pie">Pasta Grafik</TabsTrigger>
                    <TabsTrigger value="donut">Halka Grafik</TabsTrigger>
                  </TabsList>
                </Tabs>
                {renderChart(dailySummary, filters.dailyChartType, "date")}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ürün Bazında Satışlar</CardTitle>
                <CardDescription>
                  En çok satan ürünler ve katkıları
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={filters.productChartType}
                  onValueChange={(value) =>
                    handleFiltersChange({
                      productChartType: value as ChartType,
                    })
                  }
                  className="mb-4"
                >
                  <TabsList>
                    <TabsTrigger value="bar">Çubuk Grafik</TabsTrigger>
                    <TabsTrigger value="line">Çizgi Grafik</TabsTrigger>
                    <TabsTrigger value="area">Alan Grafik</TabsTrigger>
                    <TabsTrigger value="pie">Pasta Grafik</TabsTrigger>
                    <TabsTrigger value="donut">Halka Grafik</TabsTrigger>
                  </TabsList>
                </Tabs>
                {renderChart(
                  productSummary,
                  filters.productChartType,
                  "urun_adi"
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mağaza Bazında Satışlar</CardTitle>
                <CardDescription>
                  Satışların yapıldığı mağazaların performansı
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={filters.storeChartType}
                  onValueChange={(value) =>
                    handleFiltersChange({ storeChartType: value as ChartType })
                  }
                  className="mb-4"
                >
                  <TabsList>
                    <TabsTrigger value="bar">Çubuk Grafik</TabsTrigger>
                    <TabsTrigger value="line">Çizgi Grafik</TabsTrigger>
                    <TabsTrigger value="area">Alan Grafik</TabsTrigger>
                    <TabsTrigger value="pie">Pasta Grafik</TabsTrigger>
                    <TabsTrigger value="donut">Halka Grafik</TabsTrigger>
                  </TabsList>
                </Tabs>
                {renderChart(
                  storeSummary,
                  filters.storeChartType,
                  "magaza_adi"
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tüm Satış Detayları</CardTitle>
                <CardDescription>
                  Seçilen {getTitle().toLowerCase()} için tüm satış kayıtları
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Satış Tarihi</TableHead>
                        <TableHead>Ürün Adı</TableHead>
                        <TableHead>Mağaza Adı</TableHead>
                        <TableHead>Rehber Adı</TableHead>
                        <TableHead>Operatör Adı</TableHead>
                        <TableHead className="text-right">Pax Sayısı</TableHead>
                        <TableHead className="text-right">
                          Grup Pax Sayısı
                        </TableHead>
                        {userRole === "admin" && (
                          <TableHead className="text-right">
                            İptal Tutar (€)
                          </TableHead>
                        )}
                        {userRole === "admin" && (
                          <TableHead className="text-right">
                            Toplam Tutar (€)
                          </TableHead>
                        )}
                        {userRole === "admin" && (
                          <TableHead className="text-right">
                            Pax Ortalaması (€)
                          </TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesData.map((sale, index) => (
                        <TableRow key={`${sale.satis_id}-${index}`}>
                          <TableCell>
                            {new Date(sale.satis_tarihi).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{sale.urun_adi}</TableCell>
                          <TableCell>{sale.magaza_adi}</TableCell>
                          <TableCell>{sale.rehber_adi}</TableCell>
                          <TableCell>
                            {sale.operator_adi || "Bilinmeyen Operatör"}
                          </TableCell>
                          <TableCell className="text-right">
                            {sale.magaza_pax}
                          </TableCell>
                          <TableCell className="text-right">
                            {sale.grup_pax || 0}
                          </TableCell>
                          {userRole === "admin" && (
                            <TableCell className="text-right">
                              €
                              {getAmountsByStatus(
                                sale,
                                userRole
                              ).cancelledAmount.toLocaleString("tr-TR", {
                                minimumFractionDigits: 2,
                              })}
                            </TableCell>
                          )}
                          {userRole === "admin" && (
                            <TableCell className="text-right">
                              €
                              {getAmountsByStatus(
                                sale,
                                userRole
                              ).approvedAmount.toLocaleString("tr-TR", {
                                minimumFractionDigits: 2,
                              })}
                            </TableCell>
                          )}
                          {userRole === "admin" && (
                            <TableCell className="text-right">
                              €
                              {sale.magaza_pax > 0
                                ? (
                                    Number.parseFloat(
                                      sale.toplam_tutar.toString()
                                    ) / sale.magaza_pax
                                  ).toFixed(2)
                                : "0.00"}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                      <TableRow className="font-bold bg-muted/50">
                        <TableCell colSpan={4}>Toplam</TableCell>
                        <TableCell className="text-right"></TableCell>
                        <TableCell className="text-right">
                          {totalPaxSum.toLocaleString("tr-TR")}
                        </TableCell>
                        <TableCell className="text-right">
                          {totalGroupPaxSum.toLocaleString("tr-TR")}
                        </TableCell>
                        {userRole === "admin" && (
                          <TableCell className="text-right">
                            €
                            {totalCancelledAmountSum.toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            })}
                          </TableCell>
                        )}
                        {userRole === "admin" && (
                          <TableCell className="text-right">
                            €
                            {totalApprovedAmountSum.toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            })}
                          </TableCell>
                        )}
                        {userRole === "admin" && (
                          <TableCell className="text-right">
                            €
                            {(totalPaxSum > 0
                              ? totalApprovedAmountSum / totalPaxSum
                              : 0
                            ).toFixed(2)}
                          </TableCell>
                        )}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
