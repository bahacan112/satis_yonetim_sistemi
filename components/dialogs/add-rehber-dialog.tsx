"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"

interface AddRehberDialogProps {
  open: boolean // isOpen yerine open olarak güncellendi
  onOpenChange: (open: boolean) => void // onClose yerine onOpenChange olarak güncellendi
  onRehberAdded: (newRehberId: string) => void // ID tipi string olarak güncellendi
}

export function AddRehberDialog({ open, onOpenChange, onRehberAdded }: AddRehberDialogProps) {
  const [rehberAdi, setRehberAdi] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.from("rehberler").insert({ rehber_adi: rehberAdi }).select("id").single()

      if (error) throw error

      toast({
        title: "Başarılı!",
        description: `${rehberAdi} rehberi başarıyla eklendi.`,
      })
      onRehberAdded(data.id) // ID tipi string olarak güncellendi
      setRehberAdi("")
      onOpenChange(false) // Dialogu kapatmak için onOpenChange kullanıldı
    } catch (error: any) {
      console.error("Error adding rehber:", error)
      toast({
        title: "Hata!",
        description: `Rehber eklenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {" "}
      {/* Prop isimleri güncellendi */}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Yeni Rehber Ekle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rehber_adi" className="text-right">
              Rehber Adı *
            </Label>
            <Input
              id="rehber_adi"
              value={rehberAdi}
              onChange={(e) => setRehberAdi(e.target.value)}
              className="col-span-3"
              required
              disabled={loading}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              {" "}
              {/* onOpenChange kullanıldı */}
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
