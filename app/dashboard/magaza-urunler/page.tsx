"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Trash2,
  Plus,
  Store,
  Package,
  Search,
  Filter,
} from "lucide-react";

interface MagazaUrun {
  id: number;
  magaza_id: number;
  urun_id: string;
  acente_komisyonu: number;
  rehber_komisyonu: number;
  kaptan_komisyonu: number;
  ofis_komisyonu: number;
  aktif: boolean;
  created_at: string;
  magazalar?: { magaza_adi: string; firmalar?: { firma_adi: string } };
  urunler?: { urun_adi: string };
}

interface Magaza {
  id: number;
  magaza_adi: string;
  firma_id: number;
  firmalar?: { firma_adi: string };
}

interface Urun {
  id: string;
  urun_adi: string;
}

interface Firma {
  id: number;
  firma_adi: string;
}

export default function MagazaUrunlerPage() {
  const { userRole } = useAuth();
  const [magazaUrunler, setMagazaUrunler] = useState<MagazaUrun[]>([]);
  const [filteredMagazaUrunler, setFilteredMagazaUrunler] = useState<
    MagazaUrun[]
  >([]);
  const [magazalar, setMagazalar] = useState<Magaza[]>([]);
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [firmalar, setFirmalar] = useState<Firma[]>([]);
  const [filteredMagazalar, setFilteredMagazalar] = useState<Magaza[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMagazaUrun, setEditingMagazaUrun] = useState<MagazaUrun | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFirma, setSelectedFirma] = useState<string>("");
  const [formData, setFormData] = useState({
    firma_id: "",
    magaza_id: "",
    urun_id: "",
    acente_komisyonu: "",
    rehber_komisyonu: "",
    kaptan_komisyonu: "",
    ofis_komisyonu: "",
    aktif: true,
  });
  const [message, setMessage] = useState("");

  // Filter states
  const [filters, setFilters] = useState({
    firma: "",
    magaza: "",
    urun: "",
    durum: "",
    arama: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedFirma) {
      // UUID karşılaştırması için string olarak karşılaştır
      const filtered = magazalar.filter((magaza) => {
        // Hem string hem integer karşılaştırması yap
        return magaza.firma_id?.toString() === selectedFirma;
      });
      setFilteredMagazalar(filtered);
    } else {
      setFilteredMagazalar([]);
    }
  }, [selectedFirma, magazalar]);

  // Filter effect
  useEffect(() => {
    let filtered = [...magazaUrunler];

    // Firma filtresi
    if (filters.firma) {
      filtered = filtered.filter((item) =>
        item.magazalar?.firmalar?.firma_adi
          ?.toLowerCase()
          .includes(filters.firma.toLowerCase())
      );
    }

    // Mağaza filtresi
    if (filters.magaza) {
      filtered = filtered.filter((item) =>
        item.magazalar?.magaza_adi
          ?.toLowerCase()
          .includes(filters.magaza.toLowerCase())
      );
    }

    // Ürün filtresi
    if (filters.urun) {
      filtered = filtered.filter((item) =>
        item.urunler?.urun_adi
          ?.toLowerCase()
          .includes(filters.urun.toLowerCase())
      );
    }

    // Durum filtresi
    if (filters.durum && filters.durum !== "all") {
      if (filters.durum === "aktif") {
        filtered = filtered.filter((item) => item.aktif === true);
      } else if (filters.durum === "pasif") {
        filtered = filtered.filter((item) => item.aktif === false);
      }
    }

    // Genel arama
    if (filters.arama) {
      const searchTerm = filters.arama.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.magazalar?.firmalar?.firma_adi
            ?.toLowerCase()
            .includes(searchTerm) ||
          item.magazalar?.magaza_adi?.toLowerCase().includes(searchTerm) ||
          item.urunler?.urun_adi?.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredMagazaUrunler(filtered);
  }, [magazaUrunler, filters]);

  const fetchData = async () => {
    try {
      // Mağaza ürünlerini getir
      const { data: magazaUrunData, error: magazaUrunError } = await supabase
        .from("magaza_urunler")
        .select(
          `
        *,
        magazalar (
          magaza_adi,
          firmalar (firma_adi)
        ),
        urunler (urun_adi)
      `
        )
        .order("created_at", { ascending: false });

      if (magazaUrunError) throw magazaUrunError;

      // Mağazaları getir
      const { data: magazaData, error: magazaError } = await supabase
        .from("magazalar")
        .select(
          `
        id,
        magaza_adi,
        firma_id,
        firmalar (firma_adi)
      `
        )
        .order("magaza_adi");

      if (magazaError) throw magazaError;

      // Ürünleri getir
      const { data: urunData, error: urunError } = await supabase
        .from("urunler")
        .select("id, urun_adi")
        .order("urun_adi");

      if (urunError) throw urunError;

      // Firmaları getir
      const { data: firmaData, error: firmaError } = await supabase
        .from("firmalar")
        .select("id, firma_adi")
        .order("firma_adi");

      if (firmaError) throw firmaError;

      setMagazaUrunler(magazaUrunData || []);
      setMagazalar(magazaData || []);
      setUrunler(urunData || []);
      setFirmalar(firmaData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    /* --- NEW: basic validation for required IDs --------------------------- */
    if (!formData.firma_id || !formData.magaza_id || !formData.urun_id) {
      setMessage("Lütfen firma, mağaza ve ürün alanlarını doldurun.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    /* --------------------------------------------------------------------- */

    try {
      const dataToSave = {
        magaza_id: formData.magaza_id, // UUID olarak bırak
        urun_id: formData.urun_id, // Integer olarak tut
        acente_komisyonu: Number.parseFloat(formData.acente_komisyonu) || 0,
        rehber_komisyonu: Number.parseFloat(formData.rehber_komisyonu) || 0,
        kaptan_komisyonu: Number.parseFloat(formData.kaptan_komisyonu) || 0,
        ofis_komisyonu: Number.parseFloat(formData.ofis_komisyonu) || 0,
        aktif: formData.aktif,
      };

      if (editingMagazaUrun) {
        const { error } = await supabase
          .from("magaza_urunler")
          .update(dataToSave)
          .eq("id", editingMagazaUrun.id);
        if (error) throw error;
        setMessage("Mağaza ürünü başarıyla güncellendi!");
      } else {
        // Check for existing combination
        const { data: existing, error: checkError } = await supabase
          .from("magaza_urunler")
          .select("id")
          .eq("magaza_id", dataToSave.magaza_id)
          .eq("urun_id", dataToSave.urun_id)
          .limit(1);

        if (checkError) throw checkError;

        if (existing && existing.length > 0) {
          setMessage("Bu mağaza için bu ürün zaten eklenmiş!");
          return;
        }

        const { error } = await supabase
          .from("magaza_urunler")
          .insert(dataToSave);
        if (error) throw error;
        setMessage("Mağaza ürünü başarıyla eklendi!");
      }

      setIsDialogOpen(false);
      setEditingMagazaUrun(null);
      resetForm();
      fetchData();

      setTimeout(() => setMessage(""), 3000);
    } catch (error: any) {
      console.error("Error saving magaza urun:", error);
      setMessage(`Hata: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      firma_id: "",
      magaza_id: "",
      urun_id: "",
      acente_komisyonu: "",
      rehber_komisyonu: "",
      kaptan_komisyonu: "",
      ofis_komisyonu: "",
      aktif: true,
    });
    setSelectedFirma("");
  };

  const handleEdit = (magazaUrun: MagazaUrun) => {
    setEditingMagazaUrun(magazaUrun);

    // Güvenli magaza bulma ve firma_id alma
    const magaza = magazalar.find(
      (m) => m.id?.toString() === magazaUrun.magaza_id?.toString()
    );
    const firmaId = magaza?.firma_id?.toString() || "";

    setSelectedFirma(firmaId);
    setFormData({
      firma_id: firmaId,
      magaza_id: magazaUrun.magaza_id?.toString() || "",
      urun_id: magazaUrun.urun_id?.toString() || "",
      acente_komisyonu: magazaUrun.acente_komisyonu?.toString() || "0",
      rehber_komisyonu: magazaUrun.rehber_komisyonu?.toString() || "0",
      kaptan_komisyonu: magazaUrun.kaptan_komisyonu?.toString() || "0",
      ofis_komisyonu: magazaUrun.ofis_komisyonu?.toString() || "0",
      aktif: magazaUrun.aktif ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (userRole !== "admin") {
      setMessage("Bu işlemi yapmaya yetkiniz yok.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    if (!confirm("Bu mağaza ürünü kaydını silmek istediğinizden emin misiniz?"))
      return;

    try {
      const { error } = await supabase
        .from("magaza_urunler")
        .delete()
        .eq("id", id);
      if (error) throw error;

      setMessage("Mağaza ürünü başarıyla silindi!");
      fetchData();
      setTimeout(() => setMessage(""), 3000);
    } catch (error: any) {
      console.error("Error deleting magaza urun:", error);
      setMessage(`Silme hatası: ${error.message}`);
    }
  };

  const handleAdd = () => {
    setEditingMagazaUrun(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const toggleAktif = async (id: number, currentAktif: boolean) => {
    try {
      const { error } = await supabase
        .from("magaza_urunler")
        .update({ aktif: !currentAktif })
        .eq("id", id);

      if (error) throw error;

      setMessage(`Ürün ${!currentAktif ? "aktif" : "pasif"} hale getirildi!`);
      fetchData();
      setTimeout(() => setMessage(""), 3000);
    } catch (error: any) {
      console.error("Error toggling aktif:", error);
      setMessage(`Durum değiştirme hatası: ${error.message}`);
    }
  };

  const clearFilters = () => {
    setFilters({
      firma: "",
      magaza: "",
      urun: "",
      durum: "",
      arama: "",
    });
  };

  if (userRole !== "admin" && userRole !== "standart") {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>Bu sayfaya erişim yetkiniz yok.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mağaza Ürünleri</h1>
          <p className="text-gray-600">
            Mağazaların sattığı ürünleri ve komisyon oranlarını yönetin
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Yeni Mağaza Ürünü
        </Button>
      </div>

      {message && (
        <Alert className="mb-4">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {/* Filtreleme Bölümü */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtreleme
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Genel Arama */}
            <div>
              <Label htmlFor="arama">Genel Arama</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="arama"
                  placeholder="Firma, mağaza, ürün ara..."
                  value={filters.arama}
                  onChange={(e) =>
                    setFilters({ ...filters, arama: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
            </div>

            {/* Firma Filtresi */}
            <div>
              <Label htmlFor="firma-filter">Firma</Label>
              <Input
                id="firma-filter"
                placeholder="Firma adı..."
                value={filters.firma}
                onChange={(e) =>
                  setFilters({ ...filters, firma: e.target.value })
                }
              />
            </div>

            {/* Mağaza Filtresi */}
            <div>
              <Label htmlFor="magaza-filter">Mağaza</Label>
              <Input
                id="magaza-filter"
                placeholder="Mağaza adı..."
                value={filters.magaza}
                onChange={(e) =>
                  setFilters({ ...filters, magaza: e.target.value })
                }
              />
            </div>

            {/* Ürün Filtresi */}
            <div>
              <Label htmlFor="urun-filter">Ürün</Label>
              <Input
                id="urun-filter"
                placeholder="Ürün adı..."
                value={filters.urun}
                onChange={(e) =>
                  setFilters({ ...filters, urun: e.target.value })
                }
              />
            </div>

            {/* Durum Filtresi */}
            <div>
              <Label htmlFor="durum-filter">Durum</Label>
              <Select
                value={filters.durum}
                onValueChange={(value) =>
                  setFilters({ ...filters, durum: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="pasif">Pasif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Temizle Butonu */}
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full bg-transparent"
              >
                Filtreleri Temizle
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Mağaza Ürün Listesi
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({filteredMagazaUrunler.length} / {magazaUrunler.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Firma</TableHead>
                  <TableHead>Mağaza</TableHead>
                  <TableHead>Ürün</TableHead>
                  {userRole === "admin" && <TableHead>Acente %</TableHead>}
                  {userRole === "admin" && <TableHead>Rehber %</TableHead>}
                  {userRole === "admin" && <TableHead>Kaptan %</TableHead>}
                  {userRole === "admin" && <TableHead>Ofis %</TableHead>}
                  <TableHead>Durum</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMagazaUrunler.map((magazaUrun) => (
                  <TableRow key={magazaUrun.id}>
                    <TableCell>
                      {magazaUrun.magazalar?.firmalar?.firma_adi || "-"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {magazaUrun.magazalar?.magaza_adi || "-"}
                    </TableCell>
                    <TableCell>{magazaUrun.urunler?.urun_adi || "-"}</TableCell>
                    {userRole === "admin" && (
                      <TableCell>%{magazaUrun.acente_komisyonu}</TableCell>
                    )}
                    {userRole === "admin" && (
                      <TableCell>%{magazaUrun.rehber_komisyonu}</TableCell>
                    )}
                    {userRole === "admin" && (
                      <TableCell>%{magazaUrun.kaptan_komisyonu}</TableCell>
                    )}
                    {userRole === "admin" && (
                      <TableCell>%{magazaUrun.ofis_komisyonu}</TableCell>
                    )}
                    <TableCell>
                      <Badge
                        variant={magazaUrun.aktif ? "default" : "secondary"}
                        className={`cursor-pointer ${
                          magazaUrun.aktif
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                        onClick={() =>
                          toggleAktif(magazaUrun.id, magazaUrun.aktif)
                        }
                      >
                        {magazaUrun.aktif ? "Aktif" : "Pasif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(magazaUrun)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {userRole === "admin" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(magazaUrun.id)}
                          >
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
            <DialogTitle>
              {editingMagazaUrun
                ? "Mağaza Ürünü Düzenle"
                : "Yeni Mağaza Ürünü Ekle"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="firma_id">Firma *</Label>
              <Select
                value={selectedFirma}
                onValueChange={(value) => {
                  setSelectedFirma(value);
                  setFormData({ ...formData, firma_id: value, magaza_id: "" });
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Firma seçin" />
                </SelectTrigger>
                <SelectContent>
                  {firmalar.map((firma) => (
                    <SelectItem key={firma.id} value={firma.id.toString()}>
                      <div className="flex items-center">
                        <Store className="w-4 h-4 mr-2" />
                        {firma.firma_adi}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="magaza_id">Mağaza *</Label>
              <Select
                value={formData.magaza_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, magaza_id: value })
                }
                required
                disabled={!selectedFirma}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Önce firma seçin" />
                </SelectTrigger>
                <SelectContent>
                  {filteredMagazalar.map((magaza) => (
                    <SelectItem key={magaza.id} value={magaza.id.toString()}>
                      {magaza.magaza_adi}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="urun_id">Ürün *</Label>
              <Select
                value={formData.urun_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, urun_id: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ürün seçin" />
                </SelectTrigger>
                <SelectContent>
                  {urunler.map((urun) => (
                    <SelectItem key={urun.id} value={urun.id.toString()}>
                      <div className="flex items-center">
                        <Package className="w-4 h-4 mr-2" />
                        {urun.urun_adi}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {userRole === "admin" && (
              <>
                <div>
                  <Label htmlFor="acente_komisyonu">
                    Acente Komisyonu (%) *
                  </Label>
                  <Input
                    id="acente_komisyonu"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.acente_komisyonu}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        acente_komisyonu: e.target.value,
                      })
                    }
                    required
                    placeholder="Örn: 15.5"
                  />
                </div>

                <div>
                  <Label htmlFor="rehber_komisyonu">
                    Rehber Komisyonu (%) *
                  </Label>
                  <Input
                    id="rehber_komisyonu"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.rehber_komisyonu}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rehber_komisyonu: e.target.value,
                      })
                    }
                    required
                    placeholder="Örn: 10"
                  />
                </div>

                <div>
                  <Label htmlFor="kaptan_komisyonu">
                    Kaptan Komisyonu (%) *
                  </Label>
                  <Input
                    id="kaptan_komisyonu"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.kaptan_komisyonu}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        kaptan_komisyonu: e.target.value,
                      })
                    }
                    required
                    placeholder="Örn: 5"
                  />
                </div>

                <div>
                  <Label htmlFor="ofis_komisyonu">Ofis Komisyonu (%) *</Label>
                  <Input
                    id="ofis_komisyonu"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.ofis_komisyonu}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ofis_komisyonu: e.target.value,
                      })
                    }
                    required
                    placeholder="Örn: 2.5"
                  />
                </div>
              </>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="aktif"
                checked={formData.aktif}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, aktif: checked as boolean })
                }
              />
              <Label htmlFor="aktif">Aktif</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                İptal
              </Button>
              <Button type="submit">
                {editingMagazaUrun ? "Güncelle" : "Ekle"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
