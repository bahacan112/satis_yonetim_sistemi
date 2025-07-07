"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Edit, Plus, Trash2 } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/contexts/i18n-context";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Urun {
  id: string; // ← UUID now
  urun_adi: string;
  urun_aciklamasi?: string;
  created_at: string;
}

export default function UrunlerPage() {
  const { userRole } = useAuth();
  const { t } = useI18n();

  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUrun, setEditingUrun] = useState<Urun | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    urun_adi: "",
    urun_aciklamasi: "",
  });
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  async function fetchData() {
    setLoading(true);
    try {
      let query = supabase.from("urunler").select("*");
      if (searchQuery) query = query.ilike("urun_adi", `%${searchQuery}%`);
      const { data, error } = await query.order("created_at", {
        ascending: false,
      });
      if (error) throw error;
      setUrunler((data as Urun[]) || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = {
        urun_adi: formData.urun_adi,
        urun_aciklamasi: formData.urun_aciklamasi,
      };
      if (editingUrun) {
        const { error } = await supabase
          .from("urunler")
          .update(payload)
          .eq("id", editingUrun.id);
        if (error) throw error;
        setMessage(t("products.updateSuccess"));
      } else {
        const { error } = await supabase.from("urunler").insert(payload);
        if (error) throw error;
        setMessage(t("products.addSuccess"));
      }
      closeDialog();
      fetchData();
    } catch (err: any) {
      console.error("Error saving urun:", err);
      setMessage(t("products.saveError").replace("{error}", err.message));
    }
  }

  function handleEdit(urun: Urun) {
    setEditingUrun(urun);
    setFormData({
      urun_adi: urun.urun_adi,
      urun_aciklamasi: urun.urun_aciklamasi || "",
    });
    setIsDialogOpen(true);
  }

  async function handleDelete(id: string) {
    if (userRole !== "admin") {
      setMessage(t("products.noPermission"));
      return setTimeout(() => setMessage(""), 3000);
    }
    if (!confirm(t("products.deleteConfirm"))) return;
    try {
      const { error } = await supabase.from("urunler").delete().eq("id", id);
      if (error) throw error;
      setMessage(t("products.deleteSuccess"));
      fetchData();
    } catch (err: any) {
      console.error("Error deleting urun:", err);
      setMessage(t("products.deleteError").replace("{error}", err.message));
    } finally {
      setTimeout(() => setMessage(""), 3000);
    }
  }

  function handleAdd() {
    resetForm();
    setIsDialogOpen(true);
  }

  function resetForm() {
    setEditingUrun(null);
    setFormData({ urun_adi: "", urun_aciklamasi: "" });
  }

  function closeDialog() {
    setIsDialogOpen(false);
    resetForm();
    setTimeout(() => setMessage(""), 3000);
  }

  if (userRole !== "admin" && userRole !== "standart") {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>{t("access.noPermission")}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) return <div className="p-6">{t("common.loading")}</div>;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t("products.title")}
          </h1>
          <p className="text-gray-600">{t("products.subtitle")}</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          {t("products.addNew")}
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
            {t("products.list")}{" "}
            {t("products.count").replace("{count}", urunler.length.toString())}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder={t("products.filterPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("products.name")}</TableHead>
                  <TableHead>{t("products.description")}</TableHead>
                  <TableHead>{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {urunler.map((urun) => (
                  <TableRow key={urun.id}>
                    <TableCell className="font-medium">
                      {urun.urun_adi}
                    </TableCell>
                    <TableCell>{urun.urun_aciklamasi || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(urun)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {userRole === "admin" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(urun.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogTrigger asChild>
          {/* Hidden trigger for programmatic open */}
          <button className="hidden" />
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUrun ? t("products.edit") : t("products.addTitle")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="urun_adi">{t("products.name")} *</Label>
              <Input
                id="urun_adi"
                required
                placeholder={t("products.namePlaceholder")}
                value={formData.urun_adi}
                onChange={(e) =>
                  setFormData({ ...formData, urun_adi: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="urun_aciklamasi">
                {t("products.description")}
              </Label>
              <Input
                id="urun_aciklamasi"
                placeholder={t("products.descriptionPlaceholder")}
                value={formData.urun_aciklamasi}
                onChange={(e) =>
                  setFormData({ ...formData, urun_aciklamasi: e.target.value })
                }
              />
            </div>
            <div className="text-sm text-gray-600">
              {t("products.addToStoreNote")}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeDialog}>
                {t("common.cancel")}
              </Button>
              <Button type="submit">
                {editingUrun ? t("common.update") : t("common.add")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
