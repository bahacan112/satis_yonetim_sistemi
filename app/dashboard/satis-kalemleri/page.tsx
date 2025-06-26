"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Edit } from "lucide-react";

interface SatisKalemi {
  id: number;
  satis_id: number;
  urun_id: number;
  adet: number;
  birim_fiyat: number;
  acente_komisyonu: number;
  rehber_komisyonu: number;
  kaptan_komisyonu: number;
  rehber_bildirim_adet: number;
  rehber_bildirim_fiyati: number;
  rehber_bildirim_tarihi: string | null;
  rehber_bildirim_notu: string | null;
  urunler?: { urun_adi: string };
  satislar?: {
    tur: string;
    rehberler?: { rehber_adi: string };
    magazalar?: { magaza_adi: string };
  };
}

export default function SatisKalemleriPage() {
  const { userRole } = useAuth();
  const [satisKalemleri, setSatisKalemleri] = useState<SatisKalemi[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<SatisKalemi | null>(null);
  const [formData, setFormData] = useState({
    rehber_bildirim_adet: 0,
    rehber_bildirim_fiyati: 0,
    rehber_bildirim_notu: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchSatisKalemleri();
  }, []);

  const fetchSatisKalemleri = async () => {
    try {
      const { data, error } = await supabase
        .from("satis_kalemleri")
        .select(
          `
          *,
          urunler (urun_adi),
          satislar (
            tur,
            rehberler (rehber_adi),
            magazalar (magaza_adi)
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSatisKalemleri(data || []);
    } catch (error) {
      console.error("Error fetching satis kalemleri:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: SatisKalemi) => {
    setEditingItem(item);
    setFormData({
      rehber_bildirim_adet: item.rehber_bildirim_adet || 0,
      rehber_bildirim_fiyati: item.rehber_bildirim_fiyati || 0,
      rehber_bildirim_notu: item.rehber_bildirim_notu || "",
    });
  };

  const handleUpdate = async () => {
    if (!editingItem) return;

    try {
      const { error } = await supabase
        .from("satis_kalemleri")
        .update({
          rehber_bildirim_adet: formData.rehber_bildirim_adet,
          rehber_bildirim_fiyati: formData.rehber_bildirim_fiyati,
          rehber_bildirim_notu: formData.rehber_bildirim_notu,
          rehber_bildirim_tarihi: new Date().toISOString(),
        })
        .eq("id", editingItem.id);

      if (error) throw error;

      setMessage("Rehber bildirimi başarıyla güncellendi!");
      setEditingItem(null);
      fetchSatisKalemleri();

      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error updating satis kalemi:", error);
      setMessage("Güncelleme sırasında bir hata oluştu!");
    }
  };

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Satış Kalemleri</h1>
        <p className="text-gray-600">
          {userRole === "operator"
            ? "Rehber bildirimlerini güncelleyebilirsiniz"
            : "Tüm satış kalemlerini görüntüleyebilirsiniz"}
        </p>
      </div>

      {message && (
        <Alert className="mb-4">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Satış Kalemleri Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Tur</TableHead>
                  <TableHead>Mağaza</TableHead>
                  <TableHead>Rehber</TableHead>
                  <TableHead>Adet</TableHead>
                  <TableHead>Birim Fiyat</TableHead>
                  <TableHead>Rehber Bildirim Adet</TableHead>
                  <TableHead>Rehber Bildirim Fiyat</TableHead>
                  <TableHead>Bildirim Tarihi</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {satisKalemleri.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.urunler?.urun_adi}</TableCell>
                    <TableCell>{item.satislar?.tur}</TableCell>
                    <TableCell>
                      {item.satislar?.magazalar?.magaza_adi}
                    </TableCell>
                    <TableCell>
                      {item.satislar?.rehberler?.rehber_adi}
                    </TableCell>
                    <TableCell>{item.adet}</TableCell>
                    <TableCell>€{item.birim_fiyat}</TableCell>
                    <TableCell>{item.rehber_bildirim_adet || "-"}</TableCell>
                    <TableCell>
                      {item.rehber_bildirim_fiyati
                        ? `€${item.rehber_bildirim_fiyati}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {item.rehber_bildirim_tarihi
                        ? new Date(
                            item.rehber_bildirim_tarihi
                          ).toLocaleDateString("tr-TR")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Rehber Bildirimi Güncelle</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="adet">Rehber Bildirim Adet</Label>
                              <Input
                                id="adet"
                                type="number"
                                value={formData.rehber_bildirim_adet}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    rehber_bildirim_adet:
                                      Number.parseInt(e.target.value) || 0,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor="fiyat">
                                Rehber Bildirim Fiyat
                              </Label>
                              <Input
                                id="fiyat"
                                type="number"
                                step="0.01"
                                value={formData.rehber_bildirim_fiyati}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    rehber_bildirim_fiyati:
                                      Number.parseFloat(e.target.value) || 0,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor="not">Rehber Bildirim Notu</Label>
                              <Textarea
                                id="not"
                                value={formData.rehber_bildirim_notu}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    rehber_bildirim_notu: e.target.value,
                                  })
                                }
                                placeholder="İsteğe bağlı not..."
                              />
                            </div>
                            <Button onClick={handleUpdate} className="w-full">
                              Güncelle
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
