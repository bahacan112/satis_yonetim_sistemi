"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { useI18n } from "@/contexts/i18n-context"
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
  const { t } = useI18n()
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
        setMessage(t("companies.updateSuccess"))
      } else {
        // Yeni ekleme
        const { error } = await supabase.from("firmalar").insert({
          firma_adi: formData.firma_adi,
          il: formData.il,
          sektor: formData.sektor,
        })

        if (error) throw error
        setMessage(t("companies.addSuccess"))
      }

      setIsDialogOpen(false)
      setEditingFirma(null)
      setFormData({ firma_adi: "", il: "", sektor: "" })
      fetchFirmalar()

      setTimeout(() => setMessage(""), 3000)
    } catch (error: any) {
      console.error("Error saving firma:", error)
      setMessage(`${t("companies.error")}: ${error.message}`)
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
      setMessage(t("companies.noPermission"))
      setTimeout(() => setMessage(""), 3000)
      return
    }
    if (!confirm(t("companies.deleteConfirm"))) return

    try {
      const { error } = await supabase.from("firmalar").delete().eq("id", id)

      if (error) throw error

      setMessage(t("companies.deleteSuccess"))
      fetchFirmalar()

      setTimeout(() => setMessage(""), 3000)
    } catch (error: any) {
      console.error("Error deleting firma:", error)
      setMessage(`${t("companies.deleteError")}: ${error.message}`)
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
          <AlertDescription>{t("access.noPermission")}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) {
    return <div>{t("common.loading")}</div>
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t("companies.title")}</h1>
          <p className="text-gray-600">{t("companies.subtitle")}</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          {t("companies.addNew")}
        </Button>
      </div>

      {message && (
        <Alert className="mb-4">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {t("companies.list")} ({firmalar.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("companies.name")}</TableHead>
                  <TableHead>{t("companies.city")}</TableHead>
                  <TableHead>{t("companies.sector")}</TableHead>
                  <TableHead>{t("companies.registrationDate")}</TableHead>
                  <TableHead>{t("common.actions")}</TableHead>
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
            <DialogTitle>{editingFirma ? t("companies.edit") : t("companies.addTitle")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="firma_adi">{t("companies.name")} *</Label>
              <Input
                id="firma_adi"
                value={formData.firma_adi}
                onChange={(e) => setFormData({ ...formData, firma_adi: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="il">{t("companies.city")}</Label>
              <Input
                id="il"
                value={formData.il}
                onChange={(e) => setFormData({ ...formData, il: e.target.value })}
                placeholder={t("companies.cityPlaceholder")}
              />
            </div>
            <div>
              <Label htmlFor="sektor">{t("companies.sector")}</Label>
              <Input
                id="sektor"
                value={formData.sektor}
                onChange={(e) => setFormData({ ...formData, sektor: e.target.value })}
                placeholder={t("companies.sectorPlaceholder")}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit">{editingFirma ? t("common.update") : t("common.add")}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
