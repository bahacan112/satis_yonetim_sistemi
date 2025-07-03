"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  UserPlus,
  Key,
  Settings,
  UserMinus,
  Eye,
  EyeOff,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Rehber {
  id: string;
  rehber_adi: string;
  telefon?: string;
  email?: string;
  adres?: string;
  notlar?: string;
  aktif: boolean;
  created_at: string;
  has_user?: boolean; // Kullanıcı hesabı var mı?
}

const RehberlerPage = () => {
  const { user, userRole, loading } = useAuth();
  const [rehberler, setRehberler] = useState<Rehber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedRehber, setSelectedRehber] = useState<Rehber | null>(null);
  const [editingRehber, setEditingRehber] = useState<Rehber | null>(null);
  const [userFormData, setUserFormData] = useState({
    email: "",
    password: "",
  });
  const [passwordFormData, setPasswordFormData] = useState({
    new_password: "",
    confirm_password: "",
  });
  const [formData, setFormData] = useState({
    ad_soyad: "",
    telefon: "",
    email: "",
    adres: "",
    notlar: "",
    aktif: true,
  });
  const [showPassword, setShowPassword] = useState(false); // Şifre görünürlüğü için yeni state

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login";
    }
  }, [user, loading]);

  useEffect(() => {
    if (user) {
      fetchRehberler();
    }
  }, [user]);

  const fetchRehberler = async () => {
    try {
      // Rehberleri al
      const { data: rehberlerData, error: rehberlerError } = await supabase
        .from("rehberler")
        .select("*")
        .order("created_at", { ascending: false });

      if (rehberlerError) {
        console.error("Rehberler sorgu hatası:", rehberlerError);
        throw rehberlerError;
      }

      // Başlangıçta tüm rehberler için has_user = false
      const rehberlerWithUserStatus = (rehberlerData || []).map(
        (rehber: any) => ({
          ...rehber,
          has_user: false,
        })
      );

      setRehberler(rehberlerWithUserStatus);
    } catch (error) {
      console.error("Rehberler yüklenirken hata:", error);
      setRehberler([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Rehber kullanıcı durumunu kontrol etmek için ayrı bir fonksiyon
  const checkRehberUserStatus = async () => {
    if (rehberler.length === 0) return;

    try {
      const response = await fetch("/api/check-rehber-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rehber_ids: rehberler.map((r) => r.id),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.userStatus) {
        setRehberler((prev) =>
          prev.map((rehber) => ({
            ...rehber,
            has_user: result.userStatus[rehber.id] || false,
          }))
        );
      }
    } catch (error) {
      console.error("Kullanıcı durumu kontrol hatası:", error);
      // Hata durumunda sessizce devam et
    }
  };

  // Rehberler yüklendikten sonra kullanıcı durumlarını kontrol et
  useEffect(() => {
    if (rehberler.length > 0) {
      // Biraz bekle sonra kontrol et
      const timer = setTimeout(() => {
        checkRehberUserStatus();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [rehberler.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const dbData = {
        rehber_adi: formData.ad_soyad,
        telefon: formData.telefon || null,
        email: formData.email || null,
        adres: formData.adres || null,
        notlar: formData.notlar || null,
        aktif: formData.aktif,
      };

      if (editingRehber) {
        const { error } = await supabase
          .from("rehberler")
          .update(dbData)
          .eq("id", editingRehber.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("rehberler").insert([dbData]);
        if (error) throw error;
      }

      await fetchRehberler();
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Başarılı!",
        description: editingRehber
          ? "Rehber güncellendi."
          : "Yeni rehber eklendi.",
      });
    } catch (error) {
      console.error("Rehber kaydedilirken hata:", error);
      toast({
        title: "Hata!",
        description: "Bir hata oluştu!",
        variant: "destructive",
      });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRehber) return;

    try {
      const response = await fetch("/api/create-rehber-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userFormData.email,
          password: userFormData.password,
          rehber_id: selectedRehber.id,
          full_name: selectedRehber.rehber_adi,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Kullanıcı oluşturulamadı");
      }

      toast({
        title: "Başarılı!",
        description: `${selectedRehber.rehber_adi} için kullanıcı hesabı oluşturuldu.`,
      });

      setIsUserDialogOpen(false);
      setUserFormData({ email: "", password: "" });

      // Kullanıcı oluşturulduktan sonra durumu güncelle
      setTimeout(() => {
        checkRehberUserStatus();
      }, 1000);
    } catch (error: any) {
      console.error("Kullanıcı oluşturma hatası:", error);
      toast({
        title: "Hata!",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRehber) return;

    if (passwordFormData.new_password !== passwordFormData.confirm_password) {
      toast({
        title: "Hata!",
        description: "Şifreler eşleşmiyor!",
        variant: "destructive",
      });
      return;
    }

    if (passwordFormData.new_password.length < 6) {
      toast({
        title: "Hata!",
        description: "Şifre en az 6 karakter olmalı!",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/update-rehber-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rehber_id: selectedRehber.id,
          new_password: passwordFormData.new_password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Şifre güncellenemedi");
      }

      toast({
        title: "Başarılı!",
        description: `${selectedRehber.rehber_adi} kullanıcısının şifresi güncellendi.`,
      });

      setIsPasswordDialogOpen(false);
      setPasswordFormData({ new_password: "", confirm_password: "" });
    } catch (error: any) {
      console.error("Şifre güncelleme hatası:", error);
      toast({
        title: "Hata!",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveUser = async (rehber: Rehber) => {
    if (
      !confirm(
        `${rehber.rehber_adi} kullanıcısının sistem erişimini kaldırmak istediğinizden emin misiniz?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/remove-rehber-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rehber_id: rehber.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Kullanıcı kaldırılamadı");
      }

      toast({
        title: "Başarılı!",
        description: `${rehber.rehber_adi} kullanıcısının sistem erişimi kaldırıldı.`,
      });

      // Kullanıcı kaldırıldıktan sonra durumu güncelle
      setTimeout(() => {
        checkRehberUserStatus();
      }, 1000);
    } catch (error: any) {
      console.error("Kullanıcı kaldırma hatası:", error);
      toast({
        title: "Hata!",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (rehber: Rehber) => {
    setEditingRehber(rehber);
    setFormData({
      ad_soyad: rehber.rehber_adi || "",
      telefon: rehber.telefon || "",
      email: rehber.email || "",
      adres: rehber.adres || "",
      notlar: rehber.notlar || "",
      aktif: rehber.aktif,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (userRole !== "admin") {
      toast({
        title: "Yetki Hatası",
        description: "Bu işlemi yapmaya yetkiniz yok!",
        variant: "destructive",
      });
      return;
    }
    if (!confirm("Bu rehberi silmek istediğinizden emin misiniz?")) return;

    try {
      const { error } = await supabase.from("rehberler").delete().eq("id", id);
      if (error) throw error;
      await fetchRehberler();
      toast({
        title: "Başarılı!",
        description: "Rehber silindi.",
      });
    } catch (error) {
      console.error("Rehber silinirken hata:", error);
      toast({
        title: "Hata!",
        description: "Bir hata oluştu!",
        variant: "destructive",
      });
    }
  };

  const openUserDialog = (rehber: Rehber) => {
    setSelectedRehber(rehber);
    setUserFormData({
      email: rehber.email || "",
      password: "",
    });
    setIsUserDialogOpen(true);
  };

  const openPasswordDialog = (rehber: Rehber) => {
    setSelectedRehber(rehber);
    setPasswordFormData({ new_password: "", confirm_password: "" });
    setShowPassword(false); // Dialog açıldığında şifre görünürlüğünü sıfırla
    setIsPasswordDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      ad_soyad: "",
      telefon: "",
      email: "",
      adres: "",
      notlar: "",
      aktif: true,
    });
    setEditingRehber(null);
  };

  if (loading) {
    return <div className="p-6">Yükleniyor...</div>;
  }

  if (!user) {
    return null;
  }

  if (userRole !== "admin" && userRole !== "standart") {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>Bu sayfaya erişim yetkiniz yok.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Rehberler</h1>
          <p className="text-gray-600">
            Rehber bilgilerini yönetin ve sisteme giriş yetkisi verin
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Rehber
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingRehber ? "Rehber Düzenle" : "Yeni Rehber"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="ad_soyad">Ad Soyad *</Label>
                <Input
                  id="ad_soyad"
                  value={formData.ad_soyad}
                  onChange={(e) =>
                    setFormData({ ...formData, ad_soyad: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="telefon">Telefon</Label>
                <Input
                  id="telefon"
                  value={formData.telefon}
                  onChange={(e) =>
                    setFormData({ ...formData, telefon: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="adres">Adres</Label>
                <Textarea
                  id="adres"
                  value={formData.adres}
                  onChange={(e) =>
                    setFormData({ ...formData, adres: e.target.value })
                  }
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="notlar">Notlar</Label>
                <Textarea
                  id="notlar"
                  value={formData.notlar}
                  onChange={(e) =>
                    setFormData({ ...formData, notlar: e.target.value })
                  }
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="aktif"
                  checked={formData.aktif}
                  onChange={(e) =>
                    setFormData({ ...formData, aktif: e.target.checked })
                  }
                />
                <Label htmlFor="aktif">Aktif</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingRehber ? "Güncelle" : "Kaydet"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  İptal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kullanıcı Oluşturma Dialogu */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Rehber Kullanıcısı Oluştur
              </div>
            </DialogTitle>
            <p className="text-sm text-gray-600">
              {selectedRehber?.rehber_adi} için sisteme giriş hesabı oluşturun
            </p>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <Label htmlFor="user_email">E-posta *</Label>
              <Input
                id="user_email"
                type="email"
                value={userFormData.email}
                onChange={(e) =>
                  setUserFormData({ ...userFormData, email: e.target.value })
                }
                required
                placeholder="rehber@example.com"
              />
            </div>

            <div className="relative">
              <Label htmlFor="user_password">Şifre *</Label>
              <Input
                id="user_password"
                type={showPassword ? "text" : "password"}
                value={userFormData.password}
                onChange={(e) =>
                  setUserFormData({ ...userFormData, password: e.target.value })
                }
                required
                minLength={6}
                placeholder="En az 6 karakter"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-7 h-8 w-8 p-0"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                </span>
              </Button>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Not:</strong> Bu rehber "rehber" rolüyle sisteme giriş
                yapabilecek ve sadece kendi satış bilgilerini görebilecek.
              </p>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                <Key className="w-4 h-4 mr-2" />
                Kullanıcı Oluştur
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUserDialogOpen(false)}
              >
                İptal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Şifre Değiştirme Dialogu */}
      <Dialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Şifre Değiştir
              </div>
            </DialogTitle>
            <p className="text-sm text-gray-600">
              {selectedRehber?.rehber_adi} kullanıcısının şifresini değiştirin
            </p>
          </DialogHeader>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="relative">
              <Label htmlFor="new_password">Yeni Şifre *</Label>
              <Input
                id="new_password"
                type={showPassword ? "text" : "password"}
                value={passwordFormData.new_password}
                onChange={(e) =>
                  setPasswordFormData({
                    ...passwordFormData,
                    new_password: e.target.value,
                  })
                }
                required
                minLength={6}
                placeholder="En az 6 karakter"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-7 h-8 w-8 p-0"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                </span>
              </Button>
            </div>

            <div className="relative">
              <Label htmlFor="confirm_password">Şifre Tekrar *</Label>
              <Input
                id="confirm_password"
                type={showPassword ? "text" : "password"}
                value={passwordFormData.confirm_password}
                onChange={(e) =>
                  setPasswordFormData({
                    ...passwordFormData,
                    confirm_password: e.target.value,
                  })
                }
                required
                minLength={6}
                placeholder="Şifreyi tekrar girin"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-7 h-8 w-8 p-0"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                </span>
              </Button>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Uyarı:</strong> Şifre değiştirildikten sonra
                kullanıcının yeni şifre ile giriş yapması gerekecek.
              </p>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                <Key className="w-4 h-4 mr-2" />
                Şifreyi Güncelle
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPasswordDialogOpen(false)}
              >
                İptal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Rehber Listesi ({rehberler.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Yükleniyor...</div>
          ) : rehberler.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Henüz rehber eklenmemiş
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ad Soyad</TableHead>
                    <TableHead>İletişim</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Sistem Girişi</TableHead>
                    <TableHead>Kayıt Tarihi</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rehberler.map((rehber) => (
                    <TableRow key={rehber.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {rehber.rehber_adi || "-"}
                          </div>
                          {rehber.notlar && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {rehber.notlar}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {rehber.telefon && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="w-3 h-3" />
                              {rehber.telefon}
                            </div>
                          )}
                          {rehber.email && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Mail className="w-3 h-3" />
                              {rehber.email}
                            </div>
                          )}
                          {rehber.adres && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate max-w-xs">
                                {rehber.adres}
                              </span>
                            </div>
                          )}
                          {!rehber.telefon &&
                            !rehber.email &&
                            !rehber.adres && (
                              <div className="text-sm text-gray-400">
                                İletişim bilgisi yok
                              </div>
                            )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={rehber.aktif ? "default" : "secondary"}>
                          {rehber.aktif ? "Aktif" : "Pasif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {rehber.has_user ? (
                          <Badge
                            variant="default"
                            className="bg-green-100 text-green-800"
                          >
                            ✅ Giriş Yapabilir
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-gray-100 text-gray-600"
                          >
                            ⭕ Kullanıcı Yok
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(rehber.created_at).toLocaleDateString(
                          "tr-TR"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(rehber)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>

                          {userRole === "admin" &&
                            !rehber.has_user &&
                            rehber.aktif && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openUserDialog(rehber)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <UserPlus className="w-4 h-4" />
                              </Button>
                            )}

                          {userRole === "admin" && rehber.has_user && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-800 bg-transparent"
                                >
                                  <Settings className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem
                                  onClick={() => openPasswordDialog(rehber)}
                                >
                                  <Key className="w-4 h-4 mr-2" />
                                  Şifre Değiştir
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleRemoveUser(rehber)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <UserMinus className="w-4 h-4 mr-2" />
                                  Kullanıcı Erişimini Kaldır
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}

                          {userRole === "admin" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(rehber.id)}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RehberlerPage;
