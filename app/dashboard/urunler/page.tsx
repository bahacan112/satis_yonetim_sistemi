"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Edit, Plus, Trash2 } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Urun {
  id: string // ← UUID now
  urun_adi: string
  urun_aciklamasi?: string
  created_at: string
}

export default function UrunlerPage() {
  const { userRole } = useAuth()

  const [urunler, setUrunler] = useState<Urun[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUrun, setEditingUrun] = useState<Urun | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({ urun_adi: "", urun_aciklamasi: "" })
  const [message, setMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  async function fetchData() {
    setLoading(true)
    try {
      let query = supabase.from("urunler").select("*")
      if (searchQuery) query = query.ilike("urun_adi", `%${searchQuery}%`)
      const { data, error } = await query.order("created_at", { ascending: false })
      if (error) throw error
      setUrunler((data as Urun[]) || [])
    } catch (err) {
      console.error("Error fetching data:", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const payload = { urun_adi: formData.urun_adi, urun_aciklamasi: formData.urun_aciklamasi }
      if (editingUrun) {
        const { error } = await supabase.from("urunler").update(payload).eq("id", editingUrun.id)
        if (error) throw error
        setMessage("Ürün başarıyla güncellendi!")
      } else {
        const { error } = await supabase.from("urunler").insert(payload)
        if (error) throw error
        setMessage("Ürün başarıyla eklendi!")
      }
      closeDialog()
      fetchData()
    } catch (err: any) {
      console.error("Error saving urun:", err)
      setMessage(`Hata: ${err.message}`)
    }
  }

  function handleEdit(urun: Urun) {
    setEditingUrun(urun)
    setFormData({ urun_adi: urun.urun_adi, urun_aciklamasi: urun.urun_aciklamasi || "" })
    setIsDialogOpen(true)
  }

  async function handleDelete(id: string) {
    if (userRole !== "admin") {
      setMessage("Bu işlemi yapmaya yetkiniz yok.")
      return setTimeout(() => setMessage(""), 3000)
    }
    if (!confirm("Bu ürünü silmek istediğinizden emin misiniz?")) return
    try {
      const { error } = await supabase.from("urunler").delete().eq("id", id)
      if (error) throw error
      setMessage("Ürün başarıyla silindi!")
      fetchData()
    } catch (err: any) {
      console.error("Error deleting urun:", err)
      setMessage(`Silme hatası: ${err.message}`)
    } finally {
      setTimeout(() => setMessage(""), 3000)
    }
  }

  function handleAdd() {
    resetForm()
    setIsDialogOpen(true)
  }

  function resetForm() {
    setEditingUrun(null)
    setFormData({ urun_adi: "", urun_aciklamasi: "" })
  }

  function closeDialog() {
    setIsDialogOpen(false)
    resetForm()
    setTimeout(() => setMessage(""), 3000)
  }

  if (userRole !== "admin" && userRole !== "standart") {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>Bu sayfaya erişim yetkiniz yok.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) return <div className="p-6">Yükleniyor...</div>

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ürünler</h1>
          <p className="text-gray-600">Ürün tanımlarını yönetin</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Ürün
        </Button>
      </div>

      {message && (
        <Alert className="mb-4">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Ürün Listesi ({urunler.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Ürün adına göre filtrele..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün Adı</TableHead>
                  <TableHead>Ürün Açıklaması</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {urunler.map((urun) => (
                  <TableRow key={urun.id}>
                    <TableCell className="font-medium">{urun.urun_adi}</TableCell>
                    <TableCell>{urun.urun_aciklamasi || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(urun)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {userRole === "admin" && (
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(urun.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogTrigger asChild>
          {/* Hidden trigger for programmatic open */}
          <button className="hidden" />
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUrun ? "Ürün Düzenle" : "Yeni Ürün Ekle"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="urun_adi">Ürün Adı *</Label>
              <Input
                id="urun_adi"
                required
                placeholder="Örn: Deri Ceket"
                value={formData.urun_adi}
                onChange={(e) => setFormData({ ...formData, urun_adi: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="urun_aciklamasi">Ürün Açıklaması</Label>
              <Input
                id="urun_aciklamasi"
                placeholder="Ürün hakkında kısa bir açıklama"
                value={formData.urun_aciklamasi}
                onChange={(e) => setFormData({ ...formData, urun_aciklamasi: e.target.value })}
              />
            </div>
            <div className="text-sm text-gray-600">
              Ürün eklendikten sonra mağaza sayfasından bu ürünü mağazalara ekleyebilirsiniz.
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeDialog}>
                İptal
              </Button>
              <Button type="submit">{editingUrun ? "Güncelle" : "Ekle"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
