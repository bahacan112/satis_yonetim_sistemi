"use client";

import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Building2,
  Store,
  ShoppingCart,
  BookOpen,
  Calculator,
  Clock,
  XCircle,
  BarChart3,
  PieChart,
  Award,
  MapPin,
  User,
  CalendarIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { format, subYears } from "date-fns";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { SalesListDialog } from "@/components/dialogs/sales-list-dialog";
import { redirect } from "next/navigation"; // redirect import edildi

interface SalesItem {
  id: string;
  magaza_giris_tarihi: string;
  tur_adi: string;
  magaza_adi: string;
  firma_adi: string;
  rehber_adi: string;
  operator_adi: string;
  urun_adi: string;
  adet: number;
  birim_fiyat: number;
  status: string;
  satis_aciklamasi?: string;
  acente_komisyonu: number;
  ofis_komisyonu: number;
}

interface TopItem {
  name: string;
  total: number;
  count: number;
}

interface ChartData {
  date: string;
  amount: number;
  commission: number;
}

type SortField = "date" | "store" | "tour" | "product" | "amount";
type SortDirection = "asc" | "desc";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF7C7C",
];

export default function DashboardPage() {
  const { user, userRole, loading } = useAuth();
  const [pendingSales, setPendingSales] = useState<SalesItem[]>([]);
  const [cancelledSales, setCancelledSales] = useState<SalesItem[]>([]);
  const [salesChartData, setSalesChartData] = useState<ChartData[]>([]);
  const [commissionChartData, setCommissionChartData] = useState<ChartData[]>(
    []
  );
  const [topRehbers, setTopRehbers] = useState<TopItem[]>([]);
  const [topTours, setTopTours] = useState<TopItem[]>([]);
  const [topStores, setTopStores] = useState<TopItem[]>([]);
  const [topFirms, setTopFirms] = useState<TopItem[]>([]);

  // Satış grafiği için tarih aralığı - Son 1 yıl varsayılan
  const [salesDateRange, setSalesDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: subYears(new Date(), 1),
    to: new Date(),
  });

  // Komisyon grafiği için tarih aralığı - Son 1 yıl varsayılan
  const [commissionDateRange, setCommissionDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: subYears(new Date(), 1),
    to: new Date(),
  });

  const [chartPeriod, setChartPeriod] = useState<"month" | "year">("month");
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // Sıralama state'leri
  const [pendingSortField, setPendingSortField] = useState<SortField>("date");
  const [pendingSortDirection, setPendingSortDirection] =
    useState<SortDirection>("asc"); // En eski tarih ilk sırada
  const [cancelledSortField, setCancelledSortField] =
    useState<SortField>("date");
  const [cancelledSortDirection, setCancelledSortDirection] =
    useState<SortDirection>("desc");

  // Diyalog kutuları için state'ler
  const [showPendingDialog, setShowPendingDialog] = useState(false);
  const [showCancelledDialog, setShowCancelledDialog] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (user && (userRole === "admin" || userRole === "standart")) {
      loadDashboardData();
    }
  }, [user, userRole, salesDateRange, commissionDateRange, chartPeriod]);

  const loadDashboardData = async () => {
    setDashboardLoading(true);
    try {
      await Promise.all([
        loadPendingSales(),
        loadCancelledSales(),
        loadChartData(),
        loadTopPerformers(),
      ]);
    } catch (error) {
      console.error("Dashboard veri yükleme hatası:", error);
    } finally {
      setDashboardLoading(false);
    }
  };

  const loadPendingSales = async () => {
    const { data, error } = await supabase
      .from("satis_kalemleri_detay_view")
      .select("*")
      .eq("status", "beklemede")
      .order("magaza_giris_tarihi", { ascending: true }) // En eski tarih ilk sırada
      .limit(10);

    if (!error && data) {
      setPendingSales(data);
    }
  };

  const loadCancelledSales = async () => {
    const { data, error } = await supabase
      .from("satis_kalemleri_detay_view")
      .select("*")
      .eq("status", "iptal")
      .order("magaza_giris_tarihi", { ascending: false })
      .limit(10);

    if (!error && data) {
      setCancelledSales(data);
    }
  };

  const loadChartData = async () => {
    // Satış grafiği verisi
    const { data: salesData, error: salesError } = await supabase
      .from("satis_kalemleri_detay_view")
      .select("magaza_giris_tarihi, adet, birim_fiyat")
      .eq("status", "onaylandı")
      .gte("magaza_giris_tarihi", format(salesDateRange.from, "yyyy-MM-dd"))
      .lte("magaza_giris_tarihi", format(salesDateRange.to, "yyyy-MM-dd"));

    if (!salesError && salesData) {
      const groupedSalesData: { [key: string]: number } = {};

      salesData.forEach((item) => {
        const dateKey =
          chartPeriod === "month"
            ? format(new Date(item.magaza_giris_tarihi), "dd/MM")
            : format(new Date(item.magaza_giris_tarihi), "MM/yyyy");

        if (!groupedSalesData[dateKey]) {
          groupedSalesData[dateKey] = 0;
        }

        groupedSalesData[dateKey] += (item.adet || 0) * (item.birim_fiyat || 0);
      });

      const salesChartData = Object.entries(groupedSalesData)
        .map(([date, amount]) => ({
          date,
          amount,
          commission: 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setSalesChartData(salesChartData);
    }

    // Komisyon grafiği verisi
    const { data: commissionData, error: commissionError } = await supabase
      .from("satis_kalemleri_detay_view")
      .select("magaza_giris_tarihi, acente_komisyonu")
      .eq("status", "onaylandı")
      .gte(
        "magaza_giris_tarihi",
        format(commissionDateRange.from, "yyyy-MM-dd")
      )
      .lte("magaza_giris_tarihi", format(commissionDateRange.to, "yyyy-MM-dd"));

    if (!commissionError && commissionData) {
      const groupedCommissionData: { [key: string]: number } = {};

      commissionData.forEach((item) => {
        const dateKey =
          chartPeriod === "month"
            ? format(new Date(item.magaza_giris_tarihi), "dd/MM")
            : format(new Date(item.magaza_giris_tarihi), "MM/yyyy");

        if (!groupedCommissionData[dateKey]) {
          groupedCommissionData[dateKey] = 0;
        }

        groupedCommissionData[dateKey] += item.acente_komisyonu || 0;
      });

      const commissionChartData = Object.entries(groupedCommissionData)
        .map(([date, commission]) => ({
          date,
          amount: 0,
          commission,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setCommissionChartData(commissionChartData);
    }
  };

  const loadTopPerformers = async () => {
    const startDate = format(subYears(new Date(), 1), "yyyy-MM-dd");
    const endDate = format(new Date(), "yyyy-MM-dd");

    // En yüksek satışa sahip rehberler
    const { data: rehberData } = await supabase
      .from("satis_kalemleri_detay_view")
      .select("rehber_adi, adet, birim_fiyat")
      .eq("status", "onaylandı")
      .gte("magaza_giris_tarihi", startDate)
      .lte("magaza_giris_tarihi", endDate);

    if (rehberData) {
      const rehberStats: { [key: string]: { total: number; count: number } } =
        {};
      rehberData.forEach((item) => {
        if (!rehberStats[item.rehber_adi]) {
          rehberStats[item.rehber_adi] = { total: 0, count: 0 };
        }
        rehberStats[item.rehber_adi].total +=
          (item.adet || 0) * (item.birim_fiyat || 0);
        rehberStats[item.rehber_adi].count += 1;
      });

      const topRehbersList = Object.entries(rehberStats)
        .map(([name, stats]) => ({
          name,
          total: stats.total,
          count: stats.count,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      setTopRehbers(topRehbersList);
    }

    // En yüksek satışa sahip turlar
    const { data: tourData } = await supabase
      .from("satis_kalemleri_detay_view")
      .select("tur_adi, adet, birim_fiyat")
      .eq("status", "onaylandı")
      .gte("magaza_giris_tarihi", startDate)
      .lte("magaza_giris_tarihi", endDate);

    if (tourData) {
      const tourStats: { [key: string]: { total: number; count: number } } = {};
      tourData.forEach((item) => {
        if (!tourStats[item.tur_adi]) {
          tourStats[item.tur_adi] = { total: 0, count: 0 };
        }
        tourStats[item.tur_adi].total +=
          (item.adet || 0) * (item.birim_fiyat || 0);
        tourStats[item.tur_adi].count += 1;
      });

      const topToursList = Object.entries(tourStats)
        .map(([name, stats]) => ({
          name,
          total: stats.total,
          count: stats.count,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      setTopTours(topToursList);
    }

    // En yüksek satışa sahip mağazalar
    const { data: storeData } = await supabase
      .from("satis_kalemleri_detay_view")
      .select("magaza_adi, adet, birim_fiyat")
      .eq("status", "onaylandı")
      .gte("magaza_giris_tarihi", startDate)
      .lte("magaza_giris_tarihi", endDate);

    if (storeData) {
      const storeStats: { [key: string]: { total: number; count: number } } =
        {};
      storeData.forEach((item) => {
        if (!storeStats[item.magaza_adi]) {
          storeStats[item.magaza_adi] = { total: 0, count: 0 };
        }
        storeStats[item.magaza_adi].total +=
          (item.adet || 0) * (item.birim_fiyat || 0);
        storeStats[item.magaza_adi].count += 1;
      });

      const topStoresList = Object.entries(storeStats)
        .map(([name, stats]) => ({
          name,
          total: stats.total,
          count: stats.count,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      setTopStores(topStoresList);
    }

    // En yüksek satışa sahip firmalar
    const { data: firmData } = await supabase
      .from("satis_kalemleri_detay_view")
      .select("firma_adi, adet, birim_fiyat")
      .eq("status", "onaylandı")
      .gte("magaza_giris_tarihi", startDate)
      .lte("magaza_giris_tarihi", endDate);

    if (firmData) {
      const firmStats: { [key: string]: { total: number; count: number } } = {};
      firmData.forEach((item) => {
        if (!firmStats[item.firma_adi]) {
          firmStats[item.firma_adi] = { total: 0, count: 0 };
        }
        firmStats[item.firma_adi].total +=
          (item.adet || 0) * (item.birim_fiyat || 0);
        firmStats[item.firma_adi].count += 1;
      });

      const topFirmsList = Object.entries(firmStats)
        .map(([name, stats]) => ({
          name,
          total: stats.total,
          count: stats.count,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      setTopFirms(topFirmsList);
    }
  };

  // Sıralama fonksiyonları
  const handlePendingSort = (field: SortField) => {
    if (pendingSortField === field) {
      setPendingSortDirection(pendingSortDirection === "asc" ? "desc" : "asc");
    } else {
      setPendingSortField(field);
      setPendingSortDirection("asc");
    }
  };

  const handleCancelledSort = (field: SortField) => {
    if (cancelledSortField === field) {
      setCancelledSortDirection(
        cancelledSortDirection === "asc" ? "desc" : "asc"
      );
    } else {
      setCancelledSortField(field);
      setCancelledSortDirection("asc");
    }
  };

  const sortSales = (
    sales: SalesItem[],
    field: SortField,
    direction: SortDirection
  ) => {
    return [...sales].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (field) {
        case "date":
          aValue = new Date(a.magaza_giris_tarihi);
          bValue = new Date(b.magaza_giris_tarihi);
          break;
        case "store":
          aValue = a.magaza_adi;
          bValue = b.magaza_adi;
          break;
        case "tour":
          aValue = a.tur_adi;
          bValue = b.tur_adi;
          break;
        case "product":
          aValue = a.urun_adi;
          bValue = b.urun_adi;
          break;
        case "amount":
          aValue = a.adet * a.birim_fiyat;
          bValue = b.adet * b.birim_fiyat;
          break;
        default:
          return 0;
      }

      if (direction === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  };

  const getSortIcon = (
    field: SortField,
    currentField: SortField,
    direction: SortDirection
  ) => {
    if (field !== currentField) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return direction === "asc" ? (
      <ArrowUp className="h-4 w-4 text-blue-600" />
    ) : (
      <ArrowDown className="h-4 w-4 text-blue-600" />
    );
  };

  if (loading || dashboardLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Dashboard yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Lütfen giriş yapın.</AlertDescription>
      </Alert>
    );
  }

  // Rehber kullanıcıları için özel dashboard
  if (userRole === "rehber") {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Rehber Dashboard</h1>
          <p className="text-gray-600">Hoş geldiniz, {user.email}</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Rehber Bildirimleri
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                Satış Kalemlerinizi Bildirin
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Turlarınızdaki satış kalemlerini buradan bildirebilirsiniz
              </p>
              <Link
                href="/dashboard/rehber-bildirimleri"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Bildirimleri Görüntüle
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Standart kullanıcılar için yönlendirme
  if (userRole === "standart") {
    redirect("/dashboard/satislar");
  }

  // Sıralanmış satış listelerini al
  const sortedPendingSales = sortSales(
    pendingSales,
    pendingSortField,
    pendingSortDirection
  );
  const sortedCancelledSales = sortSales(
    cancelledSales,
    cancelledSortField,
    cancelledSortDirection
  );

  // Admin kullanıcılar için ana dashboard
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Satış Yönetim Sistemi Genel Bakış</p>
        <p className="text-sm text-blue-600">
          Rol: {userRole === "admin" ? "Yönetici" : "Standart Kullanıcı"} |{" "}
          {user.email}
        </p>
      </div>

      {/* Quick Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>Hızlı Erişim</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Link
              href="/dashboard/satislar"
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ShoppingCart className="h-8 w-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium">Satışlar</span>
            </Link>

            <Link
              href="/dashboard/muhasebe"
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Calculator className="h-8 w-8 text-green-600 mb-2" />
              <span className="text-sm font-medium">Muhasebe</span>
            </Link>

            <Link
              href="/dashboard/analizler"
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <BarChart3 className="h-8 w-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium">Analizler</span>
            </Link>

            <Link
              href="/dashboard/bireysel-raporlar"
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <User className="h-8 w-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium">Bireysel Raporlar</span>
            </Link>

            <Link
              href="/dashboard/firmalar"
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Building2 className="h-8 w-8 text-red-600 mb-2" />
              <span className="text-sm font-medium">Firmalar</span>
            </Link>

            <Link
              href="/dashboard/magazalar"
              className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Store className="h-8 w-8 text-teal-600 mb-2" />
              <span className="text-sm font-medium">Mağazalar</span>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Satış Grafiği
              </CardTitle>
              <Select
                value={chartPeriod}
                onValueChange={(value: "month" | "year") =>
                  setChartPeriod(value)
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Günlük</SelectItem>
                  <SelectItem value="year">Aylık</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 mb-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[140px] justify-start text-left font-normal bg-transparent"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(salesDateRange.from, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={salesDateRange.from}
                    onSelect={(date) =>
                      date &&
                      setSalesDateRange({ ...salesDateRange, from: date })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <span className="flex items-center">-</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[140px] justify-start text-left font-normal bg-transparent"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(salesDateRange.to, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={salesDateRange.to}
                    onSelect={(date) =>
                      date && setSalesDateRange({ ...salesDateRange, to: date })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip
                  formatter={(value) => [
                    formatCurrency(Number(value)),
                    "Satış",
                  ]}
                  labelFormatter={(label) => `Tarih: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#0088FE"
                  strokeWidth={2}
                  dot={{ fill: "#0088FE" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Commission Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Acente Komisyon Grafiği
              </CardTitle>
              <Select
                value={chartPeriod}
                onValueChange={(value: "month" | "year") =>
                  setChartPeriod(value)
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Günlük</SelectItem>
                  <SelectItem value="year">Aylık</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 mb-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[140px] justify-start text-left font-normal bg-transparent"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(commissionDateRange.from, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={commissionDateRange.from}
                    onSelect={(date) =>
                      date &&
                      setCommissionDateRange({
                        ...commissionDateRange,
                        from: date,
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <span className="flex items-center">-</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[140px] justify-start text-left font-normal bg-transparent"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(commissionDateRange.to, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={commissionDateRange.to}
                    onSelect={(date) =>
                      date &&
                      setCommissionDateRange({
                        ...commissionDateRange,
                        to: date,
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={commissionChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip
                  formatter={(value) => [
                    formatCurrency(Number(value)),
                    "Komisyon",
                  ]}
                  labelFormatter={(label) => `Tarih: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="commission"
                  stroke="#00C49F"
                  strokeWidth={2}
                  dot={{ fill: "#00C49F" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Sales Lists - Vertical Layout */}
      <div className="space-y-6">
        {/* Pending Sales */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Bekleyen Satışlar ({pendingSales.length})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPendingDialog(true)}
            >
              Tümünü Göster
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Sıralama başlıkları */}
              <div className="flex items-center justify-between py-2 px-3 bg-gray-100 rounded-lg font-medium text-sm">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handlePendingSort("date")}
                      className="flex items-center gap-1 hover:text-blue-600 min-w-[80px]"
                    >
                      Tarih
                      {getSortIcon(
                        "date",
                        pendingSortField,
                        pendingSortDirection
                      )}
                    </button>
                    <button
                      onClick={() => handlePendingSort("store")}
                      className="flex items-center gap-1 hover:text-blue-600 min-w-[120px]"
                    >
                      Mağaza
                      {getSortIcon(
                        "store",
                        pendingSortField,
                        pendingSortDirection
                      )}
                    </button>
                    <button
                      onClick={() => handlePendingSort("tour")}
                      className="flex items-center gap-1 hover:text-blue-600 min-w-[80px]"
                    >
                      Tur
                      {getSortIcon(
                        "tour",
                        pendingSortField,
                        pendingSortDirection
                      )}
                    </button>
                    <button
                      onClick={() => handlePendingSort("product")}
                      className="flex items-center gap-1 hover:text-blue-600 flex-1"
                    >
                      Ürün
                      {getSortIcon(
                        "product",
                        pendingSortField,
                        pendingSortDirection
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePendingSort("amount")}
                    className="flex items-center gap-1 hover:text-blue-600"
                  >
                    Tutar
                    {getSortIcon(
                      "amount",
                      pendingSortField,
                      pendingSortDirection
                    )}
                  </button>
                  <span className="w-20 text-center">Durum</span>
                </div>
              </div>

              {sortedPendingSales.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Bekleyen satış bulunmuyor
                </p>
              ) : (
                <div className="space-y-1">
                  {sortedPendingSales.map((sale, index) => (
                    <div
                      key={
                        sale.id ||
                        `${sale.magaza_giris_tarihi}-${sale.urun_adi}-${index}`
                      }
                      className="flex items-center justify-between py-2 px-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-600 min-w-[80px]">
                            {format(
                              new Date(sale.magaza_giris_tarihi),
                              "dd/MM/yyyy"
                            )}
                          </span>
                          <span className="font-medium text-gray-800 min-w-[120px] truncate">
                            {sale.magaza_adi}
                          </span>
                          <span className="text-blue-600 min-w-[80px] truncate">
                            {sale.tur_adi}
                          </span>
                          <span className="text-gray-700 flex-1 truncate">
                            {sale.urun_adi}
                            {sale.satis_aciklamasi && (
                              <span className="text-gray-500 text-xs ml-1">
                                {" "}
                                - {sale.satis_aciklamasi}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-green-600 text-sm">
                          {formatCurrency(sale.adet * sale.birim_fiyat)}
                        </span>
                        <Badge
                          variant="secondary"
                          className="bg-yellow-200 text-yellow-800 text-xs"
                        >
                          Beklemede
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cancelled Sales */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              İptal Edilen Satışlar ({cancelledSales.length})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCancelledDialog(true)}
            >
              Tümünü Göster
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Sıralama başlıkları */}
              <div className="flex items-center justify-between py-2 px-3 bg-gray-100 rounded-lg font-medium text-sm">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleCancelledSort("date")}
                      className="flex items-center gap-1 hover:text-blue-600 min-w-[80px]"
                    >
                      Tarih
                      {getSortIcon(
                        "date",
                        cancelledSortField,
                        cancelledSortDirection
                      )}
                    </button>
                    <button
                      onClick={() => handleCancelledSort("store")}
                      className="flex items-center gap-1 hover:text-blue-600 min-w-[120px]"
                    >
                      Mağaza
                      {getSortIcon(
                        "store",
                        cancelledSortField,
                        cancelledSortDirection
                      )}
                    </button>
                    <button
                      onClick={() => handleCancelledSort("tour")}
                      className="flex items-center gap-1 hover:text-blue-600 min-w-[80px]"
                    >
                      Tur
                      {getSortIcon(
                        "tour",
                        cancelledSortField,
                        cancelledSortDirection
                      )}
                    </button>
                    <button
                      onClick={() => handleCancelledSort("product")}
                      className="flex items-center gap-1 hover:text-blue-600 flex-1"
                    >
                      Ürün
                      {getSortIcon(
                        "product",
                        cancelledSortField,
                        cancelledSortDirection
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCancelledSort("amount")}
                    className="flex items-center gap-1 hover:text-blue-600"
                  >
                    Tutar
                    {getSortIcon(
                      "amount",
                      cancelledSortField,
                      cancelledSortDirection
                    )}
                  </button>
                  <span className="w-20 text-center">Durum</span>
                </div>
              </div>

              {sortedCancelledSales.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  İptal edilen satış bulunmuyor
                </p>
              ) : (
                <div className="space-y-1">
                  {sortedCancelledSales.map((sale, index) => (
                    <div
                      key={
                        sale.id ||
                        `${sale.magaza_giris_tarihi}-${sale.urun_adi}-${index}`
                      }
                      className="flex items-center justify-between py-2 px-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-600 min-w-[80px]">
                            {format(
                              new Date(sale.magaza_giris_tarihi),
                              "dd/MM/yyyy"
                            )}
                          </span>
                          <span className="font-medium text-gray-800 min-w-[120px] truncate">
                            {sale.magaza_adi}
                          </span>
                          <span className="text-blue-600 min-w-[80px] truncate">
                            {sale.tur_adi}
                          </span>
                          <span className="text-gray-700 flex-1 truncate">
                            {sale.urun_adi}
                            {sale.satis_aciklamasi && (
                              <span className="text-gray-500 text-xs ml-1">
                                {" "}
                                - {sale.satis_aciklamasi}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-red-600 text-sm line-through">
                          {formatCurrency(sale.adet * sale.birim_fiyat)}
                        </span>
                        <Badge variant="destructive" className="text-xs">
                          İptal
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Top Rehbers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-gold-600" />
              En İyi Rehberler (Son Yıl)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topRehbers.map((rehber, index) => (
                <div
                  key={rehber.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                        index === 0
                          ? "bg-yellow-500 text-white"
                          : index === 1
                          ? "bg-gray-400 text-white"
                          : index === 2
                          ? "bg-amber-600 text-white"
                          : "bg-gray-200 text-gray-700"
                      )}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{rehber.name}</p>
                      <p className="text-xs text-gray-500">
                        {rehber.count} satış
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-sm">
                    {formatCurrency(rehber.total)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Tours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              En İyi Turlar (Son Yıl)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topTours.map((tour, index) => (
                <div
                  key={tour.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                        index === 0
                          ? "bg-yellow-500 text-white"
                          : index === 1
                          ? "bg-gray-400 text-white"
                          : index === 2
                          ? "bg-amber-600 text-white"
                          : "bg-gray-200 text-gray-700"
                      )}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{tour.name}</p>
                      <p className="text-xs text-gray-500">
                        {tour.count} satış
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-sm">
                    {formatCurrency(tour.total)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Stores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-green-600" />
              En İyi Mağazalar (Son Yıl)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topStores.map((store, index) => (
                <div
                  key={store.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                        index === 0
                          ? "bg-yellow-500 text-white"
                          : index === 1
                          ? "bg-gray-400 text-white"
                          : index === 2
                          ? "bg-amber-600 text-white"
                          : "bg-gray-200 text-gray-700"
                      )}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{store.name}</p>
                      <p className="text-xs text-gray-500">
                        {store.count} satış
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-sm">
                    {formatCurrency(store.total)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Firms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-600" />
              En İyi Firmalar (Son Yıl)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topFirms.map((firm, index) => (
                <div
                  key={firm.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                        index === 0
                          ? "bg-yellow-500 text-white"
                          : index === 1
                          ? "bg-gray-400 text-white"
                          : index === 2
                          ? "bg-amber-600 text-white"
                          : "bg-gray-200 text-gray-700"
                      )}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{firm.name}</p>
                      <p className="text-xs text-gray-500">
                        {firm.count} satış
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-sm">
                    {formatCurrency(firm.total)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales List Dialogs */}
      <SalesListDialog
        isOpen={showPendingDialog}
        onClose={() => setShowPendingDialog(false)}
        status="beklemede"
      />
      <SalesListDialog
        isOpen={showCancelledDialog}
        onClose={() => setShowCancelledDialog(false)}
        status="iptal"
      />
    </div>
  );
}
