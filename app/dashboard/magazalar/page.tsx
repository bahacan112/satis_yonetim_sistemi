"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { useI18n } from "@/contexts/i18n-context"
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
  const { t } = useI18n()
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
        setMessage(t("stores.updateSuccess"))
      } else {
        const { error } = await supabase.from("magazalar").insert(dataToSave)
        if (error) throw error
        setMessage(t("stores.addSuccess"))
      }

      setIsDialogOpen(false)
      setEditingMagaza(null)
      setFormData({ magaza_adi: "", il: "", ilce: "", sektor: "", firma_id: "" })
      fetchData()

      setTimeout(() => setMessage(""), 3000)
    } catch (error: any) {
      console.error("Error saving magaza:", error)
      setMessage(`${t("stores.error")}: ${error.message}`)
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
      setMessage(t("stores.noPermission"))
      setTimeout(() => setMessage(""), 3000)
      return
    }
    if (!confirm(t("stores.deleteConfirm"))) return

    try {
      const { error } = await supabase.from("magazalar").delete().eq("id", id)
      if (error) throw error

      setMessage(t("stores.deleteSuccess"))
      fetchData()
      setTimeout(() => setMessage(""), 3000)
    } catch (error: any) {
      console.error("Error deleting magaza:", error)
      setMessage(`${t("stores.deleteError")}: ${error.message}`)
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
          <h1 className="text-3xl font-bold text-gray-900">{t("stores.title")}</h1>
          <p className="text-gray-600">{t("stores.subtitle")}</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          {t("stores.addNew")}
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
            {t("stores.list")} ({magazalar.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("stores.name")}</TableHead>
                  <TableHead>{t("stores.company")}</TableHead>
                  <TableHead>{t("stores.city")}</TableHead>
                  <TableHead>{t("stores.district")}</TableHead>
                  <TableHead>{t("stores.sector")}</TableHead>
                  <TableHead>{t("common.actions")}</TableHead>
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
            <DialogTitle>{editingMagaza ? t("stores.edit") : t("stores.addTitle")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="magaza_adi">{t("stores.name")} *</Label>
              <Input
                id="magaza_adi"
                value={formData.magaza_adi}
                onChange={(e) => setFormData({ ...formData, magaza_adi: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="firma_id">{t("stores.company")}</Label>
              <Select
                value={formData.firma_id}
                onValueChange={(value) => setFormData({ ...formData, firma_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("stores.selectCompany")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">{t("stores.noCompanySelected")}</SelectItem>
                  {firmalar.map((firma) => (
                    <SelectItem key={firma.id} value={firma.id.toString()}>
                      {firma.firma_adi}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="il">{t("stores.city")}</Label>
              <Input
                id="il"
                value={formData.il}
                onChange={(e) => setFormData({ ...formData, il: e.target.value })}
                placeholder={t("stores.cityPlaceholder")}
              />
            </div>
            <div>
              <Label htmlFor="ilce">{t("stores.district")}</Label>
              <Input
                id="ilce"
                value={formData.ilce}
                onChange={(e) => setFormData({ ...formData, ilce: e.target.value })}
                placeholder={t("stores.districtPlaceholder")}
              />
            </div>
            <div>
              <Label htmlFor="sektor">{t("stores.sector")}</Label>
              <Input
                id="sektor"
                value={formData.sektor}
                onChange={(e) => setFormData({ ...formData, sektor: e.target.value })}
                placeholder={t("stores.sectorPlaceholder")}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit">{editingMagaza ? t("common.update") : t("common.add")}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
