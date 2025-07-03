"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, Plus, Edit } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"

interface Tur {
  id: string // ID artık UUID olduğu için string
  tur_adi: string
  tur_aciklamasi?: string | null // 'aciklama' yerine 'tur_aciklamasi'
  created_at: string
}

export default function TurlarPage() {
  const { userRole } = useAuth()
  const [turlar, setTurlar] = useState<Tur[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTur, setEditingTur] = useState<Tur | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    tur_adi: "",
    tur_aciklamasi: "", // 'aciklama' yerine 'tur_aciklamasi'
  })
  const [message, setMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchTurlar()
  }, [searchTerm])

  const fetchTurlar = async () => {
    try {
      setLoading(true)
      let query = supabase.from("turlar").select("*")

      if (searchTerm) {
        query = query.ilike("tur_adi", `%${searchTerm}%`)
      }

      const { data, error } = await query.order("tur_adi")

      if (error) throw error
      setTurlar(data || [])
    } catch (error) {
      console.error("Error fetching turlar:", error)
      toast({
        title: "Hata!",
        description: `Turlar getirilirken bir hata oluştu: ${(error as any).message || "Bilinmeyen hata"}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingTur) {
        const { error } = await supabase
          .from("turlar")
          .update({
            tur_adi: formData.tur_adi,
            tur_aciklamasi: formData.tur_aciklamasi, // 'aciklama' yerine 'tur_aciklamasi'
          })
          .eq("id", editingTur.id)

        if (error) throw error
        setMessage("Tur başarıyla güncellendi!")
        toast({
          title: "Başarılı!",
          description: `${formData.tur_adi} turu başarıyla güncellendi.`,
        })
      } else {
        const { error } = await supabase.from("turlar").insert({
          tur_adi: formData.tur_adi,
          tur_aciklamasi: formData.tur_aciklamasi, // 'aciklama' yerine 'tur_aciklamasi'
        })

        if (error) throw error
        setMessage("Tur başarıyla eklendi!")
        toast({
          title: "Başarılı!",
          description: `${formData.tur_adi} turu başarıyla eklendi.`,
        })
      }

      setIsDialogOpen(false)
      setEditingTur(null)
      resetForm()
      fetchTurlar()

      setTimeout(() => setMessage(""), 3000)
    } catch (error: any) {
      console.error("Error saving tur:", error)
      const errorMessage = error.message || error.details || "Bilinmeyen bir hata oluştu."
      setMessage(`Hata: ${errorMessage}`)
      toast({
        title: "Hata!",
        description: `Tur kaydedilirken bir hata oluştu: ${errorMessage}`,
        variant: "destructive",
      })
      setTimeout(() => setMessage(""), 3000)
    }
  }

  const resetForm = () => {
    setFormData({
      tur_adi: "",
      tur_aciklamasi: "", // 'aciklama' yerine 'tur_aciklamasi'
    })
  }

  const handleDelete = async (id: string) => {
    if (userRole !== "admin") {
      setMessage("Bu işlemi yapmaya yetkiniz yok.")
      setTimeout(() => setMessage(""), 3000)
      return
    }
    if (!confirm("Bu turu silmek istediğinizden emin misiniz?")) return

    try {
      const { error } = await supabase.from("turlar").delete().eq("id", id)
      if (error) throw error

      setMessage("Tur başarıyla silindi!")
      toast({
        title: "Başarılı!",
        description: "Tur başarıyla silindi.",
      })
      fetchTurlar()
      setTimeout(() => setMessage(""), 3000)
    } catch (error: any) {
      console.error("Error deleting tur:", error)
      const errorMessage = error.message || error.details || "Bilinmeyen bir hata oluştu."
      setMessage(`Silme hatası: ${errorMessage}`)
      toast({
        title: "Hata!",
        description: `Tur silinirken bir hata oluştu: ${errorMessage}`,
        variant: "destructive",
      })
    }
  }

  const handleAdd = () => {
    setEditingTur(null)
    resetForm()
    setIsDialogOpen(true)
  }

  const handleEdit = (tur: Tur) => {
    setEditingTur(tur)
    setFormData({
      tur_adi: tur.tur_adi,
      tur_aciklamasi: tur.tur_aciklamasi || "", // 'aciklama' yerine 'tur_aciklamasi'
    })
    setIsDialogOpen(true)
  }

  if (userRole !== "admin" && userRole !== "standart") {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>Bu sayfaya sadece yöneticiler erişebilir.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) {
    return <div>Yükleniyor...</div>
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Turlar</h1>
          <p className="text-gray-600">Tur tiplerini yönetin</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Yeni Tur
        </Button>
      </div>

      {message && (
        <Alert className="mb-4">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-4">
        <CardContent className="p-4">
          <Input
            placeholder="Tur adına göre filtrele..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tur Listesi ({turlar.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tur Adı</TableHead>
                <TableHead>Tur Açıklaması</TableHead>
                <TableHead>Oluşturulma Tarihi</TableHead>
                <TableHead>İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {turlar.map((tur) => (
                <TableRow key={tur.id}>
                  <TableCell className="font-medium">{tur.tur_adi}</TableCell>
                  <TableCell>{tur.tur_aciklamasi || "-"}</TableCell> {/* 'aciklama' yerine 'tur_aciklamasi' */}
                  <TableCell>{new Date(tur.created_at).toLocaleDateString("tr-TR")}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(tur)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      {userRole === "admin" && (
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(tur.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTur ? "Tur Güncelle" : "Yeni Tur Ekle"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="tur_adi">Tur Adı *</Label>
              <Input
                id="tur_adi"
                value={formData.tur_adi}
                onChange={(e) => setFormData({ ...formData, tur_adi: e.target.value })}
                placeholder="Örn: Şehir Turu, Doğa Turu"
                required
              />
            </div>
            <div>
              <Label htmlFor="tur_aciklamasi">Tur Açıklaması</Label> {/* 'aciklama' yerine 'tur_aciklamasi' */}
              <Textarea
                id="tur_aciklamasi" // 'aciklama' yerine 'tur_aciklamasi'
                value={formData.tur_aciklamasi}
                onChange={(e) => setFormData({ ...formData, tur_aciklamasi: e.target.value })}
                placeholder="Tur hakkında kısa bir açıklama girin..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                İptal
              </Button>
              <Button type="submit">{editingTur ? "Güncelle" : "Ekle"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
