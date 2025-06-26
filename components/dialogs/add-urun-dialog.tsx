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

interface AddUrunDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUrunAdded: (newUrunId: string) => void
  selectedMagazaId?: string // Seçili mağaza ID'si
}

interface Urun {
  id: string
  urun_adi: string
}

export function AddUrunDialog({ open, onOpenChange, onUrunAdded, selectedMagazaId }: AddUrunDialogProps) {
  const [urunAdi, setUrunAdi] = useState("")
  const [selectedUrunId, setSelectedUrunId] = useState("")
  const [acenteKomisyonu, setAcenteKomisyonu] = useState("0")
  const [rehberKomisyonu, setRehberKomisyonu] = useState("0")
  const [kaptanKomisyonu, setKaptanKomisyonu] = useState("0")
  const [ofisKomisyonu, setOfisKomisyonu] = useState("0")
  const [loading, setLoading] = useState(false)
  const [urunler, setUrunler] = useState<Urun[]>([])
  const [isNewUrun, setIsNewUrun] = useState(false)

  useEffect(() => {
    if (open) {
      fetchUrunler()
    }
  }, [open])

  const fetchUrunler = async () => {
    try {
      const { data, error } = await supabase.from("urunler").select("id, urun_adi").order("urun_adi")

      if (error) throw error
      setUrunler(data || [])
    } catch (error) {
      console.error("Error fetching urunler:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedMagazaId) {
      toast({
        title: "Hata!",
        description: "Önce bir mağaza seçmelisiniz.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      let urunId = selectedUrunId

      // Eğer yeni ürün ekliyorsak, önce ürünü oluştur
      if (isNewUrun && urunAdi.trim()) {
        const { data: newUrun, error: urunError } = await supabase
          .from("urunler")
          .insert({ urun_adi: urunAdi.trim() })
          .select("id")
          .single()

        if (urunError) throw urunError
        urunId = newUrun.id
      }

      if (!urunId) {
        toast({
          title: "Hata!",
          description: "Ürün seçimi gereklidir.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Mağaza ürünü olarak ekle
      const { data: magazaUrun, error: magazaUrunError } = await supabase
        .from("magaza_urunler")
        .insert({
          magaza_id: selectedMagazaId,
          urun_id: urunId,
          acente_komisyonu: Number.parseFloat(acenteKomisyonu),
          rehber_komisyonu: Number.parseFloat(rehberKomisyonu),
          kaptan_komisyonu: Number.parseFloat(kaptanKomisyonu),
          ofis_komisyonu: Number.parseFloat(ofisKomisyonu),
          aktif: true,
        })
        .select("urun_id")
        .single()

      if (magazaUrunError) throw magazaUrunError

      toast({
        title: "Başarılı!",
        description: `Ürün mağazaya başarıyla eklendi.`,
      })

      onUrunAdded(urunId)
      resetForm()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error adding magaza urun:", error)
      toast({
        title: "Hata!",
        description: `Ürün eklenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setUrunAdi("")
    setSelectedUrunId("")
    setAcenteKomisyonu("0")
    setRehberKomisyonu("0")
    setKaptanKomisyonu("0")
    setOfisKomisyonu("0")
    setIsNewUrun(false)
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Mağazaya Ürün Ekle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label>Ürün Seçimi</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={!isNewUrun ? "default" : "outline"}
                  onClick={() => setIsNewUrun(false)}
                  className="flex-1"
                >
                  Mevcut Ürün
                </Button>
                <Button
                  type="button"
                  variant={isNewUrun ? "default" : "outline"}
                  onClick={() => setIsNewUrun(true)}
                  className="flex-1"
                >
                  Yeni Ürün
                </Button>
              </div>
            </div>

            {isNewUrun ? (
              <div>
                <Label htmlFor="urun_adi">Yeni Ürün Adı</Label>
                <Input
                  id="urun_adi"
                  value={urunAdi}
                  onChange={(e) => setUrunAdi(e.target.value)}
                  placeholder="Ürün adını girin"
                  required
                  disabled={loading}
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="selected_urun">Mevcut Ürün</Label>
                <Select value={selectedUrunId} onValueChange={setSelectedUrunId} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ürün seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {urunler.map((urun) => (
                      <SelectItem key={urun.id} value={urun.id}>
                        {urun.urun_adi}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="acente_komisyonu">Acente Komisyonu (%)</Label>
                <Input
                  id="acente_komisyonu"
                  type="number"
                  step="0.01"
                  value={acenteKomisyonu}
                  onChange={(e) => setAcenteKomisyonu(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="rehber_komisyonu">Rehber Komisyonu (%)</Label>
                <Input
                  id="rehber_komisyonu"
                  type="number"
                  step="0.01"
                  value={rehberKomisyonu}
                  onChange={(e) => setRehberKomisyonu(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="kaptan_komisyonu">Kaptan Komisyonu (%)</Label>
                <Input
                  id="kaptan_komisyonu"
                  type="number"
                  step="0.01"
                  value={kaptanKomisyonu}
                  onChange={(e) => setKaptanKomisyonu(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="ofis_komisyonu">Ofis Komisyonu (%)</Label>
                <Input
                  id="ofis_komisyonu"
                  type="number"
                  step="0.01"
                  value={ofisKomisyonu}
                  onChange={(e) => setOfisKomisyonu(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
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
