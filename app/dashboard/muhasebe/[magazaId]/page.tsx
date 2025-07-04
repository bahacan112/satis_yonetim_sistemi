"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { Edit, Trash2, ArrowLeft, CalendarIcon, Download } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { Database } from "@/lib/supabase";
import {
  TahsilatFormDialog,
  type TahsilatFormData,
} from "@/components/tahsilat-form-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter, useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// Sayıya güvenli dönüşüm – null, undefined veya string ise 0 döner
const toNumber = (v: unknown) =>
  typeof v === "number" ? v : Number(v ?? 0) || 0;

// Types
interface Magaza {
  id: string;
  magaza_adi: string;
}

type RawMagazaSatisDetayItem = {
  satis_id: string | null;
  satis_tarihi: string | null;
  grup_gelis_tarihi: string | null;
  grup_pax: number | null;
  magaza_pax: number | null;
  magaza_id: string | null;
  magaza_adi: string | null;
  operator_adi: string | null;
  tur_adi: string | null;
  rehber_adi: string | null;
  firma_adi: string | null;
  urun_id: string | null;
  urun_adi: string | null;
  adet: number | null;
  birim_fiyat: number | null;
  toplam_tutar: number | null;
  acente_komisyon_tutari: number | null;
  rehber_komisyon_tutari: number | null;
  kaptan_komisyon_tutari: number | null;
  ofis_komisyon_tutari: number | null;
  status: string | null;
};

type TahsilatDetay = Omit<
  Database["public"]["Tables"]["tahsilatlar"]["Row"],
  "firma_id"
> & {
  magaza_id: string | null;
};

type ProcessedSaleRow = {
  satis_id: string | null;
  satis_tarihi: string | null;
  grup_gelis_tarihi: string | null;
  operator_adi: string | null;
  tur_adi: string | null;
  grup_pax: number | null;
  magaza_pax: number | null;
  rehber_adi: string | null;
  toplam_satis_tutari: number;
  acente_komisyon_tutari: number;
  ofis_komisyon_tutari: number;
  pax_satis_ort: number;
  productSales: { [productName: string]: number };
};

type CombinedDetailRow =
  | (ProcessedSaleRow & { type: "sale"; displayDate: string; sortDate: Date })
  | (TahsilatDetay & { type: "tahsilat"; displayDate: string; sortDate: Date });

export default function MagazaDetayPage() {
  const router = useRouter();
  const { magazaId } = useParams<{ magazaId: string }>();

  const [magazaAdi, setMagazaAdi] = useState<string>("Yükleniyor...");
  const [onaylananSalesAndTahsilat, setOnaylananSalesAndTahsilat] = useState<
    CombinedDetailRow[]
  >([]);
  const [iptalSales, setIptalSales] = useState<CombinedDetailRow[]>([]);
  const [bekleyenSales, setBekleyenSales] = useState<CombinedDetailRow[]>([]);
  const [allProductNames, setAllProductNames] = useState<string[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [detailMessage, setDetailMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tahsilatToDelete, setTahsilatToDelete] = useState<string | null>(null);

  // Tarih aralığı state'leri
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedTab, setSelectedTab] = useState<
    "onaylandı" | "iptal" | "bekleyen"
  >("onaylandı");

  const [isTahsilatFormOpen, setIsTahsilatFormOpen] = useState(false);
  const [editingTahsilat, setEditingTahsilat] =
    useState<TahsilatFormData | null>(null);
  const [magazalar, setMagazalar] = useState<Magaza[]>([]);

  useEffect(() => {
    if (magazaId) {
      fetchMagazaAdi(magazaId);
      fetchMagazaDetaylari(magazaId, startDate, endDate);
      fetchMagazalarForForm();
    }
  }, [magazaId, startDate, endDate]);

  const fetchMagazaAdi = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("magazalar")
        .select("magaza_adi")
        .eq("id", id)
        .single();
      if (error) throw error;
      setMagazaAdi(data?.magaza_adi || "Bilinmeyen Mağaza");
    } catch (error: any) {
      console.error("Error fetching magaza adi:", error.message);
      setDetailMessage(`Mağaza adı yüklenirken hata: ${error.message}`);
    }
  };

  const fetchMagazalarForForm = async () => {
    try {
      const { data, error } = await supabase
        .from("magazalar")
        .select("id, magaza_adi")
        .order("magaza_adi");
      if (error) throw error;
      setMagazalar(data || []);
    } catch (error: any) {
      console.error("Error fetching magazalar for form:", error.message);
    }
  };

  const processRawSalesData = (rawSalesData: RawMagazaSatisDetayItem[]) => {
    const salesMap = new Map<string, ProcessedSaleRow>();
    const uniqueProductNames = new Set<string>();

    rawSalesData?.forEach((item) => {
      const satisId = item.satis_id;
      if (satisId === null) return;

      if (item.urun_adi) {
        uniqueProductNames.add(item.urun_adi);
      }

      if (!salesMap.has(satisId)) {
        salesMap.set(satisId, {
          satis_id: satisId,
          satis_tarihi: item.satis_tarihi,
          grup_gelis_tarihi: item.grup_gelis_tarihi,
          operator_adi: item.operator_adi,
          tur_adi: item.tur_adi,
          grup_pax: item.grup_pax,
          magaza_pax: item.magaza_pax,
          rehber_adi: item.rehber_adi,
          toplam_satis_tutari: 0,
          acente_komisyon_tutari: 0,
          ofis_komisyon_tutari: 0,
          pax_satis_ort: 0,
          productSales: {},
        });
      }

      const saleRow = salesMap.get(satisId)!;

      const itemTotal = (item.adet || 0) * (item.birim_fiyat || 0);

      saleRow.toplam_satis_tutari +=
        toNumber(item.adet) * toNumber(item.birim_fiyat);
      saleRow.acente_komisyon_tutari += toNumber(item.acente_komisyon_tutari);
      saleRow.ofis_komisyon_tutari += toNumber(item.ofis_komisyon_tutari);

      if (item.urun_adi) {
        saleRow.productSales[item.urun_adi] =
          (saleRow.productSales[item.urun_adi] || 0) + itemTotal;
      }
    });

    const processedSales: CombinedDetailRow[] = Array.from(
      salesMap.values()
    ).map((saleRow) => {
      saleRow.pax_satis_ort =
        saleRow.magaza_pax && saleRow.magaza_pax > 0
          ? saleRow.toplam_satis_tutari / saleRow.magaza_pax
          : 0;

      return {
        ...saleRow,
        type: "sale",
        displayDate: saleRow.satis_tarihi
          ? format(new Date(saleRow.satis_tarihi), "dd.MM.yyyy")
          : "-",
        sortDate: saleRow.satis_tarihi
          ? new Date(saleRow.satis_tarihi)
          : new Date(0),
      };
    });

    return { processedSales, uniqueProductNames };
  };

  const fetchMagazaDetaylari = async (
    id: string,
    startDate?: Date,
    endDate?: Date
  ) => {
    setLoadingDetails(true);
    setDetailMessage("");
    try {
      let startDateStr: string | undefined;
      let endDateStr: string | undefined;

      if (startDate) {
        startDateStr = format(startDate, "yyyy-MM-dd");
      }
      if (endDate) {
        endDateStr = format(endDate, "yyyy-MM-dd");
      }

      console.log(
        `Fetching details for magaza ${id}, period: ${startDateStr} - ${endDateStr}`
      );

      // Build the base query for magaza sales with joins
      const buildSalesQuery = (status: string) => {
        let query = supabase
          .from("magaza_satis_kalemleri")
          .select(
            `
          satis_id,
          urun_id,
          adet,
          birim_fiyat,
          acente_komisyonu,
          rehber_komisyonu,
          kaptan_komisyonu,
          ofis_komisyonu,
          status,
          satislar!inner (
            id,
            magaza_giris_tarihi,
            grup_gelis_tarihi,
            grup_pax,
            magaza_pax,
            magaza_id,
            rehber_id,
            tur_id,
            operator_id,
            magazalar!inner (
              id,
              magaza_adi,
              firmalar (
                firma_adi
              )
            ),
            rehberler (
              rehber_adi
            ),
            turlar (
              tur_adi,
              operatorler (
                operator_adi
              )
            )
          ),
          urunler (
            urun_adi
          )
        `
          )
          .eq("satislar.magaza_id", id)
          .eq("status", status);

        if (startDateStr) {
          query = query.gte("satislar.magaza_giris_tarihi", startDateStr);
        }
        if (endDateStr) {
          query = query.lte("satislar.magaza_giris_tarihi", endDateStr);
        }

        return query;
      };

      // --- Fetch Onaylandı Sales ---
      const { data: rawOnaylandiSalesData, error: onaylandiSalesError } =
        await buildSalesQuery("onaylandı");
      if (onaylandiSalesError) throw onaylandiSalesError;

      // Sort by date on client side
      const sortedOnaylandiData = (rawOnaylandiSalesData || []).sort((a, b) => {
        const dateA = new Date(a.satislar?.magaza_giris_tarihi || 0);
        const dateB = new Date(b.satislar?.magaza_giris_tarihi || 0);
        return dateB.getTime() - dateA.getTime();
      });

      console.log("Onaylandı raw data:", sortedOnaylandiData);

      // Transform the data
      const transformSalesData = (
        rawData: any[]
      ): RawMagazaSatisDetayItem[] => {
        return rawData.map((item) => ({
          satis_id: item.satis_id,
          satis_tarihi: item.satislar?.magaza_giris_tarihi,
          grup_gelis_tarihi: item.satislar?.grup_gelis_tarihi,
          grup_pax: item.satislar?.grup_pax,
          magaza_pax: item.satislar?.magaza_pax,
          magaza_id: item.satislar?.magaza_id,
          magaza_adi: item.satislar?.magazalar?.magaza_adi,
          operator_adi: item.satislar?.turlar?.operatorler?.operator_adi,
          tur_adi: item.satislar?.turlar?.tur_adi,
          rehber_adi: item.satislar?.rehberler?.rehber_adi,
          firma_adi: item.satislar?.magazalar?.firmalar?.firma_adi,
          urun_id: item.urun_id,
          urun_adi: item.urunler?.urun_adi,
          adet: item.adet,
          birim_fiyat: item.birim_fiyat,
          toplam_tutar: (item.adet || 0) * (item.birim_fiyat || 0),
          acente_komisyon_tutari:
            ((item.adet || 0) *
              (item.birim_fiyat || 0) *
              (item.acente_komisyonu || 0)) /
            100,
          rehber_komisyon_tutari:
            ((item.adet || 0) *
              (item.birim_fiyat || 0) *
              (item.rehber_komisyonu || 0)) /
            100,
          kaptan_komisyon_tutari:
            ((item.adet || 0) *
              (item.birim_fiyat || 0) *
              (item.kaptan_komisyonu || 0)) /
            100,
          ofis_komisyon_tutari:
            ((item.adet || 0) *
              (item.birim_fiyat || 0) *
              (item.ofis_komisyonu || 0)) /
            100,
          status: item.status,
        }));
      };

      const transformedOnaylandiData = transformSalesData(sortedOnaylandiData);
      console.log("Transformed onaylandı data:", transformedOnaylandiData);

      let tahsilatQuery = supabase
        .from("tahsilatlar")
        .select("*")
        .eq("magaza_id", id);
      if (startDateStr) {
        tahsilatQuery = tahsilatQuery.gte("tahsilat_tarihi", startDateStr);
      }
      if (endDateStr) {
        tahsilatQuery = tahsilatQuery.lte("tahsilat_tarihi", endDateStr);
      }
      const { data: tahsilatData, error: tahsilatError } =
        await tahsilatQuery.order("tahsilat_tarihi", {
          ascending: false,
        });
      if (tahsilatError) throw tahsilatError;

      console.log("Tahsilat data:", tahsilatData);

      const {
        processedSales: processedOnaylandiSales,
        uniqueProductNames: onaylandiProductNames,
      } = processRawSalesData(transformedOnaylandiData);
      const processedTahsilat = (tahsilatData || []).map((t) => ({
        ...t,
        acente_payi: toNumber(t.acente_payi),
        ofis_payi: toNumber(t.ofis_payi),
        type: "tahsilat",
        displayDate: t.tahsilat_tarihi
          ? format(new Date(t.tahsilat_tarihi), "dd.MM.yyyy")
          : "-",
        sortDate: t.tahsilat_tarihi ? new Date(t.tahsilat_tarihi) : new Date(0),
      }));
      const combinedOnaylandi = [
        ...processedOnaylandiSales,
        ...processedTahsilat,
      ].sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());
      setOnaylananSalesAndTahsilat(combinedOnaylandi);

      // --- Fetch İptal Sales ---
      const { data: rawIptalSalesData, error: iptalSalesError } =
        await buildSalesQuery("iptal");
      if (iptalSalesError) throw iptalSalesError;

      const sortedIptalData = (rawIptalSalesData || []).sort((a, b) => {
        const dateA = new Date(a.satislar?.magaza_giris_tarihi || 0);
        const dateB = new Date(b.satislar?.magaza_giris_tarihi || 0);
        return dateB.getTime() - dateA.getTime();
      });

      console.log("İptal raw data:", sortedIptalData);

      const transformedIptalData = transformSalesData(sortedIptalData);
      const {
        processedSales: processedIptalSales,
        uniqueProductNames: iptalProductNames,
      } = processRawSalesData(transformedIptalData);
      setIptalSales(processedIptalSales);

      // --- Fetch Bekleyen Sales ---
      // Use only "beklemede" status value
      const { data: rawBekleyenSalesData, error: bekleyenSalesError } =
        await buildSalesQuery("beklemede");

      if (bekleyenSalesError)
        console.warn("Error fetching beklemede sales:", bekleyenSalesError);

      const sortedBekleyenData = (rawBekleyenSalesData || []).sort((a, b) => {
        const dateA = new Date(a.satislar?.magaza_giris_tarihi || 0);
        const dateB = new Date(b.satislar?.magaza_giris_tarihi || 0);
        return dateB.getTime() - dateA.getTime();
      });

      console.log("Beklemede raw data:", rawBekleyenSalesData);
      console.log("Sorted beklemede data:", sortedBekleyenData);

      const transformedBekleyenData = transformSalesData(sortedBekleyenData);
      const {
        processedSales: processedBekleyenSales,
        uniqueProductNames: bekleyenProductNames,
      } = processRawSalesData(transformedBekleyenData);
      setBekleyenSales(processedBekleyenSales);

      // Combine all unique product names for table headers
      const allUniqueProductNames = new Set<string>();
      onaylandiProductNames.forEach((name) => allUniqueProductNames.add(name));
      iptalProductNames.forEach((name) => allUniqueProductNames.add(name));
      bekleyenProductNames.forEach((name) => allUniqueProductNames.add(name));
      setAllProductNames(Array.from(allUniqueProductNames).sort());

      console.log("All product names:", Array.from(allUniqueProductNames));
      console.log("Final processed data counts:", {
        onaylandi: processedOnaylandiSales.length,
        iptal: processedIptalSales.length,
        bekleyen: processedBekleyenSales.length,
      });
    } catch (error: any) {
      console.error("Error fetching magaza detayları:", error.message);
      setDetailMessage(`Detaylar yüklenirken hata: ${error.message}`);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleTahsilatSubmit = async (formData: TahsilatFormData) => {
    setDetailMessage("");
    try {
      if (formData.id) {
        const { error } = await supabase
          .from("tahsilatlar")
          .update({
            tahsilat_tarihi: formData.tahsilat_tarihi,
            odeme_kanali: formData.odeme_kanali,
            acente_payi: Number.parseFloat(formData.acente_payi),
            ofis_payi: Number.parseFloat(formData.ofis_payi),
          })
          .eq("id", formData.id);

        if (error) throw error;
        setDetailMessage("Tahsilat başarıyla güncellendi!");
      } else {
        const { error } = await supabase.from("tahsilatlar").insert({
          magaza_id: formData.magaza_id,
          tahsilat_tarihi: formData.tahsilat_tarihi,
          odeme_kanali: formData.odeme_kanali,
          acente_payi: Number.parseFloat(formData.acente_payi),
          ofis_payi: Number.parseFloat(formData.ofis_payi),
        });

        if (error) throw error;
        setDetailMessage("Tahsilat başarıyla eklendi!");
      }
      fetchMagazaDetaylari(magazaId, startDate, endDate);
      setIsTahsilatFormOpen(false);
      setTimeout(() => setDetailMessage(""), 3000);
    } catch (error: any) {
      console.error("Error submitting tahsilat:", error.message);
      setDetailMessage(`Tahsilat işlemi sırasında hata: ${error.message}`);
    }
  };

  const handleEditTahsilat = (tahsilat: TahsilatDetay) => {
    setEditingTahsilat({
      id: tahsilat.id,
      magaza_id: tahsilat.magaza_id || "",
      tahsilat_tarihi: tahsilat.tahsilat_tarihi,
      odeme_kanali: tahsilat.odeme_kanali,
      acente_payi: String(tahsilat.acente_payi),
      ofis_payi: String(tahsilat.ofis_payi),
    });
    setIsTahsilatFormOpen(true);
  };

  const handleDeleteTahsilat = async (tahsilatId: string) => {
    setDetailMessage("");
    try {
      const { error } = await supabase
        .from("tahsilatlar")
        .delete()
        .eq("id", tahsilatId);
      if (error) throw error;
      setDetailMessage("Tahsilat başarıyla silindi!");
      fetchMagazaDetaylari(magazaId, startDate, endDate);
      setTimeout(() => setDetailMessage(""), 3000);
    } catch (error: any) {
      console.error("Error deleting tahsilat:", error.message);
      setDetailMessage(`Tahsilat silinirken hata: ${error.message}`);
    }
  };

  const confirmDelete = (id: string) => {
    setTahsilatToDelete(id);
    setShowDeleteConfirm(true);
  };

  const executeDelete = async () => {
    if (tahsilatToDelete !== null) {
      await handleDeleteTahsilat(tahsilatToDelete);
      setShowDeleteConfirm(false);
      setTahsilatToDelete(null);
    }
  };

  // CSV Export Function
  const exportToCSV = () => {
    try {
      const currentData = combinedDetails;
      if (currentData.length === 0) {
        setDetailMessage("Dışa aktarılacak veri bulunamadı!");
        setTimeout(() => setDetailMessage(""), 3000);
        return;
      }

      // CSV Headers - Tur sütunu eklendi
      const headers = [
        "Tarih",
        "Tip",
        "Operatör/Kanal",
        "Tur",
        "Grup Pax",
        "Mağaza Pax",
        "Rehber",
        ...allProductNames,
        "Toplam Satış",
        "Pax Satış Ort.",
        "Acente Kom.",
        "Ofis Kom.",
      ];

      // CSV Rows
      const rows = currentData.map((item) => {
        const row = [
          item.displayDate,
          item.type === "sale" ? "Satış" : "Tahsilat",
          item.type === "sale"
            ? (item as ProcessedSaleRow).operator_adi || "-"
            : (item as TahsilatDetay).odeme_kanali,
          item.type === "sale"
            ? (item as ProcessedSaleRow).tur_adi || "-"
            : "-", // Tur adı eklendi
          item.type === "sale"
            ? String((item as ProcessedSaleRow).grup_pax || "-")
            : "-",
          item.type === "sale"
            ? String((item as ProcessedSaleRow).magaza_pax || "-")
            : "-",
          item.type === "sale"
            ? (item as ProcessedSaleRow).rehber_adi || "-"
            : "-",
        ];

        // Product columns
        allProductNames.forEach((productName) => {
          if (item.type === "sale") {
            const saleItem = item as ProcessedSaleRow;
            row.push(
              String(toNumber(saleItem.productSales?.[productName]).toFixed(2))
            );
          } else {
            row.push("-");
          }
        });

        // Final columns
        row.push(
          item.type === "sale"
            ? String(
                toNumber(
                  (item as ProcessedSaleRow).toplam_satis_tutari
                ).toFixed(2)
              )
            : "-",
          item.type === "sale"
            ? String(
                toNumber((item as ProcessedSaleRow).pax_satis_ort).toFixed(2)
              )
            : "-",
          item.type === "sale"
            ? String(
                toNumber(
                  (item as ProcessedSaleRow).acente_komisyon_tutari
                ).toFixed(2)
              )
            : String(toNumber((item as TahsilatDetay).acente_payi).toFixed(2)),
          item.type === "sale"
            ? String(
                toNumber(
                  (item as ProcessedSaleRow).ofis_komisyon_tutari
                ).toFixed(2)
              )
            : String(toNumber((item as TahsilatDetay).ofis_payi).toFixed(2))
        );

        return row;
      });

      // Create CSV content
      const csvContent = [headers, ...rows]
        .map((row) =>
          row
            .map((cell) => {
              // Escape quotes and wrap in quotes if contains comma, quote, or newline
              const cellStr = String(cell || "");
              if (
                cellStr.includes(",") ||
                cellStr.includes('"') ||
                cellStr.includes("\n")
              ) {
                return `"${cellStr.replace(/"/g, '""')}"`;
              }
              return cellStr;
            })
            .join(",")
        )
        .join("\n");

      // Add UTF-8 BOM for Turkish character support
      const BOM = "\uFEFF";
      const csvWithBOM = BOM + csvContent;

      // Create and download file
      const blob = new Blob([csvWithBOM], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `${magazaAdi}_${selectedTab}_${format(new Date(), "yyyy-MM-dd")}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDetailMessage("CSV dosyası başarıyla indirildi!");
      setTimeout(() => setDetailMessage(""), 3000);
    } catch (error: any) {
      console.error("CSV export error:", error);
      setDetailMessage(`CSV dışa aktarma hatası: ${error.message}`);
      setTimeout(() => setDetailMessage(""), 3000);
    }
  };

  const calculateTotals = (data: CombinedDetailRow[]) => {
    const totalSalesAmount = data.reduce(
      (sum, item) =>
        item.type === "sale" ? sum + toNumber(item.toplam_satis_tutari) : sum,
      0
    );
    const totalAcenteKomisyon = data.reduce(
      (sum, item) =>
        item.type === "sale"
          ? sum + toNumber(item.acente_komisyon_tutari)
          : sum,
      0
    );
    const totalOfisKomisyon = data.reduce(
      (sum, item) =>
        item.type === "sale" ? sum + toNumber(item.ofis_komisyon_tutari) : sum,
      0
    );
    const totalGrupPax = data.reduce(
      (sum, item) =>
        item.type === "sale" ? sum + toNumber(item.grup_pax) : sum,
      0
    );
    const totalMagazaPax = data.reduce(
      (sum, item) =>
        item.type === "sale" ? sum + toNumber(item.magaza_pax) : sum,
      0
    );
    const totalTahsilatAcentePayi = data.reduce(
      (sum, item) =>
        item.type === "tahsilat" ? sum + toNumber(item.acente_payi) : sum,
      0
    );
    const totalTahsilatOfisPayi = data.reduce(
      (sum, item) =>
        item.type === "tahsilat" ? sum + toNumber(item.ofis_payi) : sum,
      0
    );

    return {
      totalSalesAmount,
      totalAcenteKomisyon,
      totalOfisKomisyon,
      totalGrupPax,
      totalMagazaPax,
      totalTahsilatAcentePayi,
      totalTahsilatOfisPayi,
    };
  };

  const {
    totalSalesAmount: onaylananTotalSalesAmount,
    totalAcenteKomisyon: onaylananTotalAcenteKomisyon,
    totalOfisKomisyon: onaylananTotalOfisKomisyon,
    totalGrupPax: onaylananTotalGrupPax,
    totalMagazaPax: onaylananTotalMagazaPax,
    totalTahsilatAcentePayi: onaylananTotalTahsilatAcentePayi,
    totalTahsilatOfisPayi: onaylananTotalTahsilatOfisPayi,
  } = useMemo(
    () => calculateTotals(onaylananSalesAndTahsilat),
    [onaylananSalesAndTahsilat]
  );

  const {
    totalSalesAmount: iptalTotalSalesAmount,
    totalAcenteKomisyon: iptalTotalAcenteKomisyon,
    totalOfisKomisyon: iptalTotalOfisKomisyon,
    totalGrupPax: iptalTotalGrupPax,
    totalMagazaPax: iptalTotalMagazaPax,
  } = useMemo(() => calculateTotals(iptalSales), [iptalSales]);

  const {
    totalSalesAmount: bekleyenTotalSalesAmount,
    totalAcenteKomisyon: bekleyenTotalAcenteKomisyon,
    totalOfisKomisyon: bekleyenTotalOfisKomisyon,
    totalGrupPax: bekleyenTotalGrupPax,
    totalMagazaPax: bekleyenTotalMagazaPax,
  } = useMemo(() => calculateTotals(bekleyenSales), [bekleyenSales]);

  const combinedDetails = useMemo(() => {
    if (selectedTab === "onaylandı") {
      return onaylananSalesAndTahsilat;
    } else if (selectedTab === "iptal") {
      return iptalSales;
    } else {
      return bekleyenSales;
    }
  }, [selectedTab, onaylananSalesAndTahsilat, iptalSales, bekleyenSales]);

  const displayPeriod = useMemo(() => {
    if (!startDate && !endDate) {
      return "Tüm Kayıtlar";
    } else if (startDate && endDate) {
      return `${format(startDate, "dd.MM.yyyy", { locale: tr })} - ${format(
        endDate,
        "dd.MM.yyyy",
        { locale: tr }
      )}`;
    } else if (startDate) {
      return `${format(startDate, "dd.MM.yyyy", {
        locale: tr,
      })} tarihinden itibaren`;
    } else if (endDate) {
      return `${format(endDate, "dd.MM.yyyy", { locale: tr })} tarihine kadar`;
    }
    return "Tüm Kayıtlar";
  }, [startDate, endDate]);

  const clearDates = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  if (loadingDetails) {
    return <div className="p-6">Detaylar yükleniyor...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Geri</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {magazaAdi} Detayları
            </h1>
            <p className="text-gray-600">
              Seçilen mağaza için mağaza satış detayları (rehber satışları
              hariç).
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            CSV Dışa Aktar
          </Button>
          {selectedTab === "onaylandı" && (
            <Button
              onClick={() => {
                setEditingTahsilat({
                  id: undefined,
                  magaza_id: magazaId,
                  tahsilat_tarihi: format(new Date(), "yyyy-MM-dd"),
                  odeme_kanali: "",
                  acente_payi: "0",
                  ofis_payi: "0",
                });
                setIsTahsilatFormOpen(true);
              }}
            >
              Yeni Tahsilat Ekle
            </Button>
          )}
        </div>
      </div>

      {detailMessage && (
        <Alert className="mb-4">
          <AlertDescription>{detailMessage}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center space-x-4 mb-4">
        <div className="flex items-center space-x-2">
          <Label>Başlangıç Tarihi:</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate
                  ? format(startDate, "dd.MM.yyyy", { locale: tr })
                  : "Tarih seçin"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center space-x-2">
          <Label>Bitiş Tarihi:</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate
                  ? format(endDate, "dd.MM.yyyy", { locale: tr })
                  : "Tarih seçin"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button variant="outline" onClick={clearDates}>
          Tarihleri Temizle
        </Button>
      </div>

      <Tabs
        value={selectedTab}
        onValueChange={(value) =>
          setSelectedTab(value as "onaylandı" | "iptal" | "bekleyen")
        }
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="onaylandı">Onaylanan Satışlar</TabsTrigger>
          <TabsTrigger value="iptal">İptal Edilen Satışlar</TabsTrigger>
          <TabsTrigger value="bekleyen">Bekleyen Satışlar</TabsTrigger>
        </TabsList>

        <TabsContent value="onaylandı">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>
                Onaylanan Mağaza Satışları Özeti ({displayPeriod})
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-sm text-gray-500">Toplam Satış Tutarı</div>
                <div className="text-lg font-bold">
                  €{toNumber(onaylananTotalSalesAmount).toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">Toplam Grup Pax</div>
                <div className="text-lg font-bold">{onaylananTotalGrupPax}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">Toplam Mağaza Pax</div>
                <div className="text-lg font-bold">
                  {onaylananTotalMagazaPax}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">
                  Pax Satış Ortalaması
                </div>
                <div className="text-lg font-bold">
                  €
                  {onaylananTotalMagazaPax > 0
                    ? (
                        toNumber(onaylananTotalSalesAmount) /
                        onaylananTotalMagazaPax
                      ).toFixed(2)
                    : "0.00"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">
                  Toplam Acente Komisyonu
                </div>
                <div className="text-lg font-bold">
                  €{toNumber(onaylananTotalAcenteKomisyon).toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">
                  Toplam Ofis Komisyonu
                </div>
                <div className="text-lg font-bold">
                  €{toNumber(onaylananTotalOfisKomisyon).toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">
                  Toplam Tahsilat Acente Payı
                </div>
                <div className="text-lg font-bold">
                  €{toNumber(onaylananTotalTahsilatAcentePayi).toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">
                  Toplam Tahsilat Ofis Payı
                </div>
                <div className="text-lg font-bold">
                  €{toNumber(onaylananTotalTahsilatOfisPayi).toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">
                  Kalan Acente Alacağı
                </div>
                <div className="text-lg font-bold">
                  €
                  {(
                    toNumber(onaylananTotalAcenteKomisyon) -
                    toNumber(onaylananTotalTahsilatAcentePayi)
                  ).toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">Kalan Ofis Alacağı</div>
                <div className="text-lg font-bold">
                  €
                  {(
                    toNumber(onaylananTotalOfisKomisyon) -
                    toNumber(onaylananTotalTahsilatOfisPayi)
                  ).toFixed(2)}
                </div>
              </div>
            </CardContent>
            <CardContent className="flex-grow overflow-hidden p-0">
              <ScrollArea className="h-full w-full pr-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Tip</TableHead>
                      <TableHead>Operatör/Kanal</TableHead>
                      <TableHead>Tur</TableHead>
                      <TableHead>Grup Pax</TableHead>
                      <TableHead>Mağaza Pax</TableHead>
                      <TableHead>Rehber</TableHead>
                      {allProductNames.map((productName) => (
                        <TableHead key={productName}>{productName}</TableHead>
                      ))}
                      <TableHead>Toplam Satış</TableHead>
                      <TableHead>Pax Satış Ort.</TableHead>
                      <TableHead>Acente Kom.</TableHead>
                      <TableHead>Ofis Kom.</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {combinedDetails.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7 + allProductNames.length + 5}
                          className="text-center text-gray-500"
                        >
                          Bu dönem için detay bulunmamaktadır.
                        </TableCell>
                      </TableRow>
                    ) : (
                      combinedDetails.map((item, index) =>
                        item.type === "sale" ? (
                          <TableRow key={`sale-${item.satis_id}-${index}`}>
                            <TableCell>{item.displayDate}</TableCell>
                            <TableCell>Satış</TableCell>
                            <TableCell>{item.operator_adi}</TableCell>
                            <TableCell>{item.tur_adi}</TableCell>
                            <TableCell>{item.grup_pax || "-"}</TableCell>
                            <TableCell>{item.magaza_pax || "-"}</TableCell>
                            <TableCell>{item.rehber_adi}</TableCell>
                            {allProductNames.map((productName) => (
                              <TableCell key={productName}>
                                €
                                {toNumber(
                                  (item as ProcessedSaleRow).productSales?.[
                                    productName
                                  ]
                                ).toFixed(2)}
                              </TableCell>
                            ))}
                            <TableCell>
                              €{toNumber(item.toplam_satis_tutari).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              €{toNumber(item.pax_satis_ort).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              €
                              {toNumber(item.acente_komisyon_tutari).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              €{toNumber(item.ofis_komisyon_tutari).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              {/* Satışlar için düzenleme/silme yok */}
                            </TableCell>
                          </TableRow>
                        ) : (
                          <TableRow
                            key={`tahsilat-${item.id}`}
                            className="bg-green-50/50"
                          >
                            <TableCell>{item.displayDate}</TableCell>
                            <TableCell>Tahsilat</TableCell>
                            <TableCell>{item.odeme_kanali}</TableCell>
                            <TableCell>{/* Tur for tahsilat */}</TableCell>
                            <TableCell>{/* Grup Pax for tahsilat */}</TableCell>
                            <TableCell>{/* Mağaza Pax for tahsil */}</TableCell>
                            <TableCell>{/* Rehber for tahsilat */}</TableCell>
                            {allProductNames.map((productName) => (
                              <TableCell key={productName}></TableCell>
                            ))}
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell>
                              €{toNumber(item.acente_payi).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              €{toNumber(item.ofis_payi).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditTahsilat(item)}
                                className="mr-2"
                              >
                                <Edit className="w-4 h-4" />
                                <span className="sr-only">Düzenle</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => confirmDelete(item.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="sr-only">Sil</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      )
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="iptal">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>
                İptal Edilen Mağaza Satışları Özeti ({displayPeriod})
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-sm text-gray-500">
                  Toplam İptal Satış Tutarı
                </div>
                <div className="text-lg font-bold">
                  €{toNumber(iptalTotalSalesAmount).toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">
                  Toplam İptal Grup Pax
                </div>
                <div className="text-lg font-bold">{iptalTotalGrupPax}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">
                  Toplam İptal Mağaza Pax
                </div>
                <div className="text-lg font-bold">{iptalTotalMagazaPax}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">
                  Pax Satış Ortalaması
                </div>
                <div className="text-lg font-bold">
                  €
                  {iptalTotalMagazaPax > 0
                    ? (
                        toNumber(iptalTotalSalesAmount) / iptalTotalMagazaPax
                      ).toFixed(2)
                    : "0.00"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">
                  Toplam İptal Acente Komisyonu
                </div>
                <div className="text-lg font-bold">
                  €{toNumber(iptalTotalAcenteKomisyon).toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">
                  Toplam İptal Ofis Komisyonu
                </div>
                <div className="text-lg font-bold">
                  €{toNumber(iptalTotalOfisKomisyon).toFixed(2)}
                </div>
              </div>
            </CardContent>
            <CardContent className="flex-grow overflow-hidden p-0">
              <ScrollArea className="h-full w-full pr-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Operatör</TableHead>
                      <TableHead>Tur</TableHead>
                      <TableHead>Grup Pax</TableHead>
                      <TableHead>Mağaza Pax</TableHead>
                      <TableHead>Rehber</TableHead>
                      {allProductNames.map((productName) => (
                        <TableHead key={productName}>{productName}</TableHead>
                      ))}
                      <TableHead>Toplam Satış</TableHead>
                      <TableHead>Pax Satış Ort.</TableHead>
                      <TableHead>Acente Kom.</TableHead>
                      <TableHead>Ofis Kom.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {combinedDetails.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7 + allProductNames.length + 2}
                          className="text-center text-gray-500"
                        >
                          Bu dönem için iptal edilen satış bulunmamaktadır.
                        </TableCell>
                      </TableRow>
                    ) : (
                      combinedDetails.map((item, index) => {
                        if (item.type !== "sale") return null; // Should not happen for this tab, but for type safety
                        const saleItem = item; // TypeScript will now correctly infer saleItem as ProcessedSaleRow
                        return (
                          <TableRow
                            key={`cancelled-sale-${saleItem.satis_id}-${index}`}
                          >
                            <TableCell>{saleItem.displayDate}</TableCell>
                            <TableCell>{saleItem.operator_adi}</TableCell>
                            <TableCell>{saleItem.tur_adi}</TableCell>
                            <TableCell>{saleItem.grup_pax || "-"}</TableCell>
                            <TableCell>{saleItem.magaza_pax || "-"}</TableCell>
                            <TableCell>{saleItem.rehber_adi}</TableCell>
                            {allProductNames.map((productName) => (
                              <TableCell key={productName}>
                                €
                                {toNumber(
                                  saleItem.productSales?.[productName]
                                ).toFixed(2)}
                              </TableCell>
                            ))}
                            <TableCell>
                              €
                              {toNumber(saleItem.toplam_satis_tutari).toFixed(
                                2
                              )}
                            </TableCell>
                            <TableCell>
                              €{toNumber(saleItem.pax_satis_ort).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              €
                              {toNumber(
                                saleItem.acente_komisyon_tutari
                              ).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              €
                              {toNumber(saleItem.ofis_komisyon_tutari).toFixed(
                                2
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bekleyen">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>
                Bekleyen Mağaza Satışları Özeti ({displayPeriod})
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-sm text-gray-500">
                  Toplam Bekleyen Satış Tutarı
                </div>
                <div className="text-lg font-bold">
                  €{toNumber(bekleyenTotalSalesAmount).toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">
                  Toplam Bekleyen Grup Pax
                </div>
                <div className="text-lg font-bold">{bekleyenTotalGrupPax}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">
                  Toplam Bekleyen Mağaza Pax
                </div>
                <div className="text-lg font-bold">
                  {bekleyenTotalMagazaPax}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">
                  Pax Satış Ortalaması
                </div>
                <div className="text-lg font-bold">
                  €
                  {bekleyenTotalMagazaPax > 0
                    ? (
                        toNumber(bekleyenTotalSalesAmount) /
                        bekleyenTotalMagazaPax
                      ).toFixed(2)
                    : "0.00"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">
                  Toplam Bekleyen Acente Komisyonu
                </div>
                <div className="text-lg font-bold">
                  €{toNumber(bekleyenTotalAcenteKomisyon).toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">
                  Toplam Bekleyen Ofis Komisyonu
                </div>
                <div className="text-lg font-bold">
                  €{toNumber(bekleyenTotalOfisKomisyon).toFixed(2)}
                </div>
              </div>
            </CardContent>
            <CardContent className="flex-grow overflow-hidden p-0">
              <ScrollArea className="h-full w-full pr-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Operatör</TableHead>
                      <TableHead>Tur</TableHead>
                      <TableHead>Grup Pax</TableHead>
                      <TableHead>Mağaza Pax</TableHead>
                      <TableHead>Rehber</TableHead>
                      {allProductNames.map((productName) => (
                        <TableHead key={productName}>{productName}</TableHead>
                      ))}
                      <TableHead>Toplam Satış</TableHead>
                      <TableHead>Pax Satış Ort.</TableHead>
                      <TableHead>Acente Kom.</TableHead>
                      <TableHead>Ofis Kom.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {combinedDetails.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7 + allProductNames.length + 2}
                          className="text-center text-gray-500"
                        >
                          Bu dönem için bekleyen satış bulunmamaktadır.
                        </TableCell>
                      </TableRow>
                    ) : (
                      combinedDetails.map((item, index) => {
                        if (item.type !== "sale") return null; // Should not happen for this tab, but for type safety
                        const saleItem = item; // TypeScript will now correctly infer saleItem as ProcessedSaleRow
                        return (
                          <TableRow
                            key={`pending-sale-${saleItem.satis_id}-${index}`}
                          >
                            <TableCell>{saleItem.displayDate}</TableCell>
                            <TableCell>{saleItem.operator_adi}</TableCell>
                            <TableCell>{saleItem.tur_adi}</TableCell>
                            <TableCell>{saleItem.grup_pax || "-"}</TableCell>
                            <TableCell>{saleItem.magaza_pax || "-"}</TableCell>
                            <TableCell>{saleItem.rehber_adi}</TableCell>
                            {allProductNames.map((productName) => (
                              <TableCell key={productName}>
                                €
                                {toNumber(
                                  saleItem.productSales?.[productName]
                                ).toFixed(2)}
                              </TableCell>
                            ))}
                            <TableCell>
                              €
                              {toNumber(saleItem.toplam_satis_tutari).toFixed(
                                2
                              )}
                            </TableCell>
                            <TableCell>
                              €{toNumber(saleItem.pax_satis_ort).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              €
                              {toNumber(
                                saleItem.acente_komisyon_tutari
                              ).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              €
                              {toNumber(saleItem.ofis_komisyon_tutari).toFixed(
                                2
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tahsilat Ekle/Düzenle Dialog */}
      <TahsilatFormDialog
        isOpen={isTahsilatFormOpen}
        onClose={() => setIsTahsilatFormOpen(false)}
        onSubmit={handleTahsilatSubmit}
        initialData={editingTahsilat}
        magazalar={magazalar}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Tahsilatı Silmek İstediğinizden Emin Misiniz?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Tahsilat kaydı kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>
              İptal
            </AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete}>Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
