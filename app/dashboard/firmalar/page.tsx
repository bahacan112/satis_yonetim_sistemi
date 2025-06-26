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
import { Edit, Trash2, Plus } from "lucide-react"

interface Firma {
  id: number
  firma_adi: string
  kayit_tarihi: string | null
  il: string | null
  sektor: string | null
  created_at: string
}

export default function FirmalarPage() {
  const { userRole } = useAuth()
  const [firmalar, setFirmalar] = useState<Firma[]>([])
  const [loading, setLoading] = useState(true)
  const [editingFirma, setEditingFirma] = useState<Firma | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    firma_adi: "",
    il: "",
    sektor: "",
  })
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchFirmalar()
  }, [])

  const fetchFirmalar = async () => {
    try {
      const { data, error } = await supabase.from("firmalar").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setFirmalar(data || [])
    } catch (error) {
      console.error("Error fetching firmalar:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingFirma) {
        // Güncelleme
        const { error } = await supabase
          .from("firmalar")
          .update({
            firma_adi: formData.firma_adi,
            il: formData.il,
            sektor: formData.sektor,
          })
          .eq("id", editingFirma.id)

        if (error) throw error
        setMessage("Firma başarıyla güncellendi!")
      } else {
        // Yeni ekleme
        const { error } = await supabase.from("firmalar").insert({
          firma_adi: formData.firma_adi,
          il: formData.il,
          sektor: formData.sektor,
        })

        if (error) throw error
        setMessage("Firma başarıyla eklendi!")
      }

      setIsDialogOpen(false)
      setEditingFirma(null)
      setFormData({ firma_adi: "", il: "", sektor: "" })
      fetchFirmalar()

      setTimeout(() => setMessage(""), 3000)
    } catch (error: any) {
      console.error("Error saving firma:", error)
      setMessage(`Hata: ${error.message}`)
    }
  }

  const handleEdit = (firma: Firma) => {
    setEditingFirma(firma)
    setFormData({
      firma_adi: firma.firma_adi,
      il: firma.il || "",
      sektor: firma.sektor || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (userRole !== "admin") {
      setMessage("Bu işlemi yapmaya yetkiniz yok.")
      setTimeout(() => setMessage(""), 3000)
      return
    }
    if (!confirm("Bu firmayı silmek istediğinizden emin misiniz?")) return

    try {
      const { error } = await supabase.from("firmalar").delete().eq("id", id)

      if (error) throw error

      setMessage("Firma başarıyla silindi!")
      fetchFirmalar()

      setTimeout(() => setMessage(""), 3000)
    } catch (error: any) {
      console.error("Error deleting firma:", error)
      setMessage(`Silme hatası: ${error.message}`)
    }
  }

  const handleAdd = () => {
    setEditingFirma(null)
    setFormData({ firma_adi: "", il: "", sektor: "" })
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
          <h1 className="text-3xl font-bold text-gray-900">Firmalar</h1>
          <p className="text-gray-600">Firma bilgilerini yönetin</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Yeni Firma
        </Button>
      </div>

      {message && (
        <Alert className="mb-4">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Firma Listesi ({firmalar.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Firma Adı</TableHead>
                  <TableHead>İl</TableHead>
                  <TableHead>Sektör</TableHead>
                  <TableHead>Kayıt Tarihi</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {firmalar.map((firma) => (
                  <TableRow key={firma.id}>
                    <TableCell className="font-medium">{firma.firma_adi}</TableCell>
                    <TableCell>{firma.il || "-"}</TableCell>
                    <TableCell>{firma.sektor || "-"}</TableCell>
                    <TableCell>
                      {firma.kayit_tarihi ? new Date(firma.kayit_tarihi).toLocaleDateString("tr-TR") : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(firma)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        {userRole === "admin" && (
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(firma.id)}>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFirma ? "Firma Düzenle" : "Yeni Firma Ekle"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="firma_adi">Firma Adı *</Label>
              <Input
                id="firma_adi"
                value={formData.firma_adi}
                onChange={(e) => setFormData({ ...formData, firma_adi: e.target.value })}
                required
              />
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
              <Button type="submit">{editingFirma ? "Güncelle" : "Ekle"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
