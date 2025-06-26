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
import { RefreshCw } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface OptionType {
  id: string;
  name: string;
}

export interface DetailedReportFiltersType {
  startDate: Date | null;
  endDate: Date | null;
  selectedOperatorId: string | null;
  selectedProductId: string | null;
  selectedStoreId: string | null;
  dailyChartType: "bar" | "line" | "area" | "pie" | "donut";
  productChartType: "bar" | "line" | "area" | "pie" | "donut";
  storeChartType: "bar" | "line" | "area" | "pie" | "donut";
}

interface DetailedReportFiltersProps {
  filters: DetailedReportFiltersType;
  onFiltersChange: (filters: Partial<DetailedReportFiltersType>) => void;
  loading: boolean;
  operators: OptionType[];
  products: OptionType[];
  stores: OptionType[];
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
          <CalendarIcon className="h-5 w-5" />
          Detay Rapor Filtreleri
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Başlangıç Tarihi */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Başlangıç Tarihi *</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.startDate
                    ? format(filters.startDate, "dd/MM/yyyy", { locale: tr })
                    : "Tarih seçin"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.startDate || undefined}
                  onSelect={(date) =>
                    onFiltersChange({ startDate: date || null })
                  }
                  initialFocus
                  locale={tr}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Bitiş Tarihi */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Bitiş Tarihi *</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.endDate
                    ? format(filters.endDate, "dd/MM/yyyy", { locale: tr })
                    : "Tarih seçin"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.endDate || undefined}
                  onSelect={(date) =>
                    onFiltersChange({ endDate: date || null })
                  }
                  initialFocus
                  locale={tr}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Operatör Filtresi */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Operatör</label>
            <Select
              value={filters.selectedOperatorId || "all"}
              onValueChange={(value) =>
                onFiltersChange({
                  selectedOperatorId: value === "all" ? null : value,
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
              onValueChange={(value) =>
                onFiltersChange({
                  selectedProductId: value === "all" ? null : value,
                })
              }
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
              onValueChange={(value) =>
                onFiltersChange({
                  selectedStoreId: value === "all" ? null : value,
                })
              }
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
      </CardContent>
    </Card>
  );
}
