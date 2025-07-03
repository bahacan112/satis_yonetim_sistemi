"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type {
  BireyselRaporData,
  BireyselRaporFiltersType,
  MetricType,
} from "../page";

interface BireyselRaporChartProps {
  data: BireyselRaporData[];
  filters: BireyselRaporFiltersType;
  userRole: string | null;
  loading: boolean;
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

export function BireyselRaporChart({
  data,
  filters,
  userRole,
  loading,
}: BireyselRaporChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Grafik Yükleniyor...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Veri Bulunamadı</CardTitle>
          <CardDescription>
            Seçilen kriterlere uygun veri bulunamadı.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center text-muted-foreground">
            Rapor için veri bulunamadı
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSortValue = (item: BireyselRaporData, metricType: MetricType) => {
    if (metricType === "totalSales") return item.totalSales;
    if (metricType === "totalAmount") return item.totalAmount;
    if (metricType === "paxAverage") return item.paxAverage; // Sort by pax average
    return 0;
  };

  const chartData = data
    .sort(
      (a, b) =>
        getSortValue(b, filters.metricType) -
        getSortValue(a, filters.metricType)
    )
    .slice(0, 10)
    .map((item) => ({
      name:
        item.name.length > 15 ? item.name.substring(0, 15) + "..." : item.name,
      fullName: item.name,
      satisAdedi: item.totalSales,
      toplamTutar: item.totalAmount,
      islemSayisi: item.salesCount,
      ortalamaTutar: item.averageAmount,
      paxOrtalamasi: item.paxAverage, // Actual calculated average (Tutar/Pax)
      toplamPaxSayisi: item.paxTotal, // Total pax count
    }));

  const pieData = chartData.map((item) => ({
    name: item.name,
    value:
      filters.metricType === "totalSales"
        ? item.satisAdedi
        : filters.metricType === "totalAmount"
        ? item.toplamTutar
        : item.paxOrtalamasi, // Use paxOrtalamasi for paxAverage metric type
    fullName: item.fullName,
  }));

  const getMetricLabel = (metricType: MetricType) => {
    switch (metricType) {
      case "totalSales":
        return "Toplam Satış Adedi";
      case "totalAmount":
        return "Toplam Tutar (₺)";
      case "paxAverage":
        return "Pax Ortalaması"; // Changed label
      default:
        return "Değer";
    }
  };

  const getMetricDataKey = (metricType: MetricType) => {
    switch (metricType) {
      case "totalSales":
        return "satisAdedi";
      case "totalAmount":
        return "toplamTutar";
      case "paxAverage":
        return "paxOrtalamasi"; // Use paxOrtalamasi for paxAverage metric type
      default:
        return "satisAdedi";
    }
  };

  const renderChart = () => {
    const mainDataKey = getMetricDataKey(filters.metricType);
    const mainMetricLabel = getMetricLabel(filters.metricType);

    const formatter = (value: any, name: string) => {
      if (typeof value === "number") {
        if (filters.metricType === "totalAmount") {
          return [
            `₺${value.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`,
            mainMetricLabel,
          ];
        } else if (filters.metricType === "paxAverage") {
          return [value.toFixed(2), mainMetricLabel]; // Format as decimal for average
        }
        return [value.toLocaleString("tr-TR"), mainMetricLabel];
      }
      return [value, name];
    };

    switch (filters.chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip
                formatter={formatter}
                labelFormatter={(label) => {
                  const item = chartData.find((d) => d.name === label);
                  return item?.fullName || label;
                }}
              />
              <Legend />
              <Bar
                dataKey={mainDataKey}
                fill="#8884d8"
                name={mainMetricLabel}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={formatter} />
              <Legend />
              <Line
                type="monotone"
                dataKey={mainDataKey}
                stroke="#8884d8"
                strokeWidth={2}
                name={mainMetricLabel}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={formatter} />
              <Legend />
              <Area
                type="monotone"
                dataKey={mainDataKey}
                stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
                name={mainMetricLabel}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "pie":
      case "donut":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} (${(percent * 100).toFixed(0)}%)`
                }
                outerRadius={filters.chartType === "donut" ? 120 : 140}
                innerRadius={filters.chartType === "donut" ? 60 : 0}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [
                  typeof value === "number"
                    ? filters.metricType === "totalAmount"
                      ? `₺${value.toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                        })}`
                      : filters.metricType === "paxAverage"
                      ? value.toFixed(2) // Format as decimal for average
                      : value.toLocaleString("tr-TR")
                    : value,
                  mainMetricLabel,
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return <div>Desteklenmeyen grafik türü</div>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {filters.analysisType === "rehber" && "Rehber"}
          {filters.analysisType === "magaza" && "Mağaza"}
          {filters.analysisType === "firma" && "Firma"}
          {filters.analysisType === "urun" && "Ürün"}
          {filters.analysisType === "operator" && "Operatör"}
          {filters.analysisType === "tur" && "Tur"} Performans Raporu
        </CardTitle>
        <CardDescription>
          {filters.dateRange?.from && filters.dateRange?.to ? (
            <>
              {filters.dateRange.from.toLocaleDateString("tr-TR")} -{" "}
              {filters.dateRange.to.toLocaleDateString("tr-TR")} tarihleri arası
              performans verileri ({getMetricLabel(filters.metricType)})
            </>
          ) : (
            <>
              Tüm zamanlar performans verileri (
              {getMetricLabel(filters.metricType)})
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>{renderChart()}</CardContent>
    </Card>
  );
}
