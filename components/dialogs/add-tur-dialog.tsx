"use client"

import { Textarea } from "@/components/ui/textarea"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"

interface AddTurDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTurAdded: (newTurId: string) => void
}

export function AddTurDialog({ open, onOpenChange, onTurAdded }: AddTurDialogProps) {
  const [turAdi, setTurAdi] = useState("")
  const [loading, setLoading] = useState(false)
  const [turAciklamasi, setTurAciklamasi] = useState("") // Yeni state: turAciklamasi

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from("turlar")
        .insert({
          tur_adi: turAdi,
          tur_aciklamasi: turAciklamasi, // 'aciklama' yerine 'tur_aciklamasi'
        })
        .select("id")
        .single()

      if (error) throw error

      toast({
        title: "Başarılı!",
        description: `${turAdi} turu başarıyla eklendi.`,
      })
      onTurAdded(data.id)
      setTurAdi("")
      setTurAciklamasi("") // Reset turAciklamasi
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error adding tur:", error)
      const errorMessage = error.message || error.details || "Bilinmeyen bir hata oluştu."
      toast({
        title: "Hata!",
        description: `Tur eklenirken bir hata oluştu: ${errorMessage}`,
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
          <DialogTitle>Yeni Tur Ekle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tur_adi" className="text-right">
              Tur Adı
            </Label>
            <Input
              id="tur_adi"
              value={turAdi}
              onChange={(e) => setTurAdi(e.target.value)}
              className="col-span-3"
              required
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tur_aciklamasi" className="text-right">
              {" "}
              {/* 'aciklama' yerine 'tur_aciklamasi' */}
              Tur Açıklaması
            </Label>
            <Textarea
              id="tur_aciklamasi" // 'aciklama' yerine 'tur_aciklamasi'
              value={turAciklamasi}
              onChange={(e) => setTurAciklamasi(e.target.value)}
              className="col-span-3"
              placeholder="Tur hakkında kısa bir açıklama girin..."
              rows={3}
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
