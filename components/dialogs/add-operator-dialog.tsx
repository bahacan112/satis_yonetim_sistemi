"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { useSupabaseClient } from "@supabase/auth-helpers-react"

interface AddOperatorDialogProps {
  open: boolean // isOpen yerine open
  onOpenChange: (open: boolean) => void // onClose yerine onOpenChange
  onOperatorAdded: (newOperatorId: string) => void
}

export function AddOperatorDialog({ open, onOpenChange, onOperatorAdded }: AddOperatorDialogProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "standart",
    ad_soyad: "",
    telefon: "",
  })
  const [loading, setLoading] = useState(false)
  const supabase = useSupabaseClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Kullanıcı oluşturulamadı")
      }

      const result = await response.json()
      // BURADAKİ DEĞİŞİKLİK: Yeni oluşturulan kullanıcının ID'sini operatör tablosuna eklerken kullanın
      const { error } = await supabase.from("operatorler").insert({
        id: result.userId, // <-- Bu satırı ekleyin veya güncelleyin
        operator_adi: formData.ad_soyad,
      })

      if (error) throw error

      toast({
        title: "Başarılı!",
        description: `${formData.ad_soyad || formData.email} operatörü başarıyla eklendi.`,
      })
      onOperatorAdded(result.userId)
      setFormData({ email: "", password: "", role: "standart", ad_soyad: "", telefon: "" })
      onOpenChange(false) // onClose yerine onOpenChange
    } catch (error: any) {
      console.error("Error adding operator:", error)
      toast({
        title: "Hata!",
        description: `Operatör eklenirken bir hata oluştu: ${error.message}`,
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
          <DialogTitle>Yeni Operatör Ekle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              E-posta *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="col-span-3"
              required
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              Şifre *
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="col-span-3"
              required
              minLength={6}
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Rol *
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
              disabled={loading}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standart">Standart Kullanıcı</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ad_soyad" className="text-right">
              Ad Soyad
            </Label>
            <Input
              id="ad_soyad"
              value={formData.ad_soyad}
              onChange={(e) => setFormData({ ...formData, ad_soyad: e.target.value })}
              className="col-span-3"
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="telefon" className="text-right">
              Telefon
            </Label>
            <Input
              id="telefon"
              value={formData.telefon}
              onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
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
