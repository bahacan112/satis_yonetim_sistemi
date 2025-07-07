"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/contexts/i18n-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Trash2, Plus, Edit } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

interface Tur {
  id: string; // ID artık UUID olduğu için string
  tur_adi: string;
  tur_aciklamasi?: string | null; // 'aciklama' yerine 'tur_aciklamasi'
  created_at: string;
}

export default function TurlarPage() {
  const { userRole } = useAuth();
  const { t } = useI18n();
  const [turlar, setTurlar] = useState<Tur[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTur, setEditingTur] = useState<Tur | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    tur_adi: "",
    tur_aciklamasi: "", // 'aciklama' yerine 'tur_aciklamasi'
  });
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchTurlar();
  }, [searchTerm]);

  const fetchTurlar = async () => {
    try {
      setLoading(true);
      let query = supabase.from("turlar").select("*");

      if (searchTerm) {
        query = query.ilike("tur_adi", `%${searchTerm}%`);
      }

      const { data, error } = await query.order("tur_adi");

      if (error) throw error;
      setTurlar(data || []);
    } catch (error) {
      console.error("Error fetching turlar:", error);
      toast({
        title: t("common.error"),
        description: `${t("common.error")}: ${
          (error as any).message || t("common.error")
        }`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingTur) {
        const { error } = await supabase
          .from("turlar")
          .update({
            tur_adi: formData.tur_adi,
            tur_aciklamasi: formData.tur_aciklamasi, // 'aciklama' yerine 'tur_aciklamasi'
          })
          .eq("id", editingTur.id);

        if (error) throw error;
        setMessage(
          t("tours.updateSuccess").replace("{name}", formData.tur_adi)
        );
        toast({
          title: t("common.success"),
          description: t("tours.updateSuccess").replace(
            "{name}",
            formData.tur_adi
          ),
        });
      } else {
        const { error } = await supabase.from("turlar").insert({
          tur_adi: formData.tur_adi,
          tur_aciklamasi: formData.tur_aciklamasi, // 'aciklama' yerine 'tur_aciklamasi'
        });

        if (error) throw error;
        setMessage(t("tours.addSuccess").replace("{name}", formData.tur_adi));
        toast({
          title: t("common.success"),
          description: t("tours.addSuccess").replace(
            "{name}",
            formData.tur_adi
          ),
        });
      }

      setIsDialogOpen(false);
      setEditingTur(null);
      resetForm();
      fetchTurlar();

      setTimeout(() => setMessage(""), 3000);
    } catch (error: any) {
      console.error("Error saving tur:", error);
      const errorMessage = error.message || error.details || t("common.error");
      setMessage(`${t("common.error")}: ${errorMessage}`);
      toast({
        title: t("common.error"),
        description: `${t("common.error")}: ${errorMessage}`,
        variant: "destructive",
      });
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const resetForm = () => {
    setFormData({
      tur_adi: "",
      tur_aciklamasi: "", // 'aciklama' yerine 'tur_aciklamasi'
    });
  };

  const handleDelete = async (id: string) => {
    if (userRole !== "admin") {
      setMessage(t("tours.noPermission"));
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    if (!confirm(t("tours.deleteConfirm"))) return;

    try {
      const { error } = await supabase.from("turlar").delete().eq("id", id);
      if (error) throw error;

      setMessage(t("tours.deleteSuccess"));
      toast({
        title: t("common.success"),
        description: t("tours.deleteSuccess"),
      });
      fetchTurlar();
      setTimeout(() => setMessage(""), 3000);
    } catch (error: any) {
      console.error("Error deleting tur:", error);
      const errorMessage = error.message || error.details || t("common.error");
      setMessage(`${t("common.error")}: ${errorMessage}`);
      toast({
        title: t("common.error"),
        description: `${t("common.error")}: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const handleAdd = () => {
    setEditingTur(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (tur: Tur) => {
    setEditingTur(tur);
    setFormData({
      tur_adi: tur.tur_adi,
      tur_aciklamasi: tur.tur_aciklamasi || "", // 'aciklama' yerine 'tur_aciklamasi'
    });
    setIsDialogOpen(true);
  };

  if (userRole !== "admin" && userRole !== "standart") {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>{t("tours.noPermission")}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return <div>{t("common.loading")}</div>;
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t("tours.title")}
          </h1>
          <p className="text-gray-600">{t("tours.subtitle")}</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          {t("tours.newTour")}
        </Button>
      </div>

      {message && (
        <Alert className="mb-4">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-4">
        <CardContent className="p-4">
          <Input
            placeholder={t("tours.filterPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {t("tours.list")} ({turlar.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("tours.tourName")}</TableHead>
                <TableHead>{t("tours.tourDescription")}</TableHead>
                <TableHead>{t("tours.creationDate")}</TableHead>
                <TableHead>{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {turlar.map((tur) => (
                <TableRow key={tur.id}>
                  <TableCell className="font-medium">{tur.tur_adi}</TableCell>
                  <TableCell>{tur.tur_aciklamasi || "-"}</TableCell>{" "}
                  {/* 'aciklama' yerine 'tur_aciklamasi' */}
                  <TableCell>
                    {new Date(tur.created_at).toLocaleDateString("tr-TR")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(tur)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {userRole === "admin" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(tur.id)}
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
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTur ? t("tours.editTour") : t("tours.addTour")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="tur_adi">{t("tours.tourNameRequired")}</Label>
              <Input
                id="tur_adi"
                value={formData.tur_adi}
                onChange={(e) =>
                  setFormData({ ...formData, tur_adi: e.target.value })
                }
                placeholder={t("tours.tourNamePlaceholder")}
                required
              />
            </div>
            <div>
              <Label htmlFor="tur_aciklamasi">
                {t("tours.tourDescription")}
              </Label>{" "}
              {/* 'aciklama' yerine 'tur_aciklamasi' */}
              <Textarea
                id="tur_aciklamasi" // 'aciklama' yerine 'tur_aciklamasi'
                value={formData.tur_aciklamasi}
                onChange={(e) =>
                  setFormData({ ...formData, tur_aciklamasi: e.target.value })
                }
                placeholder={t("tours.tourDescriptionPlaceholder")}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit">
                {editingTur ? t("tours.updateTour") : t("common.add")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
