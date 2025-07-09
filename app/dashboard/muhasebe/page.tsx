"use client";

import React from "react";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Clock,
  XCircle,
  CheckCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useI18n } from "@/contexts/i18n-context";

// Types for the data fetched from the view
interface MuhasebeSummaryRow {
  magaza_id: string;
  magaza_adi: string;
  firma_id: string | null;
  firma_adi: string | null;
  toplam_satis_tutari: number;
  toplam_acente_komisyon_tutari: number;
  toplam_ofis_komisyon_tutari: number;
  bekleyen_satis_tutari: number;
  bekleyen_acente_komisyon_tutari: number;
  bekleyen_ofis_komisyon_tutari: number;
  iptal_satis_tutari: number;
  toplam_acente_tahsilat: number;
  toplam_ofis_tahsilat: number;
  toplam_tahsilat: number;
  kalan_acente_alacagi: number;
  kalan_ofis_alacagi: number;
  kalan_bakiye: number;
  onaylanan_kalem_sayisi: number;
  bekleyen_kalem_sayisi: number;
  iptal_kalem_sayisi: number;
  toplam_kalem_sayisi: number;
}

// New structure for grouped data
interface GroupedFirmaMuhasebe {
  firma_id: string;
  firma_adi: string;
  total_toplam_satis_tutari: number;
  total_toplam_acente_komisyon_tutari: number;
  total_toplam_ofis_komisyon_tutari: number;
  total_bekleyen_satis_tutari: number;
  total_bekleyen_acente_komisyon_tutari: number;
  total_bekleyen_ofis_komisyon_tutari: number;
  total_iptal_satis_tutari: number;
  total_toplam_acente_tahsilat: number;
  total_toplam_ofis_tahsilat: number;
  total_toplam_tahsilat: number;
  total_kalan_acente_alacagi: number;
  total_kalan_ofis_alacagi: number;
  total_kalan_bakiye: number;
  total_onaylanan_kalem_sayisi: number;
  total_bekleyen_kalem_sayisi: number;
  total_iptal_kalem_sayisi: number;
  total_toplam_kalem_sayisi: number;
  magazalar: MuhasebeSummaryRow[];
}

export default function MuhasebePage() {
  const router = useRouter();
  const { t } = useI18n();
  const [groupedFirmaData, setGroupedFirmaData] = useState<
    GroupedFirmaMuhasebe[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFirms, setExpandedFirms] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSummaryData();
  }, []);

  const fetchSummaryData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: rawMuhasebeData, error: muhasebeError } = await supabase
        .from("magaza_muhasebe_summary_view")
        .select("*");

      if (muhasebeError) throw muhasebeError;

      console.log("Raw muhasebe data:", rawMuhasebeData);

      // Group stores by company
      const groupedByFirma = new Map<string, GroupedFirmaMuhasebe>();

      rawMuhasebeData?.forEach((magazaItem) => {
        // Create a unique key for each company
        const firmaKey =
          magazaItem.firma_id ||
          `no-firma-${magazaItem.firma_adi || "unknown"}`;
        const firmaAdi = magazaItem.firma_adi || t("accounting.noCompany");

        console.log(
          `Processing store: ${magazaItem.magaza_adi}, company: ${firmaAdi}, firma_id: ${magazaItem.firma_id}`
        );

        if (!groupedByFirma.has(firmaKey)) {
          groupedByFirma.set(firmaKey, {
            firma_id: firmaKey,
            firma_adi: firmaAdi,
            total_toplam_satis_tutari: 0,
            total_toplam_acente_komisyon_tutari: 0,
            total_toplam_ofis_komisyon_tutari: 0,
            total_bekleyen_satis_tutari: 0,
            total_bekleyen_acente_komisyon_tutari: 0,
            total_bekleyen_ofis_komisyon_tutari: 0,
            total_iptal_satis_tutari: 0,
            total_toplam_acente_tahsilat: 0,
            total_toplam_ofis_tahsilat: 0,
            total_toplam_tahsilat: 0,
            total_kalan_acente_alacagi: 0,
            total_kalan_ofis_alacagi: 0,
            total_kalan_bakiye: 0,
            total_onaylanan_kalem_sayisi: 0,
            total_bekleyen_kalem_sayisi: 0,
            total_iptal_kalem_sayisi: 0,
            total_toplam_kalem_sayisi: 0,
            magazalar: [],
          });
        }

        const firmaEntry = groupedByFirma.get(firmaKey)!;
        firmaEntry.magazalar.push(magazaItem);

        // Aggregate totals for the company
        firmaEntry.total_toplam_satis_tutari +=
          magazaItem.toplam_satis_tutari || 0;
        firmaEntry.total_toplam_acente_komisyon_tutari +=
          magazaItem.toplam_acente_komisyon_tutari || 0;
        firmaEntry.total_toplam_ofis_komisyon_tutari +=
          magazaItem.toplam_ofis_komisyon_tutari || 0;
        firmaEntry.total_bekleyen_satis_tutari +=
          magazaItem.bekleyen_satis_tutari || 0;
        firmaEntry.total_bekleyen_acente_komisyon_tutari +=
          magazaItem.bekleyen_acente_komisyon_tutari || 0;
        firmaEntry.total_bekleyen_ofis_komisyon_tutari +=
          magazaItem.bekleyen_ofis_komisyon_tutari || 0;
        firmaEntry.total_iptal_satis_tutari +=
          magazaItem.iptal_satis_tutari || 0;
        firmaEntry.total_toplam_acente_tahsilat +=
          magazaItem.toplam_acente_tahsilat || 0;
        firmaEntry.total_toplam_ofis_tahsilat +=
          magazaItem.toplam_ofis_tahsilat || 0;
        firmaEntry.total_toplam_tahsilat += magazaItem.toplam_tahsilat || 0;
        firmaEntry.total_kalan_acente_alacagi +=
          magazaItem.kalan_acente_alacagi || 0;
        firmaEntry.total_kalan_ofis_alacagi +=
          magazaItem.kalan_ofis_alacagi || 0;
        firmaEntry.total_kalan_bakiye += magazaItem.kalan_bakiye || 0;
        firmaEntry.total_onaylanan_kalem_sayisi +=
          magazaItem.onaylanan_kalem_sayisi || 0;
        firmaEntry.total_bekleyen_kalem_sayisi +=
          magazaItem.bekleyen_kalem_sayisi || 0;
        firmaEntry.total_iptal_kalem_sayisi +=
          magazaItem.iptal_kalem_sayisi || 0;
        firmaEntry.total_toplam_kalem_sayisi +=
          magazaItem.toplam_kalem_sayisi || 0;
      });

      const groupedArray = Array.from(groupedByFirma.values());
      console.log("Final grouped data:", groupedArray);

      setGroupedFirmaData(groupedArray);
    } catch (err: any) {
      console.error("Error fetching muhasebe summary:", err.message);
      setError(t("accounting.loadingError") + " " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) {
      return groupedFirmaData;
    }
    return groupedFirmaData.filter(
      (firma) =>
        firma.firma_adi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        firma.magazalar.some((magaza) =>
          magaza.magaza_adi.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );
  }, [groupedFirmaData, searchTerm]);

  const calculateOverallTotals = (data: GroupedFirmaMuhasebe[]) => {
    return data.reduce(
      (acc, firma) => {
        acc.totalSales += firma.total_toplam_satis_tutari;
        acc.totalAcenteCommission += firma.total_toplam_acente_komisyon_tutari;
        acc.totalOfficeCommission += firma.total_toplam_ofis_komisyon_tutari;
        acc.totalCollection += firma.total_toplam_tahsilat;
        acc.totalPendingSales += firma.total_bekleyen_satis_tutari;
        acc.totalRemainingBalance += firma.total_kalan_bakiye;
        return acc;
      },
      {
        totalSales: 0,
        totalAcenteCommission: 0,
        totalOfficeCommission: 0,
        totalCollection: 0,
        totalPendingSales: 0,
        totalRemainingBalance: 0,
      }
    );
  };

  const overallTotals = useMemo(
    () => calculateOverallTotals(filteredData),
    [filteredData]
  );

  const toggleFirmExpansion = (firmaId: string) => {
    setExpandedFirms((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(firmaId)) {
        newSet.delete(firmaId);
      } else {
        newSet.add(firmaId);
      }
      return newSet;
    });
  };

  const exportToCSV = () => {
    const csvData = [];

    // Add header
    csvData.push(
      [
        t("accounting.companyStore"),
        t("accounting.approvedSalesAmount"),
        t("accounting.pendingSalesAmount"),
        t("accounting.cancelledSalesAmount"),
        t("accounting.agencyEarnings"),
        t("accounting.pendingAgencyEarnings"),
        t("accounting.agencyCollection"),
        t("accounting.officeEarnings"),
        t("accounting.officeCollection"),
        t("accounting.remainingAgencyEarnings"),
        t("accounting.remainingOfficeEarnings"),
        t("accounting.status"),
      ].join(";")
    );

    // Add data rows
    filteredData.forEach((firma) => {
      // Add company summary row
      csvData.push(
        [
          `${firma.firma_adi} (${firma.magazalar.length} ${t(
            "accounting.stores"
          )})`,
          `€${firma.total_toplam_satis_tutari.toFixed(2)}`,
          `€${firma.total_bekleyen_satis_tutari.toFixed(2)}`,
          `€${firma.total_iptal_satis_tutari.toFixed(2)}`,
          `€${firma.total_toplam_acente_komisyon_tutari.toFixed(2)}`,
          `€${firma.total_bekleyen_acente_komisyon_tutari.toFixed(2)}`,
          `€${firma.total_toplam_acente_tahsilat.toFixed(2)}`,
          `€${firma.total_toplam_ofis_komisyon_tutari.toFixed(2)}`,
          `€${firma.total_toplam_ofis_tahsilat.toFixed(2)}`,
          `€${firma.total_kalan_acente_alacagi.toFixed(2)}`,
          `€${firma.total_kalan_ofis_alacagi.toFixed(2)}`,
          `${firma.total_onaylanan_kalem_sayisi}/${firma.total_bekleyen_kalem_sayisi}/${firma.total_iptal_kalem_sayisi}`,
        ]
          .map((cell) => (cell.includes(";") ? `"${cell}"` : cell))
          .join(";")
      );

      // Add store detail rows
      firma.magazalar.forEach((magaza) => {
        csvData.push(
          [
            `  ${magaza.magaza_adi}`,
            `€${(magaza.toplam_satis_tutari || 0).toFixed(2)}`,
            `€${(magaza.bekleyen_satis_tutari || 0).toFixed(2)}`,
            `€${(magaza.iptal_satis_tutari || 0).toFixed(2)}`,
            `€${(magaza.toplam_acente_komisyon_tutari || 0).toFixed(2)}`,
            `€${(magaza.bekleyen_acente_komisyon_tutari || 0).toFixed(2)}`,
            `€${(magaza.toplam_acente_tahsilat || 0).toFixed(2)}`,
            `€${(magaza.toplam_ofis_komisyon_tutari || 0).toFixed(2)}`,
            `€${(magaza.toplam_ofis_tahsilat || 0).toFixed(2)}`,
            `€${(magaza.kalan_acente_alacagi || 0).toFixed(2)}`,
            `€${(magaza.kalan_ofis_alacagi || 0).toFixed(2)}`,
            `${magaza.onaylanan_kalem_sayisi || 0}/${
              magaza.bekleyen_kalem_sayisi || 0
            }/${magaza.iptal_kalem_sayisi || 0}`,
          ]
            .map((cell) => (cell.includes(";") ? `"${cell}"` : cell))
            .join(";")
        );
      });
    });

    const csvContent = csvData.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `muhasebe-raporu-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="p-6 text-center">{t("accounting.loading")}</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {t("accounting.companyAccountingReport")}
        </h1>
        <p className="text-gray-600">
          {t("accounting.companyAccountingDescription")}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("accounting.totalSales")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{overallTotals.totalSales.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("accounting.approvedSales")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("accounting.agencyCommission")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{overallTotals.totalAcenteCommission.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("accounting.agencyCommissionDesc")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("accounting.officeCommission")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{overallTotals.totalOfficeCommission.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("accounting.officeCommissionDesc")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("accounting.totalCollection")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{overallTotals.totalCollection.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("accounting.totalCollectionDesc")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">
              {t("accounting.pendingSales")}
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              €{overallTotals.totalPendingSales.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("accounting.pendingSalesDesc")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Export */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t("accounting.searchCompanyStore")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={exportToCSV} className="w-full sm:w-auto">
          <Download className="w-4 h-4 mr-2" />
          {t("accounting.export")}
        </Button>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("accounting.storeAccountingDetails")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>{t("accounting.companyStore")}</TableHead>
                  <TableHead className="text-right">
                    {t("accounting.approvedSalesAmount")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("accounting.pendingSalesAmount")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("accounting.cancelledSalesAmount")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("accounting.agencyEarnings")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("accounting.pendingAgencyEarnings")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("accounting.agencyCollection")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("accounting.officeEarnings")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("accounting.officeCollection")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("accounting.remainingAgencyEarnings")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("accounting.remainingOfficeEarnings")}
                  </TableHead>
                  <TableHead className="text-center">
                    {t("accounting.status")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("accounting.action")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={14}
                      className="text-center text-muted-foreground"
                    >
                      {t("accounting.noDataFound")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((firma) => (
                    <React.Fragment key={firma.firma_id}>
                      {/* Company Summary Row */}
                      <TableRow className="bg-gray-50 hover:bg-gray-100 font-medium">
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFirmExpansion(firma.firma_id)}
                            className="p-1"
                          >
                            {expandedFirms.has(firma.firma_id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-bold">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{firma.firma_adi}</span>
                            <Badge variant="secondary" className="text-xs">
                              {firma.magazalar.length} {t("accounting.stores")}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          €{firma.total_toplam_satis_tutari.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          €{firma.total_bekleyen_satis_tutari.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          €{firma.total_iptal_satis_tutari.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          €
                          {firma.total_toplam_acente_komisyon_tutari.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          €
                          {firma.total_bekleyen_acente_komisyon_tutari.toFixed(
                            2
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          €{firma.total_toplam_acente_tahsilat.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          €{firma.total_toplam_ofis_komisyon_tutari.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          €{firma.total_toplam_ofis_tahsilat.toFixed(2)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-semibold",
                            firma.total_kalan_acente_alacagi > 0
                              ? "text-red-600"
                              : "text-green-600"
                          )}
                        >
                          €{firma.total_kalan_acente_alacagi.toFixed(2)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-semibold",
                            firma.total_kalan_ofis_alacagi > 0
                              ? "text-red-600"
                              : "text-green-600"
                          )}
                        >
                          €{firma.total_kalan_ofis_alacagi.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-1 flex-wrap">
                            {firma.total_onaylanan_kalem_sayisi > 0 && (
                              <Badge
                                variant="outline"
                                className="text-green-600 border-green-200 text-xs"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {firma.total_onaylanan_kalem_sayisi}
                              </Badge>
                            )}
                            {firma.total_bekleyen_kalem_sayisi > 0 && (
                              <Badge
                                variant="outline"
                                className="text-orange-600 border-orange-200 text-xs"
                              >
                                <Clock className="w-3 h-3 mr-1" />
                                {firma.total_bekleyen_kalem_sayisi}
                              </Badge>
                            )}
                            {firma.total_iptal_kalem_sayisi > 0 && (
                              <Badge
                                variant="outline"
                                className="text-red-600 border-red-200 text-xs"
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                {firma.total_iptal_kalem_sayisi}
                              </Badge>
                            )}
                            {firma.total_toplam_kalem_sayisi === 0 && (
                              <Badge
                                variant="outline"
                                className="text-gray-600 border-gray-200 text-xs"
                              >
                                {t("accounting.noData")}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {/* No action button for company summary */}
                        </TableCell>
                      </TableRow>

                      {/* Store Detail Rows */}
                      {expandedFirms.has(firma.firma_id) &&
                        firma.magazalar.map((magaza, index) => (
                          <TableRow
                            key={`${firma.firma_id}-${magaza.magaza_id}`}
                            className={cn(
                              "hover:bg-gray-50 transition-colors",
                              index % 2 === 0 ? "bg-white" : "bg-gray-25"
                            )}
                          >
                            <TableCell></TableCell>
                            <TableCell className="pl-8">
                              <span className="text-gray-700">
                                {magaza.magaza_adi}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              €{(magaza.toplam_satis_tutari || 0).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              €{(magaza.bekleyen_satis_tutari || 0).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              €{(magaza.iptal_satis_tutari || 0).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              €
                              {(
                                magaza.toplam_acente_komisyon_tutari || 0
                              ).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              €
                              {(
                                magaza.bekleyen_acente_komisyon_tutari || 0
                              ).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              €{(magaza.toplam_acente_tahsilat || 0).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              €
                              {(
                                magaza.toplam_ofis_komisyon_tutari || 0
                              ).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              €{(magaza.toplam_ofis_tahsilat || 0).toFixed(2)}
                            </TableCell>
                            <TableCell
                              className={cn(
                                "text-right",
                                (magaza.kalan_acente_alacagi || 0) > 0
                                  ? "text-red-600"
                                  : "text-green-600"
                              )}
                            >
                              €{(magaza.kalan_acente_alacagi || 0).toFixed(2)}
                            </TableCell>
                            <TableCell
                              className={cn(
                                "text-right",
                                (magaza.kalan_ofis_alacagi || 0) > 0
                                  ? "text-red-600"
                                  : "text-green-600"
                              )}
                            >
                              €{(magaza.kalan_ofis_alacagi || 0).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center gap-1 flex-wrap">
                                {(magaza.onaylanan_kalem_sayisi || 0) > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="text-green-600 border-green-200 text-xs"
                                  >
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    {magaza.onaylanan_kalem_sayisi}
                                  </Badge>
                                )}
                                {(magaza.bekleyen_kalem_sayisi || 0) > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="text-orange-600 border-orange-200 text-xs"
                                  >
                                    <Clock className="w-3 h-3 mr-1" />
                                    {magaza.bekleyen_kalem_sayisi}
                                  </Badge>
                                )}
                                {(magaza.iptal_kalem_sayisi || 0) > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="text-red-600 border-red-200 text-xs"
                                  >
                                    <XCircle className="w-3 h-3 mr-1" />
                                    {magaza.iptal_kalem_sayisi}
                                  </Badge>
                                )}
                                {(magaza.toplam_kalem_sayisi || 0) === 0 && (
                                  <Badge
                                    variant="outline"
                                    className="text-gray-600 border-gray-200 text-xs"
                                  >
                                    {t("accounting.noData")}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/muhasebe/${magaza.magaza_id}`
                                  )
                                }
                                className="text-xs"
                              >
                                {t("accounting.detail")}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
