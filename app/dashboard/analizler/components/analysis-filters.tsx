"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
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
} from "lucide-react"
import type { AnalysisFilters as FiltersType, MetricType } from "../page"

interface AnalysisFiltersProps {
  filters: FiltersType
  onFiltersChange: (filters: Partial<FiltersType>) => void
  loading: boolean
  operators: { id: string; adi: string }[] // New prop for operators
}

export function AnalysisFilters({ filters, onFiltersChange, loading, operators }: AnalysisFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Analiz Filtreleri
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Analiz Türü */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Analiz Türü</label>
            <Select
              value={filters.analysisType}
              onValueChange={(value) => onFiltersChange({ analysisType: value as any })}
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
              </SelectContent>
            </Select>
          </div>

          {/* Zaman Aralığı */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Zaman Aralığı</label>
            <Select value={filters.timeRange} onValueChange={(value) => onFiltersChange({ timeRange: value as any })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="haftalik">Son 7 Gün</SelectItem>
                <SelectItem value="15gun">Son 15 Gün</SelectItem>
                <SelectItem value="1ay">Son 1 Ay</SelectItem>
                <SelectItem value="3ay">Son 3 Ay</SelectItem>
                <SelectItem value="6ay">Son 6 Ay</SelectItem>
                <SelectItem value="senelik">Son 1 Yıl</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Metrik Türü */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Metrik Türü</label>
            <Select
              value={filters.metricType}
              onValueChange={(value) => onFiltersChange({ metricType: value as MetricType })}
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
            <Select value={filters.chartType} onValueChange={(value) => onFiltersChange({ chartType: value as any })}>
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
              value={filters.selectedOperators[0] || ""} // Assuming single select for simplicity
              onValueChange={(value) => onFiltersChange({ selectedOperators: value ? [value] : [] })}
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
            <Button onClick={() => window.location.reload()} disabled={loading} className="w-full" variant="outline">
              {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
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
          </Badge>
          <Badge variant="secondary">
            {filters.timeRange === "haftalik" && "Son 7 Gün"}
            {filters.timeRange === "15gun" && "Son 15 Gün"}
            {filters.timeRange === "1ay" && "Son 1 Ay"}
            {filters.timeRange === "3ay" && "Son 3 Ay"}
            {filters.timeRange === "6ay" && "Son 6 Ay"}
            {filters.timeRange === "senelik" && "Son 1 Yıl"}
          </Badge>
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
          {filters.selectedOperators.length > 0 && (
            <Badge variant="secondary">
              Operatör: {operators.find((op) => op.id === filters.selectedOperators[0])?.adi || "Seçili Operatör"}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
