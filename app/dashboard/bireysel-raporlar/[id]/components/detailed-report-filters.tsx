"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { RefreshCw, Calendar } from "lucide-react"
import type { DetailedReportFiltersType, TimeRange } from "../page"

interface OptionType {
  id: string
  name: string
}

interface DetailedReportFiltersProps {
  filters: DetailedReportFiltersType
  onFiltersChange: (filters: Partial<DetailedReportFiltersType>) => void
  loading: boolean
  operators: OptionType[]
  products: OptionType[]
  stores: OptionType[]
}

export function DetailedReportFilters({
  filters,
  onFiltersChange,
  loading,
  operators,
  products,
  stores,
}: DetailedReportFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Detay Rapor Filtreleri
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Zaman Aralığı */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Zaman Aralığı</label>
            <Select
              value={filters.timeRange}
              onValueChange={(value) => onFiltersChange({ timeRange: value as TimeRange })}
            >
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

          {/* Operatör Filtresi */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Operatör</label>
            <Select
              value={filters.selectedOperatorId || "all"}
              onValueChange={(value) => onFiltersChange({ selectedOperatorId: value === "all" ? null : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tüm Operatörler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Operatörler</SelectItem>
                {operators.map((operator) => (
                  <SelectItem key={operator.id} value={operator.id}>
                    {operator.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ürün Filtresi */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Ürün</label>
            <Select
              value={filters.selectedProductId || "all"}
              onValueChange={(value) => onFiltersChange({ selectedProductId: value === "all" ? null : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tüm Ürünler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Ürünler</SelectItem>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mağaza Filtresi */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Mağaza</label>
            <Select
              value={filters.selectedStoreId || "all"}
              onValueChange={(value) => onFiltersChange({ selectedStoreId: value === "all" ? null : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tüm Mağazalar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Mağazalar</SelectItem>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
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
      </CardContent>
    </Card>
  )
}
