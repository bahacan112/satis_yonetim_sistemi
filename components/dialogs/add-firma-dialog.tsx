"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"

interface AddFirmaDialogProps {
  open: boolean // isOpen yerine open
  onOpenChange: (open: boolean) => void // onClose yerine onOpenChange
  onFirmaAdded: (newFirmaId: string) => void // ID tipi string
}

export function AddFirmaDialog({ open, onOpenChange, onFirmaAdded }: AddFirmaDialogProps) {
  const [firmaAdi, setFirmaAdi] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.from("firmalar").insert({ firma_adi: firmaAdi }).select("id").single()

      if (error) throw error

      toast({
        title: "Başarılı!",
        description: `${firmaAdi} firması başarıyla eklendi.`,
      })
      onFirmaAdded(data.id) // ID tipi string
      setFirmaAdi("")
      onOpenChange(false) // onClose yerine onOpenChange
    } catch (error: any) {
      console.error("Error adding firma:", error)
      toast({
        title: "Hata!",
        description: `Firma eklenirken bir hata oluştu: ${error.message}`,
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
          <DialogTitle>Yeni Firma Ekle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="firma_adi" className="text-right">
              Firma Adı *
            </Label>
            <Input
              id="firma_adi"
              value={firmaAdi}
              onChange={(e) => setFirmaAdi(e.target.value)}
              className="col-span-3"
              required
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
