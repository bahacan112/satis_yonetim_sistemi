"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Edit, Trash2, Plus } from "lucide-react"

interface Magaza {
  id: number
  magaza_adi: string
  kayit_tarihi: string | null
  il: string | null
  ilce: string | null
  sektor: string | null
  firma_id: number | null
  created_at: string
  firmalar?: { firma_adi: string }
}

interface Firma {
  id: number
  firma_adi: string
}

export default function MagazalarPage() {
  const { userRole } = useAuth()
  const [magazalar, setMagazalar] = useState<Magaza[]>([])
  const [firmalar, setFirmalar] = useState<Firma[]>([])
  const [loading, setLoading] = useState(true)
  const [editingMagaza, setEditingMagaza] = useState<Magaza | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    magaza_adi: "",
    il: "",
    ilce: "",
    sektor: "",
    firma_id: "",
  })
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Mağazaları firma bilgileri ile birlikte getir
      const { data: magazaData, error: magazaError } = await supabase
        .from("magazalar")
        .select(`
          *,
          firmalar (firma_adi)
        `)
        .order("created_at", { ascending: false })

      if (magazaError) throw magazaError

      // Firmaları getir
      const { data: firmaData, error: firmaError } = await supabase
        .from("firmalar")
        .select("id, firma_adi")
        .order("firma_adi")

      if (firmaError) throw firmaError

      setMagazalar(magazaData || [])
      setFirmalar(firmaData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Only include fields that exist in the table
      const dataToSave: any = {
        magaza_adi: formData.magaza_adi,
      }

      // Add optional fields only if they have values
      if (formData.il) dataToSave.il = formData.il
      if (formData.ilce) dataToSave.ilce = formData.ilce
      if (formData.sektor) dataToSave.sektor = formData.sektor
      if (formData.firma_id) dataToSave.firma_id = formData.firma_id

      if (editingMagaza) {
        const { error } = await supabase.from("magazalar").update(dataToSave).eq("id", editingMagaza.id)
        if (error) throw error
        setMessage("Mağaza başarıyla güncellendi!")
      } else {
        const { error } = await supabase.from("magazalar").insert(dataToSave)
        if (error) throw error
        setMessage("Mağaza başarıyla eklendi!")
      }

      setIsDialogOpen(false)
      setEditingMagaza(null)
      setFormData({ magaza_adi: "", il: "", ilce: "", sektor: "", firma_id: "" })
      fetchData()

      setTimeout(() => setMessage(""), 3000)
    } catch (error: any) {
      console.error("Error saving magaza:", error)
      setMessage(`Hata: ${error.message}`)
    }
  }

  const handleEdit = (magaza: Magaza) => {
    setEditingMagaza(magaza)
    setFormData({
      magaza_adi: magaza.magaza_adi,
      il: magaza.il || "",
      ilce: magaza.ilce || "",
      sektor: magaza.sektor || "",
      firma_id: magaza.firma_id?.toString() || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (userRole !== "admin") {
      setMessage("Bu işlemi yapmaya yetkiniz yok.")
      setTimeout(() => setMessage(""), 3000)
      return
    }
    if (!confirm("Bu mağazayı silmek istediğinizden emin misiniz?")) return

    try {
      const { error } = await supabase.from("magazalar").delete().eq("id", id)
      if (error) throw error

      setMessage("Mağaza başarıyla silindi!")
      fetchData()
      setTimeout(() => setMessage(""), 3000)
    } catch (error: any) {
      console.error("Error deleting magaza:", error)
      setMessage(`Silme hatası: ${error.message}`)
    }
  }

  const handleAdd = () => {
    setEditingMagaza(null)
    setFormData({ magaza_adi: "", il: "", ilce: "", sektor: "", firma_id: "" })
    setIsDialogOpen(true)
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

  if (loading) {
    return <div>Yükleniyor...</div>
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mağazalar</h1>
          <p className="text-gray-600">Mağaza bilgilerini yönetin</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Yeni Mağaza
        </Button>
      </div>

      {message && (
        <Alert className="mb-4">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Mağaza Listesi ({magazalar.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mağaza Adı</TableHead>
                  <TableHead>Firma</TableHead>
                  <TableHead>İl</TableHead>
                  <TableHead>İlçe</TableHead>
                  <TableHead>Sektör</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {magazalar.map((magaza) => (
                  <TableRow key={magaza.id}>
                    <TableCell className="font-medium">{magaza.magaza_adi}</TableCell>
                    <TableCell>{magaza.firmalar?.firma_adi || "-"}</TableCell>
                    <TableCell>{magaza.il || "-"}</TableCell>
                    <TableCell>{magaza.ilce || "-"}</TableCell>
                    <TableCell>{magaza.sektor || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(magaza)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        {userRole === "admin" && (
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(magaza.id)}>
                            <Trash2 className="w-4 h-4" />
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

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMagaza ? "Mağaza Düzenle" : "Yeni Mağaza Ekle"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="magaza_adi">Mağaza Adı *</Label>
              <Input
                id="magaza_adi"
                value={formData.magaza_adi}
                onChange={(e) => setFormData({ ...formData, magaza_adi: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="firma_id">Firma</Label>
              <Select
                value={formData.firma_id}
                onValueChange={(value) => setFormData({ ...formData, firma_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Firma seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Firma Seçilmedi</SelectItem>
                  {firmalar.map((firma) => (
                    <SelectItem key={firma.id} value={firma.id.toString()}>
                      {firma.firma_adi}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="il">İl</Label>
              <Input
                id="il"
                value={formData.il}
                onChange={(e) => setFormData({ ...formData, il: e.target.value })}
                placeholder="Örn: İstanbul"
              />
            </div>
            <div>
              <Label htmlFor="ilce">İlçe</Label>
              <Input
                id="ilce"
                value={formData.ilce}
                onChange={(e) => setFormData({ ...formData, ilce: e.target.value })}
                placeholder="Örn: Beyoğlu"
              />
            </div>
            <div>
              <Label htmlFor="sektor">Sektör</Label>
              <Input
                id="sektor"
                value={formData.sektor}
                onChange={(e) => setFormData({ ...formData, sektor: e.target.value })}
                placeholder="Örn: Turizm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                İptal
              </Button>
              <Button type="submit">{editingMagaza ? "Güncelle" : "Ekle"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
