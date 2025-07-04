"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Award,
  AlertTriangle,
  BarChart3,
  Users,
  DollarSign,
  UserCheck,
} from "lucide-react";
import type { BireyselRaporStatisticsType, MetricType } from "../page";

interface BireyselRaporStatisticsProps {
  statistics: BireyselRaporStatisticsType;
  userRole: string | null;
  loading: boolean;
}

export function BireyselRaporStatistics({
  statistics,
  userRole,
  loading,
}: BireyselRaporStatisticsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 bg-muted animate-pulse rounded" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded mb-2" />
              <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatValue = (
    value: number,
    metricType: MetricType,
    isTotalCard = false
  ) => {
    if (metricType === "totalAmount" && userRole === "admin") {
      return `€${value.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`;
    } else if (metricType === "paxAverage") {
      return value.toFixed(2); // Always format as decimal for average
    }
    return value.toLocaleString();
  };

  const getMetricLabel = (metricType: MetricType) => {
    switch (metricType) {
      case "totalSales":
        return "Toplam Satış Adedi";
      case "totalAmount":
        return "Toplam Tutar";
      case "paxAverage":
        return "Pax Ortalaması"; // Changed label
      default:
        return "Değer";
    }
  };

  const getMetricLabelForTotalCard = (metricType: MetricType) => {
    switch (metricType) {
      case "totalSales":
        return "Toplam Satış Adedi";
      case "totalAmount":
        return "Toplam Tutar";
      case "paxAverage":
        return "Ortalama Pax Ortalaması"; // Changed label for total card
      default:
        return "Toplam Değer";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* En İyi Performans */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            En İyi Performans
          </CardTitle>
          <Award className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatValue(
              statistics.topPerformer.value,
              statistics.topPerformer.type as MetricType
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {statistics.topPerformer.name}
          </p>
          <Badge variant="secondary" className="mt-2">
            <TrendingUp className="h-3 w-3 mr-1" />
            En Yüksek{" "}
            {getMetricLabel(statistics.topPerformer.type as MetricType)}
          </Badge>
        </CardContent>
      </Card>

      {/* En Düşük Performans */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            En Düşük Performans
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {formatValue(
              statistics.worstPerformer.value,
              statistics.worstPerformer.type as MetricType
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {statistics.worstPerformer.name}
          </p>
          <Badge variant="secondary" className="mt-2">
            <TrendingDown className="h-3 w-3 mr-1" />
            En Düşük{" "}
            {getMetricLabel(statistics.worstPerformer.type as MetricType)}
          </Badge>
        </CardContent>
      </Card>

      {/* Ortalama */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ortalama</CardTitle>
          <BarChart3 className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatValue(
              statistics.average,
              statistics.topPerformer.type as MetricType
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {statistics.totalItems} öğe ortalaması
          </p>
          <Badge variant="secondary" className="mt-2">
            Ortalama Değer
          </Badge>
        </CardContent>
      </Card>

      {/* Toplam */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {getMetricLabelForTotalCard(
              statistics.topPerformer.type as MetricType
            )}
          </CardTitle>
          {statistics.topPerformer.type === "totalAmount" ? (
            <DollarSign className="h-4 w-4 text-purple-600" />
          ) : statistics.topPerformer.type === "paxAverage" ? (
            <UserCheck className="h-4 w-4 text-purple-600" />
          ) : (
            <Users className="h-4 w-4 text-purple-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {formatValue(
              statistics.total,
              statistics.topPerformer.type as MetricType,
              true
            )}{" "}
          </div>
          <p className="text-xs text-muted-foreground">
            {statistics.totalItems} farklı öğe
          </p>
          <Badge variant="secondary" className="mt-2">
            Toplam Değer
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
