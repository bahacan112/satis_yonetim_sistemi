"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Edit,
  Trash2,
  Plus,
  Save,
  X,
  Phone,
  Calendar,
  Users,
  MapPin,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface Satis {
  id: string;
  grup_gelis_tarihi: string | null;
  magaza_giris_tarihi: string | null;
  grup_pax: number | null;
  magaza_pax: number | null;
  rehber_id: string | null;
  created_at: string;
  // Relations
  firmalar?: { firma_adi: string };
  magazalar?: { magaza_adi: string };
  operatorler?: { operator_adi: string };
  turlar?: { tur_adi: string };
  rehber_satis_kalemleri?: RehberSatisKalemi[];
}

interface RehberSatisKalemi {
  id: string;
  satis_id: string;
  urun_id: string;
  adet: number;
  birim_fiyat: number;
  status: "onaylandı" | "beklemede" | "iptal";
  satis_aciklamasi: string | null;
  created_at: string;
  urunler?: { urun_adi: string };
}

interface Urun {
  id: string;
  urun_adi: string;
}

interface EditingKalem {
  id?: string;
  satis_id: string;
  urun_id: string;
  adet: string;
  birim_fiyat: string;
  status: "onaylandı" | "beklemede" | "iptal";
  satis_aciklamasi: string;
}

export default function RehberSatisBildirimiPage() {
  const { userRole, user } = useAuth();
  const [satislar, setSatislar] = useState<Satis[]>([]);
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRehberId, setUserRehberId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  // Dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSatis, setEditingSatis] = useState<Satis | null>(null);
  const [editingMagazaPax, setEditingMagazaPax] = useState("");
  const [editingKalemler, setEditingKalemler] = useState<EditingKalem[]>([]);

  useEffect(() => {
    if (user && userRole === "rehber") {
      fetchUserProfile();
    }
  }, [user, userRole]);

  useEffect(() => {
    if (userRehberId) {
      fetchData();
    }
  }, [userRehberId]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      // Profile'dan full_name'i al
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (!profile?.full_name) {
        setMessage("Profile'ınızda isim bilgisi bulunamadı.");
        return;
      }

      // Full name ile rehberler tablosunda eşleşme ara
      const { data: rehberMatch, error: rehberError } = await supabase
        .from("rehberler")
        .select("id, rehber_adi")
        .ilike("rehber_adi", profile.full_name.trim())
        .single();

      if (rehberError) {
        // Benzer isim ara
        const { data: similarRehber, error: similarError } = await supabase
          .from("rehberler")
          .select("id, rehber_adi")
          .ilike("rehber_adi", `%${profile.full_name.trim()}%`)
          .limit(1)
          .single();

        if (similarError || !similarRehber) {
          setMessage(
            `Rehber kaydınız bulunamadı. Profile isminiz: ${profile.full_name}`
          );
          return;
        }

        setUserRehberId(similarRehber.id);
      } else {
        setUserRehberId(rehberMatch.id);
      }
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      setMessage(`Profil bilgisi alınamadı: ${error.message}`);
    }
  };

  const fetchData = async () => {
    try {
      // Sadece bu rehbere atanan satışları getir
      const { data: satisData, error: satisError } = await supabase
        .from("satislar")
        .select(
          `
          id,
          grup_gelis_tarihi,
          magaza_giris_tarihi,
          grup_pax,
          magaza_pax,
          rehber_id,
          created_at,
          firmalar (firma_adi),
          magazalar (magaza_adi),
          operatorler (operator_adi),
          turlar (tur_adi),
          rehber_satis_kalemleri (
            id,
            satis_id,
            urun_id,
            adet,
            birim_fiyat,
            status,
            satis_aciklamasi,
            created_at,
            urunler (urun_adi)
          )
        `
        )
        .eq("rehber_id", userRehberId)
        .order("created_at", { ascending: false });

      if (satisError) throw satisError;

      // Tüm ürünleri getir
      const { data: urunData, error: urunError } = await supabase
        .from("urunler")
        .select("id, urun_adi")
        .order("urun_adi");

      if (urunError) throw urunError;

      setSatislar(satisData || []);
      setUrunler(urunData || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      setMessage(`Veri çekme hatası: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSatis = (satis: Satis) => {
    setEditingSatis(satis);
    setEditingMagazaPax(satis.magaza_pax?.toString() || "");

    // Mevcut rehber satış kalemlerini düzenleme formatına çevir
    const kalemler: EditingKalem[] = (satis.rehber_satis_kalemleri || []).map(
      (kalem) => ({
        id: kalem.id,
        satis_id: kalem.satis_id,
        urun_id: kalem.urun_id,
        adet: kalem.adet.toString(),
        birim_fiyat: kalem.birim_fiyat.toString(),
        status: kalem.status,
        satis_aciklamasi: kalem.satis_aciklamasi || "",
      })
    );

    // Eğer hiç kalem yoksa boş bir kalem ekle
    if (kalemler.length === 0) {
      kalemler.push({
        satis_id: satis.id,
        urun_id: "",
        adet: "1",
        birim_fiyat: "",
        status: "onaylandı",
        satis_aciklamasi: "",
      });
    }

    setEditingKalemler(kalemler);
    setIsEditDialogOpen(true);
  };

  const addNewKalem = () => {
    if (!editingSatis) return;

    setEditingKalemler([
      ...editingKalemler,
      {
        satis_id: editingSatis.id,
        urun_id: "",
        adet: "1",
        birim_fiyat: "",
        status: "onaylandı",
        satis_aciklamasi: "",
      },
    ]);
  };

  const removeKalem = (index: number) => {
    if (editingKalemler.length > 1) {
      setEditingKalemler(editingKalemler.filter((_, i) => i !== index));
    }
  };

  const updateKalem = (
    index: number,
    field: keyof EditingKalem,
    value: string
  ) => {
    setEditingKalemler((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSaveChanges = async () => {
    if (!editingSatis) return;

    try {
      // Mağaza PAX güncelle
      const { error: satisUpdateError } = await supabase
        .from("satislar")
        .update({
          magaza_pax: editingMagazaPax
            ? Number.parseInt(editingMagazaPax)
            : null,
        })
        .eq("id", editingSatis.id);

      if (satisUpdateError) throw satisUpdateError;

      // Mevcut rehber satış kalemlerini sil
      const { error: deleteError } = await supabase
        .from("rehber_satis_kalemleri")
        .delete()
        .eq("satis_id", editingSatis.id);

      if (deleteError) throw deleteError;

      // Yeni kalemleri ekle
      const validKalemler = editingKalemler.filter(
        (kalem) => kalem.urun_id && kalem.adet && kalem.birim_fiyat
      );

      if (validKalemler.length > 0) {
        const { error: insertError } = await supabase
          .from("rehber_satis_kalemleri")
          .insert(
            validKalemler.map((kalem) => ({
              satis_id: kalem.satis_id,
              urun_id: kalem.urun_id,
              adet: Number.parseInt(kalem.adet),
              birim_fiyat: Number.parseFloat(kalem.birim_fiyat),
              status: kalem.status,
              satis_aciklamasi: kalem.satis_aciklamasi || null,
            }))
          );

        if (insertError) throw insertError;
      }

      toast({
        title: "Başarılı!",
        description: "Satış bildirimi güncellendi.",
      });

      setIsEditDialogOpen(false);
      fetchData(); // Verileri yenile
    } catch (error: any) {
      console.error("Error saving changes:", error);
      toast({
        title: "Hata!",
        description: `Kaydetme hatası: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteKalem = async (kalemId: string) => {
    if (!confirm("Bu kalemi silmek istediğinizden emin misiniz?")) return;

    try {
      const { error } = await supabase
        .from("rehber_satis_kalemleri")
        .delete()
        .eq("id", kalemId);

      if (error) throw error;

      toast({
        title: "Başarılı!",
        description: "Kalem silindi.",
      });

      fetchData(); // Verileri yenile
    } catch (error: any) {
      console.error("Error deleting kalem:", error);
      toast({
        title: "Hata!",
        description: `Silme hatası: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const calculateToplamTutar = (kalemler: RehberSatisKalemi[]) => {
    return kalemler.reduce(
      (sum, kalem) => sum + kalem.adet * kalem.birim_fiyat,
      0
    );
  };

  const getDisplayDate = (satis: Satis) => {
    return (
      satis.magaza_giris_tarihi || satis.grup_gelis_tarihi || satis.created_at
    );
  };

  if (userRole !== "rehber") {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            Bu sayfa sadece rehber kullanıcıları içindir.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!userRehberId) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            {message || "Rehber bilginiz bulunamadı."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Satış Bildirimlerim
        </h1>
        <p className="text-gray-600">
          Size atanan satışlar için bildirim yapabilirsiniz
        </p>
        <p className="text-sm text-blue-600 mt-1">
          📋 {satislar.length} satış kaydı bulundu. Mağaza PAX sayısını ve satış
          kalemlerinizi güncelleyebilirsiniz.
        </p>
      </div>

      {message && (
        <Alert className="mb-4">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {satislar.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Phone className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Henüz size atanan satış yok
              </h3>
              <p className="text-gray-500">
                Size atanan satışlar burada görünecek.
              </p>
            </CardContent>
          </Card>
        ) : (
          satislar.map((satis) => (
            <Card key={satis.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="font-semibold">
                        {new Date(getDisplayDate(satis)).toLocaleDateString(
                          "tr-TR"
                        )}
                      </span>
                      <Badge variant="outline">
                        {satis.turlar?.tur_adi || "N/A"}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span className="font-medium">
                          {satis.firmalar?.firma_adi}
                        </span>{" "}
                        - {satis.magazalar?.magaza_adi}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Grup PAX: {satis.grup_pax || 0} | Mağaza PAX:{" "}
                        {satis.magaza_pax || 0}
                      </div>
                      <div>
                        Operatör: {satis.operatorler?.operator_adi || "N/A"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    {satis.rehber_satis_kalemleri &&
                      satis.rehber_satis_kalemleri.length > 0 && (
                        <div className="text-lg font-bold text-green-600">
                          €
                          {calculateToplamTutar(
                            satis.rehber_satis_kalemleri
                          ).toFixed(2)}
                        </div>
                      )}
                    <Button onClick={() => handleEditSatis(satis)} size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Düzenle
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {satis.rehber_satis_kalemleri &&
                satis.rehber_satis_kalemleri.length > 0 && (
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ürün</TableHead>
                          <TableHead>Adet</TableHead>
                          <TableHead>Birim Fiyat</TableHead>
                          <TableHead>Toplam</TableHead>
                          <TableHead>Durum</TableHead>
                          <TableHead>İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {satis.rehber_satis_kalemleri.map((kalem) => (
                          <TableRow key={kalem.id}>
                            <TableCell className="font-medium">
                              {kalem.urunler?.urun_adi || "N/A"}
                            </TableCell>
                            <TableCell>{kalem.adet}</TableCell>
                            <TableCell>
                              €{kalem.birim_fiyat.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              €{(kalem.adet * kalem.birim_fiyat).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {kalem.status === "onaylandı" && (
                                <Badge
                                  variant="default"
                                  className="bg-green-100 text-green-800"
                                >
                                  Onaylandı
                                </Badge>
                              )}
                              {kalem.status === "beklemede" && (
                                <Badge variant="secondary">Beklemede</Badge>
                              )}
                              {kalem.status === "iptal" && (
                                <Badge variant="destructive">İptal</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteKalem(kalem.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                )}
            </Card>
          ))
        )}
      </div>

      {/* Düzenleme Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Satış Bildirimi Düzenle</DialogTitle>
          </DialogHeader>

          {editingSatis && (
            <div className="space-y-6">
              {/* Satış Bilgileri */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Satış Bilgileri</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Tarih:</span>{" "}
                    {new Date(getDisplayDate(editingSatis)).toLocaleDateString(
                      "tr-TR"
                    )}
                  </div>
                  <div>
                    <span className="font-medium">Tur:</span>{" "}
                    {editingSatis.turlar?.tur_adi || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Firma:</span>{" "}
                    {editingSatis.firmalar?.firma_adi || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Mağaza:</span>{" "}
                    {editingSatis.magazalar?.magaza_adi || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Grup PAX:</span>{" "}
                    {editingSatis.grup_pax || 0}
                  </div>
                </div>
              </div>

              {/* Mağaza PAX Düzenleme */}
              <div>
                <Label htmlFor="magaza_pax">Mağaza PAX Sayısı</Label>
                <Input
                  id="magaza_pax"
                  type="number"
                  value={editingMagazaPax}
                  onChange={(e) => setEditingMagazaPax(e.target.value)}
                  placeholder="Mağaza PAX sayısını girin"
                />
              </div>

              {/* Satış Kalemleri */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label className="text-lg font-semibold">
                    Satış Kalemleri
                  </Label>
                  <Button type="button" variant="outline" onClick={addNewKalem}>
                    <Plus className="w-4 h-4 mr-2" />
                    Kalem Ekle
                  </Button>
                </div>

                {editingKalemler.map((kalem, index) => (
                  <Card key={index} className="p-4 mb-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label>Ürün</Label>
                        <select
                          value={kalem.urun_id}
                          onChange={(e) =>
                            updateKalem(index, "urun_id", e.target.value)
                          }
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="">Ürün seçin</option>
                          {urunler.map((urun) => (
                            <option key={urun.id} value={urun.id}>
                              {urun.urun_adi}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label>Adet</Label>
                        <Input
                          type="number"
                          value={kalem.adet}
                          onChange={(e) =>
                            updateKalem(index, "adet", e.target.value)
                          }
                          min="1"
                        />
                      </div>

                      <div>
                        <Label>Birim Fiyat</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={kalem.birim_fiyat}
                          onChange={(e) =>
                            updateKalem(index, "birim_fiyat", e.target.value)
                          }
                        />
                      </div>

                      <div>
                        <Label>Durum</Label>
                        <select
                          value={kalem.status}
                          onChange={(e) =>
                            updateKalem(
                              index,
                              "status",
                              e.target.value as
                                | "onaylandı"
                                | "beklemede"
                                | "iptal"
                            )
                          }
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="onaylandı">Onaylandı</option>
                          <option value="beklemede">Beklemede</option>
                          <option value="iptal">İptal</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-4">
                      <Label>Açıklama</Label>
                      <Textarea
                        value={kalem.satis_aciklamasi}
                        onChange={(e) =>
                          updateKalem(index, "satis_aciklamasi", e.target.value)
                        }
                        placeholder="Satış kalemi için açıklama"
                        rows={2}
                      />
                    </div>

                    <div className="flex justify-end mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeKalem(index)}
                        disabled={editingKalemler.length === 1}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Kaldır
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              <X className="w-4 h-4 mr-2" />
              İptal
            </Button>
            <Button onClick={handleSaveChanges}>
              <Save className="w-4 h-4 mr-2" />
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
