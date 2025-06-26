"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, Calendar } from "lucide-react"
import { supabase } from "@/lib/supabase"

// Operator tablosunun yapısına uygun arayüz
interface TourOperator {
  id: string
  operator_adi: string
  created_at: string
}

const TourOperatorlerPage = () => {
  const { user, userRole, loading } = useAuth()
  const [operatorler, setOperatorler] = useState<TourOperator[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingOperator, setEditingOperator] = useState<TourOperator | null>(null)
  const [formData, setFormData] = useState({
    operator_adi: "",
  })
  const [searchTerm, setSearchTerm] = useState("") // Filtreleme için arama terimi

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login"
    }
  }, [user, loading])

  useEffect(() => {
    if (user) {
      fetchOperatorler()
    }
  }, [user])

  const fetchOperatorler = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from("operatorler") // operatorler tablosunu sorgula
        .select("id, operator_adi, created_at") // Sadece operator_adi ve created_at çek
        .order("created_at", { ascending: false })

      if (searchTerm) {
        query = query.ilike("operator_adi", `%${searchTerm}%`) // Arama terimine göre filtrele
      }

      const { data, error } = await query

      if (error) throw error
      setOperatorler(data || [])
    } catch (error) {
      console.error("Operatörler yüklenirken hata:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Arama terimi değiştiğinde verileri yeniden çek
  useEffect(() => {
    if (user) {
      const delayDebounceFn = setTimeout(() => {
        fetchOperatorler()
      }, 300) // 300ms gecikme ile arama yap

      return () => clearTimeout(delayDebounceFn)
    }
  }, [searchTerm, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingOperator) {
        // Güncelleme
        const { error } = await supabase
          .from("operatorler")
          .update({
            operator_adi: formData.operator_adi,
          })
          .eq("id", editingOperator.id)

        if (error) throw error
      } else {
        // Yeni operatör oluşturma
        const { error } = await supabase.from("operatorler").insert({
          operator_adi: formData.operator_adi,
        })

        if (error) throw error
      }

      await fetchOperatorler()
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Operatör kaydedilirken hata:", error)
      alert("Bir hata oluştu!")
    }
  }

  const handleEdit = (operator: TourOperator) => {
    setEditingOperator(operator)
    setFormData({
      operator_adi: operator.operator_adi || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (userRole !== "admin") {
      alert("Bu işlemi yapmaya yetkiniz yok.") // Use alert as there's no message state in this component
      return
    }
    if (!confirm("Bu operatörü silmek istediğinizden emin misiniz?")) return

    try {
      const { error } = await supabase.from("operatorler").delete().eq("id", id)

      if (error) throw error

      await fetchOperatorler()
    } catch (error) {
      console.error("Operatör silinirken hata:", error)
      alert("Bir hata oluştu!")
    }
  }

  const resetForm = () => {
    setFormData({
      operator_adi: "",
    })
    setEditingOperator(null)
    setIsDialogOpen(true) // <-- Bu satırı ekleyin
  }

  if (loading) {
    return <div className="p-6">Yükleniyor...</div>
  }

  // Bu sayfa için sadece admin rolüne sahip kullanıcıların erişimi olmalı
  if (userRole !== "admin" && userRole !== "standart") {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>Bu sayfaya erişim yetkiniz yok. Sadece yöneticiler erişebilir.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Tur Operatörleri</h1>
          <p className="text-gray-600">Turları getiren operatörleri yönetin</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Operatör
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingOperator ? "Operatör Düzenle" : "Yeni Operatör"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="operator_adi">Operatör Adı *</Label>
                <Input
                  id="operator_adi"
                  value={formData.operator_adi}
                  onChange={(e) => setFormData({ ...formData, operator_adi: e.target.value })}
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingOperator ? "Güncelle" : "Kaydet"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  İptal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex justify-end mb-4">
        <Input
          type="text"
          placeholder="Operatör ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Operatör Listesi ({operatorler.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Yükleniyor...</div>
          ) : operatorler.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Henüz tur operatörü eklenmemiş</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Operatör Adı</TableHead>
                    <TableHead>Oluşturulma Tarihi</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operatorler.map((operator) => (
                    <TableRow key={operator.id}>
                      <TableCell>
                        <div className="font-medium">{operator.operator_adi}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-3 h-3" />
                          {new Date(operator.created_at).toLocaleDateString("tr-TR")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(operator)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          {userRole === "admin" && (
                            <Button size="sm" variant="outline" onClick={() => handleDelete(operator.id)}>
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default TourOperatorlerPage
