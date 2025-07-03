"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarIcon,
  RefreshCw,
  Users,
  Store,
  Building2,
  Package,
  BarChart3,
  LineChart,
  PieChart,
  AreaChart,
  DollarSign,
  UserCheck,
} from "lucide-react";
import type { BireyselRaporFiltersType, MetricType } from "../page";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface BireyselRaporFiltersProps {
  filters: BireyselRaporFiltersType;
  onFiltersChange: (filters: Partial<BireyselRaporFiltersType>) => void;
  loading: boolean;
  operators: { id: string; adi: string }[];
}

export function BireyselRaporFilters({
  filters,
  onFiltersChange,
  loading,
  operators,
}: BireyselRaporFiltersProps) {
  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      onFiltersChange({
        dateRange: {
          start: date,
          end: filters.dateRange.end,
        },
      });
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    if (date) {
      onFiltersChange({
        dateRange: {
          start: filters.dateRange.start,
          end: date,
        },
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Rapor Filtreleri
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Analiz Türü */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Analiz Türü</label>
            <Select
              value={filters.analysisType}
              onValueChange={(value) =>
                onFiltersChange({ analysisType: value as any })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rehber">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Rehber Analizi
                  </div>
                </SelectItem>
                <SelectItem value="magaza">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    Mağaza Analizi
                  </div>
                </SelectItem>
                <SelectItem value="firma">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Firma Analizi
                  </div>
                </SelectItem>
                <SelectItem value="urun">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Ürün Analizi
                  </div>
                </SelectItem>
                <SelectItem value="operator">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Operatör Analizi
                  </div>
                </SelectItem>
                <SelectItem value="tur">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Tur Analizi
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Başlangıç Tarihi */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Başlangıç Tarihi</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.dateRange.start && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange.start ? (
                    format(filters.dateRange.start, "dd MMM yyyy", {
                      locale: tr,
                    })
                  ) : (
                    <span>Başlangıç tarihi seç</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateRange.start}
                  onSelect={handleStartDateChange}
                  disabled={loading}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Bitiş Tarihi */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Bitiş Tarihi</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.dateRange.end && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange.end ? (
                    format(filters.dateRange.end, "dd MMM yyyy", { locale: tr })
                  ) : (
                    <span>Bitiş tarihi seç</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateRange.end}
                  onSelect={handleEndDateChange}
                  disabled={loading}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Metrik Türü */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Metrik Türü</label>
            <Select
              value={filters.metricType}
              onValueChange={(value) =>
                onFiltersChange({ metricType: value as MetricType })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="totalSales">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Toplam Satış Adedi
                  </div>
                </SelectItem>
                <SelectItem value="totalAmount">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Toplam Tutar
                  </div>
                </SelectItem>
                <SelectItem value="paxAverage">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Pax Ortalaması
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grafik Türü */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Grafik Türü</label>
            <Select
              value={filters.chartType}
              onValueChange={(value) =>
                onFiltersChange({ chartType: value as any })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Sütun Grafik
                  </div>
                </SelectItem>
                <SelectItem value="line">
                  <div className="flex items-center gap-2">
                    <LineChart className="h-4 w-4" />
                    Çizgi Grafik
                  </div>
                </SelectItem>
                <SelectItem value="area">
                  <div className="flex items-center gap-2">
                    <AreaChart className="h-4 w-4" />
                    Alan Grafik
                  </div>
                </SelectItem>
                <SelectItem value="pie">
                  <div className="flex items-center gap-2">
                    <PieChart className="h-4 w-4" />
                    Pasta Grafik
                  </div>
                </SelectItem>
                <SelectItem value="donut">
                  <div className="flex items-center gap-2">
                    <PieChart className="h-4 w-4" />
                    Halka Grafik
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Operatör Filtresi */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Operatör</label>
            <Select
              value={filters.selectedOperators[0] || "all"}
              onValueChange={(value) =>
                onFiltersChange({
                  selectedOperators: value === "all" ? [] : [value],
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tüm Operatörler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Operatörler</SelectItem>
                {operators.map((operator) => (
                  <SelectItem key={operator.id} value={operator.id}>
                    {operator.adi}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Yenile Butonu */}
          <div className="space-y-2">
            <label className="text-sm font-medium">İşlemler</label>
            <Button
              onClick={() => window.location.reload()}
              disabled={loading}
              className="w-full"
              variant="outline"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Yenile
            </Button>
          </div>
        </div>

        {/* Aktif Filtreler */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge variant="secondary">
            {filters.analysisType === "rehber" && "Rehber"}
            {filters.analysisType === "magaza" && "Mağaza"}
            {filters.analysisType === "firma" && "Firma"}
            {filters.analysisType === "urun" && "Ürün"}
            {filters.analysisType === "operator" && "Operatör"}
            {filters.analysisType === "tur" && "Tur"}
          </Badge>
          {filters.dateRange.start && filters.dateRange.end && (
            <Badge variant="secondary">
              {format(filters.dateRange.start, "dd MMM yyyy", { locale: tr })} -{" "}
              {format(filters.dateRange.end, "dd MMM yyyy", { locale: tr })}
            </Badge>
          )}
          <Badge variant="secondary">
            {filters.metricType === "totalSales" && "Toplam Satış"}
            {filters.metricType === "totalAmount" && "Toplam Tutar"}
            {filters.metricType === "paxAverage" && "Pax Ortalaması"}
          </Badge>
          <Badge variant="secondary">
            {filters.chartType === "bar" && "Sütun"}
            {filters.chartType === "line" && "Çizgi"}
            {filters.chartType === "area" && "Alan"}
            {filters.chartType === "pie" && "Pasta"}
            {filters.chartType === "donut" && "Halka"}
          </Badge>
          {filters.selectedOperators.length > 0 &&
            filters.selectedOperators[0] !== "all" && (
              <Badge variant="secondary">
                Operatör:{" "}
                {operators.find((op) => op.id === filters.selectedOperators[0])
                  ?.adi || "Seçili Operatör"}
              </Badge>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
