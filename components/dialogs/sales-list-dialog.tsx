"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

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

interface SalesListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  status: "beklemede" | "iptal";
}

export function SalesListDialog({
  isOpen,
  onClose,
  status,
}: SalesListDialogProps) {
  const [sales, setSales] = React.useState<SalesItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const supabase = createClient();

  React.useEffect(() => {
    if (isOpen) {
      const fetchSales = async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from("satis_kalemleri_detay_view")
          .select("*")
          .eq("status", status)
          .order("magaza_giris_tarihi", { ascending: false });

        if (error) {
          console.error("Satışları çekerken hata oluştu:", error);
        } else {
          setSales(data);
        }
        setLoading(false);
      };
      fetchSales();
    } else {
      setSales([]);
    }
  }, [isOpen, status]);

  const getStatusBadge = (saleStatus: string) => {
    switch (saleStatus) {
      case "beklemede":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-200 text-yellow-800 text-xs"
          >
            Beklemede
          </Badge>
        );
      case "iptal":
        return (
          <Badge variant="destructive" className="text-xs">
            İptal
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {status === "beklemede"
              ? "Tüm Bekleyen Satışlar"
              : "Tüm İptal Edilen Satışlar"}
          </DialogTitle>
          <DialogDescription>
            {status === "beklemede"
              ? "Sistemdeki tüm beklemede olan satışların listesi."
              : "Sistemdeki tüm iptal edilen satışların listesi."}
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : sales.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            {status === "beklemede"
              ? "Bekleyen satış bulunmuyor."
              : "İptal edilen satış bulunmuyor."}
          </p>
        ) : (
          <ScrollArea className="h-[500px] w-full rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mağaza Giriş Tarihi</TableHead>
                  <TableHead>Mağaza</TableHead>
                  <TableHead>Tur</TableHead>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      {format(new Date(sale.magaza_giris_tarihi), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>{sale.magaza_adi}</TableCell>
                    <TableCell>{sale.tur_adi}</TableCell>
                    <TableCell>{sale.urun_adi}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {sale.satis_aciklamasi || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(sale.adet * sale.birim_fiyat)}
                    </TableCell>
                    <TableCell>{getStatusBadge(sale.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
