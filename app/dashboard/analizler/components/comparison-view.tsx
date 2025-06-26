"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Users, Store, Building2, Package } from "lucide-react";

interface ComparisonViewProps {
  data: any[];
  filters: any;
  onFiltersChange: (filters: any) => void;
  userRole: string | null;
  loading: boolean;
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00"];

export function ComparisonView({
  data,
  filters,
  onFiltersChange,
  userRole,
  loading,
}: ComparisonViewProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Karşılaştırma Yükleniyor...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get the correct metric value based on selected metric type
  const getMetricValue = (item: any) => {
    if (filters.metricType === "paxAverage") {
      return item.paxAverage || 0;
    } else if (filters.metricType === "totalAmount") {
      return item.totalAmount || 0;
    } else {
      return item.totalSales || 0;
    }
  };

  // Format the metric value for display
  const formatMetricValue = (value: number) => {
    if (filters.metricType === "paxAverage") {
      return value.toFixed(2);
    } else if (filters.metricType === "totalAmount") {
      return `₺${value.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`;
    } else {
      return value.toLocaleString();
    }
  };

  // Get the metric label
  const getMetricLabel = () => {
    if (filters.metricType === "paxAverage") {
      return "pax ort.";
    } else if (filters.metricType === "totalAmount") {
      return "toplam tutar";
    } else {
      return "satış";
    }
  };

  // Seçilen öğelerin zaman serisi verilerini birleştir
  const createTimeSeriesData = () => {
    if (selectedItems.length === 0) return [];

    const selectedData = data.filter((item) => selectedItems.includes(item.id));
    const allDates = new Set<string>();

    // Tüm tarihleri topla
    selectedData.forEach((item) => {
      item.data.forEach((d: any) => allDates.add(d.date));
    });

    // Tarihleri sırala
    const sortedDates = Array.from(allDates).sort();

    // Her tarih için tüm seçili öğelerin verilerini birleştir
    return sortedDates.map((date) => {
      const dataPoint: any = {
        date: new Date(date).toLocaleDateString("tr-TR"),
      };

      selectedData.forEach((item) => {
        const dayData = item.data.find((d: any) => d.date === date);
        if (filters.metricType === "paxAverage") {
          // For pax average, calculate amount/pax for that day
          const dayAmount = dayData?.amount || 0;
          const dayPax = dayData?.pax || 0;
          dataPoint[item.name] = dayPax > 0 ? dayAmount / dayPax : 0;
        } else if (filters.metricType === "totalAmount") {
          dataPoint[item.name] = dayData?.amount || 0;
        } else {
          dataPoint[item.name] = dayData?.value || 0;
        }
      });

      return dataPoint;
    });
  };

  const timeSeriesData = createTimeSeriesData();

  const handleItemToggle = (itemId: string) => {
    setSelectedItems((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      } else if (prev.length < 5) {
        // Maksimum 5 öğe karşılaştırılabilir
        return [...prev, itemId];
      }
      return prev;
    });
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  const selectTop5 = () => {
    const top5 = data
      .sort((a, b) => getMetricValue(b) - getMetricValue(a))
      .slice(0, 5)
      .map((item) => item.id);
    setSelectedItems(top5);
  };

  return (
    <div className="space-y-6">
      {/* Seçim Paneli */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {filters.analysisType === "rehber" && <Users className="h-5 w-5" />}
            {filters.analysisType === "magaza" && <Store className="h-5 w-5" />}
            {filters.analysisType === "firma" && (
              <Building2 className="h-5 w-5" />
            )}
            {filters.analysisType === "urun" && <Package className="h-5 w-5" />}
            Karşılaştırma Seçimi
          </CardTitle>
          <CardDescription>
            Karşılaştırmak istediğiniz öğeleri seçin (maksimum 5 öğe)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button onClick={selectTop5} variant="outline" size="sm">
              En İyi 5'i Seç
            </Button>
            <Button onClick={clearSelection} variant="outline" size="sm">
              Seçimi Temizle
            </Button>
            <Badge variant="secondary">{selectedItems.length}/5 seçili</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {data
              .sort((a, b) => getMetricValue(b) - getMetricValue(a))
              .map((item, index) => (
                <div
                  key={item.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg border ${
                    selectedItems.includes(item.id)
                      ? "bg-primary/5 border-primary"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <Checkbox
                    id={item.id}
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={() => handleItemToggle(item.id)}
                    disabled={
                      !selectedItems.includes(item.id) &&
                      selectedItems.length >= 5
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <label
                        htmlFor={item.id}
                        className="text-sm font-medium cursor-pointer truncate"
                      >
                        {item.name}
                      </label>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatMetricValue(getMetricValue(item))}{" "}
                      {getMetricLabel()}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Karşılaştırma Grafiği */}
      {selectedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Zaman Serisi Karşılaştırması</CardTitle>
            <CardDescription>
              Seçilen öğelerin zaman içindeki performans karşılaştırması
            </CardDescription>
          </CardHeader>
          <CardContent>
            {timeSeriesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => [
                      typeof value === "number"
                        ? filters.metricType === "paxAverage"
                          ? value.toFixed(2)
                          : filters.metricType === "totalAmount"
                          ? `₺${value.toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            })}`
                          : value.toLocaleString("tr-TR")
                        : value,
                      name,
                    ]}
                  />
                  <Legend />
                  {data
                    .filter((item) => selectedItems.includes(item.id))
                    .map((item, index) => (
                      <Line
                        key={item.id}
                        type="monotone"
                        dataKey={item.name}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-96 flex items-center justify-center text-muted-foreground">
                Seçilen öğeler için zaman serisi verisi bulunamadı
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Karşılaştırma Tablosu */}
      {selectedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detaylı Karşılaştırma</CardTitle>
            <CardDescription>
              Seçilen öğelerin detaylı performans karşılaştırması
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
                    </th>
                    <th className="text-right p-2">Satış Adedi</th>
                    {userRole === "admin" && (
                      <>
                        <th className="text-right p-2">Toplam Tutar</th>
                        <th className="text-right p-2">Ortalama Tutar</th>
                      </>
                    )}
                    <th className="text-right p-2">Pax Ortalaması</th>
                    <th className="text-right p-2">İşlem Sayısı</th>
                    <th className="text-center p-2">Performans</th>
                  </tr>
                </thead>
                <tbody>
                  {data
                    .filter((item) => selectedItems.includes(item.id))
                    .sort((a, b) => getMetricValue(b) - getMetricValue(a))
                    .map((item, index) => (
                      <tr key={item.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor: COLORS[index % COLORS.length],
                              }}
                            />
                            {item.name}
                          </div>
                        </td>
                        <td className="text-right p-2 font-medium">
                          {item.totalSales?.toLocaleString() || 0}
                        </td>
                        {userRole === "admin" && (
                          <>
                            <td className="text-right p-2 font-medium">
                              ₺
                              {(item.totalAmount || 0).toLocaleString("tr-TR", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                            <td className="text-right p-2">
                              ₺
                              {(item.averageAmount || 0).toLocaleString(
                                "tr-TR",
                                { minimumFractionDigits: 2 }
                              )}
                            </td>
                          </>
                        )}
                        <td className="text-right p-2 font-medium">
                          {(item.paxAverage || 0).toFixed(2)}
                        </td>
                        <td className="text-right p-2">
                          {item.salesCount || 0}
                        </td>
                        <td className="text-center p-2">
                          <Badge
                            variant={
                              index === 0
                                ? "default"
                                : index === 1
                                ? "secondary"
                                : "outline"
                            }
                          >
                            #{index + 1}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedItems.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                Karşılaştırma için öğe seçin
              </h3>
              <p>
                Yukarıdaki listeden karşılaştırmak istediğiniz öğeleri seçin.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
