"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TahsilatFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TahsilatFormData) => Promise<void>;
  initialData?: TahsilatFormData | null; // For editing
  magazalar: { id: string; magaza_adi: string }[]; // Changed from number to string
}

export interface TahsilatFormData {
  id?: string; // Optional for new tahsilat, changed from number to string
  magaza_id: string; // Changed from firma_id to magaza_id
  tahsilat_tarihi: string;
  odeme_kanali: string;
  acente_payi: string;
  ofis_payi: string;
}

export function TahsilatFormDialog({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  magazalar,
}: TahsilatFormDialogProps) {
  const [formData, setFormData] = useState<TahsilatFormData>({
    magaza_id: "", // Changed from firma_id
    tahsilat_tarihi: new Date().toISOString().split("T")[0],
    odeme_kanali: "",
    acente_payi: "0",
    ofis_payi: "0",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        magaza_id: String(initialData.magaza_id), // Changed from firma_id
        tahsilat_tarihi: initialData.tahsilat_tarihi,
        odeme_kanali: initialData.odeme_kanali,
        acente_payi: String(initialData.acente_payi),
        ofis_payi: String(initialData.ofis_payi),
      });
    } else {
      setFormData({
        magaza_id: "", // Changed from firma_id
        tahsilat_tarihi: new Date().toISOString().split("T")[0],
        odeme_kanali: "",
        acente_payi: "0",
        ofis_payi: "0",
      });
    }
  }, [initialData, isOpen]); // Reset form when dialog opens or initialData changes

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string, id: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    onClose(); // Close dialog after submission
  };

  const dialogTitle = initialData ? "Tahsilatı Düzenle" : "Yeni Tahsilat Ekle";
  const submitButtonText = initialData
    ? "Tahsilatı Güncelle"
    : "Tahsilatı Ekle";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="magaza_id">Mağaza *</Label> {/* Changed label */}
            <Select
              value={formData.magaza_id}
              onValueChange={(value) => handleSelectChange(value, "magaza_id")} // Changed id
              required
              disabled={!!initialData} // Disable magaza selection when editing
            >
              <SelectTrigger>
                <SelectValue placeholder="Mağaza seçin" />{" "}
                {/* Changed placeholder */}
              </SelectTrigger>
              <SelectContent>
                {magazalar.map(
                  (
                    magaza // Changed firmalar to magazalar
                  ) => (
                    <SelectItem key={magaza.id} value={magaza.id.toString()}>
                      {magaza.magaza_adi}{" "}
                      {/* Changed firma_adi to magaza_adi */}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="tahsilat_tarihi">Tahsilat Tarihi *</Label>
            <Input
              id="tahsilat_tarihi"
              type="date"
              value={formData.tahsilat_tarihi}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="odeme_kanali">Ödeme Kanalı *</Label>
            <Input
              id="odeme_kanali"
              value={formData.odeme_kanali}
              onChange={handleChange}
              placeholder="Nakit, Banka Havalesi, Kredi Kartı vb."
              required
            />
          </div>
          <div>
            <Label htmlFor="acente_payi">Acente Payı (€)</Label>
            <Input
              id="acente_payi"
              type="number"
              step="0.01"
              min="0"
              value={formData.acente_payi}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="ofis_payi">Ofis Payı (€)</Label>
            <Input
              id="ofis_payi"
              type="number"
              step="0.01"
              min="0"
              value={formData.ofis_payi}
              onChange={handleChange}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit">{submitButtonText}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
