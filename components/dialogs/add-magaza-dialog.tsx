"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"

interface AddMagazaDialogProps {
  open: boolean // isOpen yerine open
  onOpenChange: (open: boolean) => void // onClose yerine onOpenChange
  onMagazaAdded: (newMagazaId: string) => void // ID tipi string
  selectedFirmaId?: string // Opsiyonel olarak firma ID'si alabilir
}

interface Firma {
  id: string // UUID olduğu için string
  firma_adi: string
}

export function AddMagazaDialog({ open, onOpenChange, onMagazaAdded, selectedFirmaId }: AddMagazaDialogProps) {
  const [formData, setFormData] = useState({
    magaza_adi: "",
    il: "",
    ilce: "",
    sektor: "",
    firma_id: selectedFirmaId || "", // selectedFirmaId varsa onu kullan
  })
  const [firmalar, setFirmalar] = useState<Firma[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      fetchFirmalar()
      setFormData((prev) => ({ ...prev, firma_id: selectedFirmaId || "" })) // Dialog açıldığında firma ID'sini güncelle
    }
  }, [open, selectedFirmaId])

  const fetchFirmalar = async () => {
    const { data, error } = await supabase.from("firmalar").select("id, firma_adi").order("firma_adi")
    if (error) {
      console.error("Error fetching firmalar:", error)
      toast({
        title: "Hata!",
        description: "Firmalar yüklenirken bir hata oluştu.",
        variant: "destructive",
      })
    } else {
      setFirmalar(data || [])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const dataToSave = {
        magaza_adi: formData.magaza_adi,
        il: formData.il || null,
        ilce: formData.ilce || null,
        sektor: formData.sektor || null,
        firma_id: formData.firma_id || null, // UUID string olarak
      }

      const { data, error } = await supabase.from("magazalar").insert(dataToSave).select("id").single()

      if (error) throw error

      toast({
        title: "Başarılı!",
        description: `${formData.magaza_adi} mağazası başarıyla eklendi.`,
      })
      onMagazaAdded(data.id)
      setFormData({ magaza_adi: "", il: "", ilce: "", sektor: "", firma_id: selectedFirmaId || "" }) // Resetlerken de selectedFirmaId'yi koru
      onOpenChange(false) // onClose yerine onOpenChange
    } catch (error: any) {
      console.error("Error adding magaza:", error)
      toast({
        title: "Hata!",
        description: `Mağaza eklenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Yeni Mağaza Ekle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="magaza_adi" className="text-right">
              Mağaza Adı *
            </Label>
            <Input
              id="magaza_adi"
              value={formData.magaza_adi}
              onChange={(e) => setFormData({ ...formData, magaza_adi: e.target.value })}
              className="col-span-3"
              required
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="firma_id" className="text-right">
              Firma
            </Label>
            <Select
              value={formData.firma_id}
              onValueChange={(value) => setFormData({ ...formData, firma_id: value })}
              disabled={loading || !!selectedFirmaId} // Eğer selectedFirmaId varsa disabled yap
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Firma seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Firma Seçilmedi</SelectItem> {/* Boş değer için */}
                {firmalar.map((firma) => (
                  <SelectItem key={firma.id} value={firma.id.toString()}>
                    {firma.firma_adi}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="il" className="text-right">
              İl
            </Label>
            <Input
              id="il"
              value={formData.il}
              onChange={(e) => setFormData({ ...formData, il: e.target.value })}
              className="col-span-3"
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ilce" className="text-right">
              İlçe
            </Label>
            <Input
              id="ilce"
              value={formData.ilce}
              onChange={(e) => setFormData({ ...formData, ilce: e.target.value })}
              className="col-span-3"
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sektor" className="text-right">
              Sektör
            </Label>
            <Input
              id="sektor"
              value={formData.sektor}
              onChange={(e) => setFormData({ ...formData, sektor: e.target.value })}
              className="col-span-3"
              disabled={loading}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Ekleniyor..." : "Ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
