"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { supabase, type Database } from "@/lib/supabase";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Trash2,
  Plus,
  Calendar,
  BarChart,
  Edit,
  Filter,
  X,
  AlertTriangle,
  CheckCircle,
  Phone,
  Store,
  Clock,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

// Import dialog components
import { AddUrunDialog } from "@/components/dialogs/add-urun-dialog";
import { AddMagazaDialog } from "@/components/dialogs/add-magaza-dialog";
import { AddOperatorDialog } from "@/components/dialogs/add-operator-dialog";
import { AddTurDialog } from "@/components/dialogs/add-tur-dialog";
import { AddFirmaDialog } from "@/components/dialogs/add-firma-dialog";
import { AddRehberDialog } from "@/components/dialogs/add-rehber-dialog";

// satislar_detay_view'den gelen veriye uygun arayüz
interface SatisDetayViewRow {
  satis_id: string;
  satis_tarihi: string | null;
  grup_gelis_tarihi: string | null;
  magaza_giris_tarihi: string | null;
  grup_pax: number | null;
  magaza_pax: number | null;
  tur: string | null;
  created_at: string;
  operator_adi: string | null;
  rehber_adi: string | null;
  magaza_adi: string | null;
  firma_adi: string | null;
  urun_id: string | null;
  urun_adi: string | null;
  adet: number | null;
  birim_fiyat: number | null;
  acente_komisyonu: number | null;
  rehber_komisyonu: number | null;
  kaptan_komisyonu: number | null;
  ofis_komisyonu: number | null;
  toplam_tutar: number | null;
  bildirim_tipi: "magaza" | "rehber";
  status: "onaylandı" | "beklemede" | "iptal" | null;
  acente_komisyon_tutari: number | null;
  rehber_komisyon_tutari: number | null;
  kaptan_komisyon_tutari: number | null;
  ofis_komisyon_tutari: number | null;
  rehber_teyyit_edildi: boolean;
  rehber_teyyit_birim_fiyat: number | null;
  rehber_teyyit_adet: number | null;
  rehber_teyyit_toplam_tutar: null;
  satis_aciklamasi: string | null;
}

interface Operator {
  id: string;
  operator_adi: string;
}

interface Rehber {
  id: string;
  rehber_adi: string;
}

interface Magaza {
  id: string;
  magaza_adi: string;
  firma_id: string;
}

interface Firma {
  id: string;
  firma_adi: string;
}

interface Tur {
  id: string;
  tur_adi: string;
}

interface Urun {
  id: string;
  urun_adi: string;
}

interface MagazaUrun {
  id: string;
  urun_id: string;
  acente_komisyonu: number;
  rehber_komisyonu: number;
  kaptan_komisyonu: number;
  ofis_komisyonu: number;
  urunler:
    | {
        urun_adi: string;
      }
    | { urun_adi: string }[]
    | null;
}

interface SatisUrun {
  urun_id: string;
  adet: string;
  birim_fiyat: string;
  bildirim_tipi: "magaza" | "rehber";
  status: "onaylandı" | "beklemede" | "iptal";
  acente_komisyonu: string;
  rehber_komisyonu: string;
  kaptan_komisyonu: string;
  ofis_komisyonu: string;
  showCommissions: boolean;
  satis_aciklamasi: string;
}

interface GroupedSatis {
  date: string;
  firma: string;
  magaza: string;
  operator: string;
  tur: string;
  grup_pax: number;
  magaza_pax: number;
  rehber: string;
  satislar: SatisDetayViewRow[];
  toplam_tutar: number;
  magaza_satislari: SatisDetayViewRow[];
  rehber_satislari: SatisDetayViewRow[];
  magaza_toplam: number;
  rehber_toplam: number;
  uyumlu: boolean;
}

interface Filters {
  baslangic_tarihi: string;
  bitis_tarihi: string;
  firma_id: string;
  magaza_id: string;
  operator_id: string;
  rehber_id: string;
  bildirim_tipi: string;
  durum: string;
  tur_id: string;
}

interface SatisFormState {
  satis_id?: string | null;
  operator_id: string;
  firma_id: string;
  grup_gelis_tarihi: string;
  satis_tarihi: string;
  grup_pax: string;
  magaza_pax: string;
  tur_id: string;
  rehber_id: string;
  magaza_id: string;
}

const defaultSatisUrun: SatisUrun = {
  urun_id: "",
  adet: "1",
  birim_fiyat: "",
  bildirim_tipi: "magaza",
  status: "onaylandı",
  acente_komisyonu: "",
  rehber_komisyonu: "",
  kaptan_komisyonu: "",
  ofis_komisyonu: "",
  showCommissions: false,
  satis_aciklamasi: "",
};

const defaultFormDataState: SatisFormState = {
  operator_id: "",
  firma_id: "",
  grup_gelis_tarihi: "",
  satis_tarihi: new Date().toISOString().split("T")[0],
  grup_pax: "",
  magaza_pax: "",
  tur_id: "",
  rehber_id: "",
  magaza_id: "",
};

const sendAdminNotification = async (
  action: string,
  userEmail: string,
  details: any
) => {
  try {
    const { data: adminUsers, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin");

    if (error) {
      console.error("Admin kullanıcıları bulunamadı:", error);
      return;
    }

    const notifications = adminUsers?.map((admin) => ({
      user_id: admin.id,
      title: `Satış ${action}`,
      message: `${userEmail} tarafından satış ${action} işlemi yapıldı. Detaylar: ${JSON.stringify(
        details
      )}`,
      type: "sales_update",
      read: false,
      created_at: new Date().toISOString(),
    }));

    if (notifications && notifications.length > 0) {
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (notificationError) {
        console.error("Bildirim gönderme hatası:", notificationError);
      } else {
        console.log("Admin bildirimleri başarıyla gönderildi");
      }
    }
  } catch (error) {
    console.error("Bildirim sistemi hatası:", error);
  }
};

export default function SatislarPage() {
  const { userRole, user } = useAuth();
  const [satislar, setSatislar] = useState<SatisDetayViewRow[]>([]);
  const [filteredSatislar, setFilteredSatislar] = useState<SatisDetayViewRow[]>(
    []
  );
  const [groupedSatislar, setGroupedSatislar] = useState<GroupedSatis[]>([]);
  const [operatorler, setOperatorler] = useState<Operator[]>([]);
  const [rehberler, setRehberler] = useState<Rehber[]>([]);
  const [magazalar, setMagazalar] = useState<Magaza[]>([]);
  const [allMagazalar, setAllMagazalar] = useState<Magaza[]>([]);
  const [firmalar, setFirmalar] = useState<Firma[]>([]);
  const [turlar, setTurlar] = useState<Tur[]>([]);
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [magazaUrunleri, setMagazaUrunleri] = useState<MagazaUrun[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSatis, setEditingSatis] = useState<
    Database["public"]["Tables"]["satislar"]["Row"] | null
  >(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isOranlarDialogOpen, setIsOranlarDialogOpen] = useState(false);
  const [selectedSatis, setSelectedSatis] = useState<SatisDetayViewRow | null>(
    null
  );
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    baslangic_tarihi: "",
    bitis_tarihi: "",
    firma_id: "all",
    magaza_id: "all",
    operator_id: "all",
    rehber_id: "all",
    bildirim_tipi: "all",
    durum: "all",
    tur_id: "all",
  });
  const [formData, setFormData] = useState<SatisFormState>({
    operator_id: "",
    firma_id: "",
    grup_gelis_tarihi: "",
    satis_tarihi: new Date().toISOString().split("T")[0],
    grup_pax: "",
    magaza_pax: "",
    tur_id: "",
    rehber_id: "",
    magaza_id: "",
  });
  const [satisUrunleri, setSatisUrunleri] = useState<SatisUrun[]>([
    {
      urun_id: "",
      adet: "1",
      birim_fiyat: "",
      bildirim_tipi: userRole === "standart" ? "rehber" : "magaza",
      status: "onaylandı",
      acente_komisyonu: "",
      rehber_komisyonu: "",
      kaptan_komisyonu: "",
      ofis_komisyonu: "",
      showCommissions: false,
      satis_aciklamasi: "",
    },
  ]);
  const [message, setMessage] = useState("");

  const [isAddUrunDialogOpen, setIsAddUrunDialogOpen] = useState(false);
  const [isAddMagazaDialogOpen, setIsAddMagazaDialogOpen] = useState(false);
  const [isAddOperatorDialogOpen, setIsAddOperatorDialogOpen] = useState(false);
  const [isAddTurDialogOpen, setIsAddTurDialogOpen] = useState(false);
  const [isAddFirmaDialogOpen, setIsAddFirmaDialogOpen] = useState(false);
  const [isAddRehberDialogOpen, setIsAddRehberDialogOpen] = useState(false);

  const [isConfirmCloseDialogOpen, setIsConfirmCloseDialogOpen] =
    useState(false);
  const [isFormSubmittedSuccessfully, setIsFormSubmittedSuccessfully] =
    useState(false);

  const [initialFormData, setInitialFormData] = useState<SatisFormState | null>(
    null
  );
  const [initialSatisUrunleri, setInitialSatisUrunleri] = useState<
    SatisUrun[] | null
  >(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const canSeePrices = (bildirimTipi: "magaza" | "rehber") => {
    if (userRole === "admin") return true;
    if (userRole === "standart") {
      return bildirimTipi === "rehber";
    }
    return false;
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.firma_id) {
      fetchFirmaMagazalari(formData.firma_id);
    }
  }, [formData.firma_id]);

  useEffect(() => {
    if (filters.firma_id && filters.firma_id !== "all") {
      fetchFilterMagazalari(filters.firma_id);
    } else {
      setMagazalar([]);
    }
  }, [filters.firma_id]);

  useEffect(() => {
    if (formData.magaza_id) {
      console.log("Mağaza seçildi, ürünler çekiliyor:", formData.magaza_id);
      fetchMagazaUrunleri(formData.magaza_id);
    } else {
      console.log("Mağaza seçimi temizlendi");
      setMagazaUrunleri([]);
    }
  }, [formData.magaza_id]);

  useEffect(() => {
    applyFilters();
  }, [satislar, filters]);

  useEffect(() => {
    groupSatislar();
  }, [filteredSatislar]);

  useEffect(() => {
    if (!isDialogOpen || !initialFormData || !initialSatisUrunleri) {
      setHasUnsavedChanges(false);
      return;
    }

    const formChanged =
      JSON.stringify(formData) !== JSON.stringify(initialFormData);
    const satisUrunleriChanged =
      JSON.stringify(satisUrunleri) !== JSON.stringify(initialSatisUrunleri);

    setHasUnsavedChanges(formChanged || satisUrunleriChanged);
  }, [
    formData,
    satisUrunleri,
    initialFormData,
    initialSatisUrunleri,
    isDialogOpen,
  ]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const fetchData = async () => {
    try {
      const { data: satislarData, error: satislarError } = await supabase
        .from("satislar")
        .select(
          `
     id,
     operator_id,
     firma_id,
     grup_gelis_tarihi,
     magaza_giris_tarihi,
     grup_pax,
     magaza_pax,
     tur_id,
     rehber_id,
     magaza_id,
     created_at
   `
        )
        .order("magaza_giris_tarihi", { ascending: false })
        .order("id", { ascending: false });

      if (satislarError) throw satislarError;

      const enrichedSatislar: SatisDetayViewRow[] = [];

      for (const satis of satislarData || []) {
        const { data: magazaKalemleri, error: magazaError } = await supabase
          .from("magaza_satis_kalemleri")
          .select(
            `
       urun_id,
       adet,
       birim_fiyat,
       acente_komisyonu,
       rehber_komisyonu,
       kaptan_komisyonu,
       ofis_komisyonu,
       status,
       satis_aciklamasi,
       urunler (urun_adi)
     `
          )
          .eq("satis_id", satis.id);

        if (magazaError) throw magazaError;

        const { data: rehberKalemleri, error: rehberError } = await supabase
          .from("rehber_satis_kalemleri")
          .select(
            `
       urun_id,
       adet,
       birim_fiyat,
       status,
       satis_aciklamasi,
       urunler (urun_adi)
     `
          )
          .eq("satis_id", satis.id);

        if (rehberError) throw rehberError;

        const [operatorData, firmaData, magazaData, turData, rehberData] =
          await Promise.all([
            satis.operator_id
              ? supabase
                  .from("operatorler")
                  .select("operator_adi")
                  .eq("id", satis.operator_id)
                  .single()
              : { data: null },
            satis.firma_id
              ? supabase
                  .from("firmalar")
                  .select("firma_adi")
                  .eq("id", satis.firma_id)
                  .single()
              : { data: null },
            satis.magaza_id
              ? supabase
                  .from("magazalar")
                  .select("magaza_adi")
                  .eq("id", satis.magaza_id)
                  .single()
              : { data: null },
            satis.tur_id
              ? supabase
                  .from("turlar")
                  .select("tur_adi")
                  .eq("id", satis.tur_id)
                  .single()
              : { data: null },
            satis.rehber_id
              ? supabase
                  .from("rehberler")
                  .select("rehber_adi")
                  .eq("id", satis.rehber_id)
                  .single()
              : { data: null },
          ]);

        for (const kalem of magazaKalemleri || []) {
          const toplamTutar = (kalem.adet || 0) * (kalem.birim_fiyat || 0);
          enrichedSatislar.push({
            satis_id: satis.id,
            satis_tarihi: satis.magaza_giris_tarihi,
            grup_gelis_tarihi: satis.grup_gelis_tarihi,
            magaza_giris_tarihi: satis.magaza_giris_tarihi,
            grup_pax: satis.grup_pax,
            magaza_pax: satis.magaza_pax,
            tur: turData.data?.tur_adi || null,
            created_at: satis.created_at,
            operator_adi: operatorData.data?.operator_adi || null,
            rehber_adi: rehberData.data?.rehber_adi || null,
            magaza_adi: magazaData.data?.magaza_adi || null,
            firma_adi: firmaData.data?.firma_adi || null,
            urun_id: kalem.urun_id,
            urun_adi: kalem.urunler?.urun_adi || null,
            adet: kalem.adet,
            birim_fiyat: kalem.birim_fiyat,
            acente_komisyonu: kalem.acente_komisyonu,
            rehber_komisyonu: kalem.rehber_komisyonu,
            kaptan_komisyonu: kalem.kaptan_komisyonu,
            ofis_komisyonu: kalem.ofis_komisyonu,
            toplam_tutar: toplamTutar,
            bildirim_tipi: "magaza" as const,
            status: kalem.status,
            acente_komisyon_tutari:
              (toplamTutar * (kalem.acente_komisyonu || 0)) / 100,
            rehber_komisyon_tutari:
              (toplamTutar * (kalem.rehber_komisyonu || 0)) / 100,
            kaptan_komisyon_tutari:
              (toplamTutar * (kalem.kaptan_komisyonu || 0)) / 100,
            ofis_komisyon_tutari:
              (toplamTutar * (kalem.ofis_komisyonu || 0)) / 100,
            rehber_teyyit_edildi: false,
            rehber_teyyit_birim_fiyat: null,
            rehber_teyyit_adet: null,
            rehber_teyyit_toplam_tutar: null,
            satis_aciklamasi: kalem.satis_aciklamasi,
          });
        }

        for (const kalem of rehberKalemleri || []) {
          const toplamTutar = (kalem.adet || 0) * (kalem.birim_fiyat || 0);
          enrichedSatislar.push({
            satis_id: satis.id,
            satis_tarihi: satis.magaza_giris_tarihi,
            grup_gelis_tarihi: satis.grup_gelis_tarihi,
            magaza_giris_tarihi: satis.magaza_giris_tarihi,
            grup_pax: satis.grup_pax,
            magaza_pax: satis.magaza_pax,
            tur: turData.data?.tur_adi || null,
            created_at: satis.created_at,
            operator_adi: operatorData.data?.operator_adi || null,
            rehber_adi: rehberData.data?.rehber_adi || null,
            magaza_adi: magazaData.data?.magaza_adi || null,
            firma_adi: firmaData.data?.firma_adi || null,
            urun_id: kalem.urun_id,
            urun_adi: kalem.urunler?.urun_adi || null,
            adet: kalem.adet,
            birim_fiyat: kalem.birim_fiyat,
            acente_komisyonu: null,
            rehber_komisyonu: null,
            kaptan_komisyonu: null,
            ofis_komisyonu: null,
            toplam_tutar: toplamTutar,
            bildirim_tipi: "rehber" as const,
            status: kalem.status,
            acente_komisyon_tutari: null,
            rehber_komisyon_tutari: null,
            kaptan_komisyon_tutari: null,
            ofis_komisyon_tutari: null,
            rehber_teyyit_edildi: false,
            rehber_teyyit_birim_fiyat: null,
            rehber_teyyit_adet: null,
            rehber_teyyit_toplam_tutar: null,
            satis_aciklamasi: kalem.satis_aciklamasi,
          });
        }
      }

      setSatislar(enrichedSatislar);

      const { data: operatorData, error: operatorError } = await supabase
        .from("operatorler")
        .select("id, operator_adi")
        .order("operator_adi");

      if (operatorError) throw operatorError;

      const { data: rehberData, error: rehberError } = await supabase
        .from("rehberler")
        .select("id, rehber_adi")
        .order("rehber_adi");

      if (rehberError) throw rehberError;

      const { data: firmaData, error: firmaError } = await supabase
        .from("firmalar")
        .select("id, firma_adi")
        .order("firma_adi");

      if (firmaError) throw firmaError;

      const { data: allMagazaData, error: allMagazaError } = await supabase
        .from("magazalar")
        .select("id, magaza_adi, firma_id")
        .order("magaza_adi");

      if (allMagazaError) throw allMagazaError;

      const { data: turData, error: turError } = await supabase
        .from("turlar")
        .select("id, tur_adi")
        .order("tur_adi");

      if (turError) throw turError;

      const { data: urunData, error: urunError } = await supabase
        .from("urunler")
        .select("id, urun_adi")
        .order("urun_adi");

      if (urunError) throw urunError;

      setOperatorler(operatorData || []);
      setRehberler(rehberData || []);
      setFirmalar(firmaData || []);
      setAllMagazalar(allMagazaData || []);
      setTurlar(turData || []);
      setUrunler(urunData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFirmaMagazalari = async (firmaId: string) => {
    try {
      const { data, error } = await supabase
        .from("magazalar")
        .select("id, magaza_adi, firma_id")
        .eq("firma_id", firmaId)
        .order("magaza_adi");

      if (error) throw error;
      setMagazalar(data || []);
    } catch (error) {
      console.error("Error fetching firma magazalari:", error);
      setMagazalar([]);
    }
  };

  const fetchFilterMagazalari = async (firmaId: string) => {
    try {
      const { data, error } = await supabase
        .from("magazalar")
        .select("id, magaza_adi, firma_id")
        .eq("firma_id", firmaId)
        .order("magaza_adi");

      if (error) throw error;
      setMagazalar(data || []);
    } catch (error) {
      console.error("Error fetching filter magazalari:", error);
      setMagazalar([]);
    }
  };

  const fetchMagazaUrunleri = async (magazaId: string) => {
    try {
      console.log("Mağaza ürünleri çekiliyor:", magazaId);
      const { data, error } = await supabase
        .from("magaza_urunler")
        .select(
          `
id,
urun_id,
acente_komisyonu,
rehber_komisyonu,
kaptan_komisyonu,
ofis_komisyonu,
urunler (
urun_adi
)
`
        )
        .eq("magaza_id", magazaId)
        .eq("aktif", true)
        .order("id");

      if (error) throw error;

      console.log("Çekilen mağaza ürünleri:", data);

      const typedData: MagazaUrun[] = (data || []).map((item: any) => ({
        ...item,
        urunler: item.urunler || null,
      }));
      setMagazaUrunleri(typedData);
      console.log("State'e set edilen mağaza ürünleri:", typedData);
    } catch (error) {
      console.error("Error fetching magaza urunleri:", error);
      setMagazaUrunleri([]);
    }
  };

  const applyFilters = () => {
    let filtered = [...satislar];

    if (filters.baslangic_tarihi) {
      filtered = filtered.filter(
        (satis) =>
          satis.satis_tarihi && satis.satis_tarihi >= filters.baslangic_tarihi
      );
    }

    if (filters.bitis_tarihi) {
      filtered = filtered.filter(
        (satis) =>
          satis.satis_tarihi && satis.satis_tarihi <= filters.bitis_tarihi
      );
    }

    if (filters.firma_id && filters.firma_id !== "all") {
      const selectedFirma = firmalar.find(
        (f) => f.id.toString() === filters.firma_id
      );
      if (selectedFirma) {
        filtered = filtered.filter(
          (satis) => satis.firma_adi === selectedFirma.firma_adi
        );
      }
    }

    if (filters.magaza_id && filters.magaza_id !== "all") {
      const selectedMagaza = allMagazalar.find(
        (m) => m.id.toString() === filters.magaza_id
      );
      if (selectedMagaza) {
        filtered = filtered.filter(
          (satis) => satis.magaza_adi === selectedMagaza.magaza_adi
        );
      }
    }

    if (filters.operator_id && filters.operator_id !== "all") {
      const selectedOperator = operatorler.find(
        (o) => o.id.toString() === filters.operator_id
      );
      if (selectedOperator) {
        filtered = filtered.filter(
          (satis) => satis.operator_adi === selectedOperator.operator_adi
        );
      }
    }

    if (filters.rehber_id && filters.rehber_id !== "all") {
      const selectedRehber = rehberler.find(
        (r) => r.id.toString() === filters.rehber_id
      );
      if (selectedRehber) {
        filtered = filtered.filter(
          (satis) => satis.rehber_adi === selectedRehber.rehber_adi
        );
      }
    }

    if (filters.bildirim_tipi && filters.bildirim_tipi !== "all") {
      filtered = filtered.filter(
        (satis) => satis.bildirim_tipi === filters.bildirim_tipi
      );
    }

    if (filters.tur_id && filters.tur_id !== "all") {
      const selectedTur = turlar.find(
        (t) => t.id.toString() === filters.tur_id
      );
      if (selectedTur) {
        filtered = filtered.filter(
          (satis) => satis.tur === selectedTur.tur_adi
        );
      }
    }

    setFilteredSatislar(filtered);
  };

  const groupSatislar = () => {
    const grouped: { [key: string]: GroupedSatis } = {};

    filteredSatislar.forEach((satis) => {
      const key = `${satis.satis_id}`;

      if (!grouped[key]) {
        grouped[key] = {
          date: satis.satis_tarihi || "",
          firma: satis.firma_adi || "-",
          magaza: satis.magaza_adi || "-",
          operator: satis.operator_adi || "-",
          tur: satis.tur || "-",
          grup_pax: satis.grup_pax || 0,
          magaza_pax: satis.magaza_pax || 0,
          rehber: satis.rehber_adi || "-",
          satislar: [],
          toplam_tutar: 0,
          magaza_satislari: [],
          rehber_satislari: [],
          magaza_toplam: 0,
          rehber_toplam: 0,
          uyumlu: true,
        };
      }

      grouped[key].satislar.push(satis);

      const itemToplamTutar =
        satis.status !== "iptal" ? Number(satis.toplam_tutar) || 0 : 0;

      if (satis.bildirim_tipi === "magaza") {
        grouped[key].magaza_satislari.push(satis);
        grouped[key].magaza_toplam += itemToplamTutar;
      } else if (satis.bildirim_tipi === "rehber") {
        grouped[key].rehber_satislari.push(satis);
        grouped[key].rehber_toplam += itemToplamTutar;
      }
    });

    Object.values(grouped).forEach((group) => {
      const tolerans = 0.01;
      group.uyumlu =
        Math.abs(group.magaza_toplam - group.rehber_toplam) <= tolerans;
      group.toplam_tutar = group.magaza_toplam;
    });

    let finalGroups = Object.values(grouped);
    if (filters.durum && filters.durum !== "all") {
      if (filters.durum === "uyumlu") {
        finalGroups = finalGroups.filter(
          (group) =>
            group.uyumlu && group.magaza_toplam > 0 && group.rehber_toplam > 0
        );
      } else if (filters.durum === "uyumsuz") {
        finalGroups = finalGroups.filter(
          (group) =>
            !group.uyumlu && group.magaza_toplam > 0 && group.rehber_toplam > 0
        );
      } else if (filters.durum === "rehber_yok") {
        finalGroups = finalGroups.filter(
          (group) => group.magaza_toplam > 0 && group.rehber_toplam === 0
        );
      } else if (filters.durum === "magaza_yok") {
        finalGroups = finalGroups.filter(
          (group) => group.magaza_toplam === 0 && group.rehber_toplam > 0
        );
      }
    }

    setGroupedSatislar(finalGroups);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      let currentSatisId: string | null = null;
      const isUpdate = !!formData.satis_id;

      if (formData.satis_id) {
        currentSatisId = formData.satis_id;
        const { error: updateSatisError } = await supabase
          .from("satislar")
          .update({
            operator_id: formData.operator_id || null,
            firma_id: formData.firma_id || null,
            grup_gelis_tarihi: formData.grup_gelis_tarihi || null,
            magaza_giris_tarihi: formData.satis_tarihi || null,
            grup_pax: formData.grup_pax
              ? Number.parseInt(formData.grup_pax)
              : 0,
            magaza_pax: formData.magaza_pax
              ? Number.parseInt(formData.magaza_pax)
              : 0,
            tur_id: formData.tur_id || null,
            rehber_id: formData.rehber_id || null,
            magaza_id: formData.magaza_id || null,
          })
          .eq("id", currentSatisId);

        if (updateSatisError) throw updateSatisError;

        const { error: deleteMagazaItemsError } = await supabase
          .from("magaza_satis_kalemleri")
          .delete()
          .eq("satis_id", currentSatisId);
        if (deleteMagazaItemsError) throw deleteMagazaItemsError;

        const { error: deleteRehberItemsError } = await supabase
          .from("rehber_satis_kalemleri")
          .delete()
          .eq("satis_id", currentSatisId);
        if (deleteRehberItemsError) throw deleteRehberItemsError;
      } else {
        const { data: newSatis, error: insertSatisError } = await supabase
          .from("satislar")
          .insert({
            operator_id: formData.operator_id || null,
            firma_id: formData.firma_id || null,
            grup_gelis_tarihi: formData.grup_gelis_tarihi || null,
            magaza_giris_tarihi: formData.satis_tarihi || null,
            grup_pax: formData.grup_pax
              ? Number.parseInt(formData.grup_pax)
              : 0,
            magaza_pax: formData.magaza_pax
              ? Number.parseInt(formData.magaza_pax)
              : 0,
            tur_id: formData.tur_id || null,
            rehber_id: formData.rehber_id || null,
            magaza_id: formData.magaza_id || null,
          })
          .select("id")
          .single();

        if (insertSatisError) throw insertSatisError;
        currentSatisId = newSatis.id;
      }

      const validUrunler = satisUrunleri.filter(
        (su) =>
          su.urun_id &&
          su.adet &&
          (canSeePrices(su.bildirim_tipi) ? su.birim_fiyat : true)
      );

      for (const satisUrun of validUrunler) {
        const selectedMagazaUrun = magazaUrunleri.find(
          (mu) => mu.urun_id === satisUrun.urun_id
        );

        const canEditPrice = canSeePrices(satisUrun.bildirim_tipi);
        const birimFiyat = canEditPrice
          ? Number.parseFloat(satisUrun.birim_fiyat)
          : 0;

        if (satisUrun.bildirim_tipi === "magaza") {
          const itemToSave = {
            satis_id: currentSatisId,
            urun_id: satisUrun.urun_id,
            adet: Number.parseInt(satisUrun.adet),
            birim_fiyat: birimFiyat,
            acente_komisyonu:
              userRole === "admin" && satisUrun.acente_komisyonu !== ""
                ? Number.parseFloat(satisUrun.acente_komisyonu)
                : selectedMagazaUrun?.acente_komisyonu || 0,
            rehber_komisyonu:
              userRole === "admin" && satisUrun.rehber_komisyonu !== ""
                ? Number.parseFloat(satisUrun.rehber_komisyonu)
                : selectedMagazaUrun?.rehber_komisyonu || 0,
            kaptan_komisyonu:
              userRole === "admin" && satisUrun.kaptan_komisyonu !== ""
                ? Number.parseFloat(satisUrun.kaptan_komisyonu)
                : selectedMagazaUrun?.kaptan_komisyonu || 0,
            ofis_komisyonu:
              userRole === "admin" && satisUrun.ofis_komisyonu !== ""
                ? Number.parseFloat(satisUrun.ofis_komisyonu)
                : selectedMagazaUrun?.ofis_komisyonu || 0,
            status: satisUrun.status,
            satis_aciklamasi: satisUrun.satis_aciklamasi || null,
          };
          const { error } = await supabase
            .from("magaza_satis_kalemleri")
            .insert(itemToSave);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("rehber_satis_kalemleri")
            .insert({
              satis_id: currentSatisId,
              urun_id: satisUrun.urun_id,
              adet: Number.parseInt(satisUrun.adet),
              birim_fiyat: birimFiyat,
              status: satisUrun.status,
              satis_aciklamasi: satisUrun.satis_aciklamasi || null,
            });
          if (error) throw error;
        }
      }

      if (userRole === "rehber" || userRole === "standart") {
        const actionType = isUpdate ? "güncellendi" : "eklendi";
        const notificationDetails = {
          satisId: currentSatisId,
          firma: firmalar.find((f) => f.id === formData.firma_id)?.firma_adi,
          magaza: magazalar.find((m) => m.id === formData.magaza_id)
            ?.magaza_adi,
          urunSayisi: validUrunler.length,
          bildirimTipi: validUrunler[0]?.bildirim_tipi,
          tarih: formData.satis_tarihi,
        };

        await sendAdminNotification(
          actionType,
          user?.email || "Bilinmeyen kullanıcı",
          notificationDetails
        );
      }

      toast({
        title: "Başarılı!",
        description: `Satış başarıyla ${
          formData.satis_id ? "güncellendi" : "eklendi"
        }! ${validUrunler.length} ürün kaydedildi.`,
      });
      setIsFormSubmittedSuccessfully(true);
      setIsDialogOpen(false);
      fetchData();
      setTimeout(() => setMessage(""), 3000);
    } catch (error: any) {
      console.error("Error saving satis:", JSON.stringify(error, null, 2));
      const errorMessage =
        error.message ||
        error.details ||
        error.hint ||
        "Bilinmeyen bir hata oluştu.";
      toast({
        title: "Hata!",
        description: `Hata: ${errorMessage}`,
        variant: "destructive",
      });
      setIsFormSubmittedSuccessfully(false);
    }
  };

  const resetForm = () => {
    const initialBildirimTipi = (
      userRole === "standart" ? "rehber" : "magaza"
    ) as "magaza" | "rehber";
    const resetSatisUrunleri = [
      { ...defaultSatisUrun, bildirim_tipi: initialBildirimTipi },
    ];

    setFormData(defaultFormDataState);
    setSatisUrunleri(resetSatisUrunleri);
    setInitialFormData(defaultFormDataState);
    setInitialSatisUrunleri(resetSatisUrunleri);
    setHasUnsavedChanges(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu satışı silmek istediğinizden emin misiniz?")) return;

    try {
      const { error: deleteMagazaItemsError } = await supabase
        .from("magaza_satis_kalemleri")
        .delete()
        .eq("satis_id", id);
      if (deleteMagazaItemsError) throw deleteMagazaItemsError;

      const { error: deleteRehberItemsError } = await supabase
        .from("rehber_satis_kalemleri")
        .delete()
        .eq("satis_id", id);
      if (deleteRehberItemsError) throw deleteRehberItemsError;

      const { error } = await supabase.from("satislar").delete().eq("id", id);
      if (error) throw error;

      if (userRole === "rehber" || userRole === "standart") {
        await sendAdminNotification(
          "silindi",
          user?.email || "Bilinmeyen kullanıcı",
          { satisId: id }
        );
      }

      toast({
        title: "Başarılı!",
        description: "Satış başarıyla silindi!",
      });
      fetchData();
      setTimeout(() => setMessage(""), 3000);
    } catch (error: any) {
      console.error("Error deleting satis:", error);
      const errorMessage =
        error.message ||
        error.details ||
        error.hint ||
        "Bilinmeyen bir hata oluştu.";
      toast({
        title: "Hata!",
        description: `Silme hatası: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const handleAdd = () => {
    const initialBildirimTipi = (
      userRole === "standart" ? "rehber" : "magaza"
    ) as "magaza" | "rehber";
    const newSatisUrunleri = [
      { ...defaultSatisUrun, bildirim_tipi: initialBildirimTipi },
    ];

    setEditingSatis(null);
    setFormData(defaultFormDataState);
    setSatisUrunleri(newSatisUrunleri);
    setInitialFormData(defaultFormDataState);
    setInitialSatisUrunleri(newSatisUrunleri);
    setIsFormSubmittedSuccessfully(false);
    setHasUnsavedChanges(false);
    setIsDialogOpen(true);
  };

  const handleEdit = async (satisDetay: SatisDetayViewRow) => {
    setLoading(true);
    try {
      const { data: originalSatis, error: satisError } = await supabase
        .from("satislar")
        .select("*")
        .eq("id", satisDetay.satis_id)
        .single();

      if (satisError) throw satisError;
      if (!originalSatis) {
        toast({
          title: "Hata!",
          description: "Orijinal satış verisi bulunamadı.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { data: magazaItems, error: magagaItemsError } = await supabase
        .from("magaza_satis_kalemleri")
        .select(
          "urun_id, adet, birim_fiyat, acente_komisyonu, rehber_komisyonu, kaptan_komisyonu, ofis_komisyonu, status, satis_aciklamasi"
        )
        .eq("satis_id", satisDetay.satis_id);
      if (magagaItemsError) throw magagaItemsError;

      const { data: rehberItems, error: rehberItemsError } = await supabase
        .from("rehber_satis_kalemleri")
        .select("urun_id, adet, birim_fiyat, status, satis_aciklamasi")
        .eq("satis_id", satisDetay.satis_id);
      if (rehberItemsError) throw rehberItemsError;

      const combinedItems: SatisUrun[] = [
        ...(magazaItems || []).map((item) => ({
          urun_id: item.urun_id?.toString() || "",
          adet: item.adet?.toString() || "1",
          birim_fiyat: item.birim_fiyat?.toString() || "",
          bildirim_tipi: "magaza" as "magaza" | "rehber",
          status: item.status || "onaylandı",
          acente_komisyonu: item.acente_komisyonu?.toString() || "",
          rehber_komisyonu: item.rehber_komisyonu?.toString() || "",
          kaptan_komisyonu: item.kaptan_komisyonu?.toString() || "",
          ofis_komisyonu: item.ofis_komisyonu?.toString() || "",
          showCommissions: false,
          satis_aciklamasi: item.satis_aciklamasi || "",
        })),
        ...(rehberItems || []).map((item) => ({
          urun_id: item.urun_id?.toString() || "",
          adet: item.adet?.toString() || "1",
          birim_fiyat: item.birim_fiyat?.toString() || "",
          bildirim_tipi: "rehber" as "magaza" | "rehber",
          status: item.status || "onaylandı",
          acente_komisyonu: "",
          rehber_komisyonu: "",
          kaptan_komisyonu: "",
          ofis_komisyonu: "",
          showCommissions: false,
          satis_aciklamasi: item.satis_aciklamasi || "",
        })),
      ];

      const currentFormData: SatisFormState = {
        satis_id: originalSatis.id,
        operator_id: originalSatis.operator_id?.toString() || "",
        firma_id: originalSatis.firma_id?.toString() || "",
        grup_gelis_tarihi: originalSatis.grup_gelis_tarihi || "",
        satis_tarihi: originalSatis.magaza_giris_tarihi || "",
        grup_pax: originalSatis.grup_pax?.toString() || "",
        magaza_pax: originalSatis.magaza_pax?.toString() || "",
        tur_id: originalSatis.tur_id?.toString() || "",
        rehber_id: originalSatis.rehber_id?.toString() || "",
        magaza_id: originalSatis.magaza_id?.toString() || "",
      };

      const currentSatisUrunleri: SatisUrun[] =
        combinedItems.length > 0
          ? combinedItems
          : [
              {
                ...defaultSatisUrun,
                bildirim_tipi: userRole === "standart" ? "rehber" : "magaza",
              },
            ];

      setEditingSatis(originalSatis);
      setFormData(currentFormData);
      setSatisUrunleri(currentSatisUrunleri);

      setInitialFormData(currentFormData);
      setInitialSatisUrunleri(currentSatisUrunleri);
      setIsFormSubmittedSuccessfully(false);
      setHasUnsavedChanges(false);

      if (originalSatis.magaza_id) {
        await fetchMagazaUrunleri(originalSatis.magaza_id.toString());
      } else {
        setMagazaUrunleri([]);
      }

      setIsDialogOpen(true);
    } catch (error: any) {
      console.error("Error handling edit:", error);
      const errorMessage =
        error.message ||
        error.details ||
        error.hint ||
        "Bilinmeyen bir hata oluştu.";
      toast({
        title: "Hata!",
        description: `Düzenleme hatası: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const showOranlar = (satis: SatisDetayViewRow) => {
    setSelectedSatis(satis);
    setIsOranlarDialogOpen(true);
  };

  const clearFilters = () => {
    setFilters({
      baslangic_tarihi: "",
      bitis_tarihi: "",
      firma_id: "all",
      magaza_id: "all",
      operator_id: "all",
      rehber_id: "all",
      bildirim_tipi: "all",
      durum: "all",
      tur_id: "all",
    });
  };

  const addUrunRow = () => {
    setSatisUrunleri([
      ...satisUrunleri,
      {
        urun_id: "",
        adet: "1",
        birim_fiyat: "",
        bildirim_tipi: userRole === "standart" ? "rehber" : "magaza",
        status: "onaylandı",
        acente_komisyonu: "",
        rehber_komisyonu: "",
        kaptan_komisyonu: "",
        ofis_komisyonu: "",
        showCommissions: false,
        satis_aciklamasi: "",
      },
    ]);
  };

  const removeUrunRow = (index: number) => {
    if (satisUrunleri.length > 1) {
      setSatisUrunleri(satisUrunleri.filter((_, i) => i !== index));
    }
  };

  const updateUrunRow = (
    index: number,
    field: keyof SatisUrun,
    value: string | boolean
  ) => {
    setSatisUrunleri((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const getDurumBadge = (group: GroupedSatis) => {
    if (group.magaza_toplam > 0 && group.rehber_toplam > 0) {
      if (group.uyumlu) {
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Tutarlar Uyumlu
          </Badge>
        );
      } else {
        return (
          <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Tutar Uyumsuzluğu
          </Badge>
        );
      }
    } else if (group.magaza_toplam > 0 && group.rehber_toplam === 0) {
      return (
        <Badge variant="secondary">
          <Store className="w-3 h-3 mr-1" />
          Rehber Teyyit Bekleniyor
        </Badge>
      );
    } else if (group.magaza_toplam === 0 && group.rehber_toplam > 0) {
      return (
        <Badge variant="secondary">
          <Phone className="w-3 h-3 mr-1" />
          Sadece Rehber Bildirimi
        </Badge>
      );
    }
    return null;
  };

  const handleUrunAdded = (newUrunId: string) => {
    if (formData.magaza_id) {
      fetchMagazaUrunleri(formData.magaza_id);
    }
    setTimeout(() => {
      setSatisUrunleri((prev) => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[0].urun_id = newUrunId;
        }
        return updated;
      });
    }, 500);
  };

  const handleMagazaAdded = (newMagazaId: string) => {
    fetchData();
    setFormData((prev) => ({ ...prev, magaza_id: newMagazaId }));
  };

  const handleOperatorAdded = (newOperatorId: string) => {
    fetchData();
    setFormData((prev) => ({ ...prev, operator_id: newOperatorId }));
  };

  const handleTurAdded = (newTurId: string) => {
    fetchData();
    setFormData((prev) => ({ ...prev, tur_id: newTurId }));
  };

  const handleFirmaAdded = (newFirmaId: string) => {
    fetchData();
    setFormData((prev) => ({ ...prev, firma_id: newFirmaId }));
  };

  const handleRehberAdded = (newRehberId: string) => {
    fetchData();
    setFormData((prev) => ({ ...prev, rehber_id: newRehberId }));
  };

  const handleUrunSelection = (index: number, urunId: string) => {
    console.log("Ürün seçildi:", urunId);
    console.log("Index:", index);
    console.log("Mevcut satış ürünleri state:", satisUrunleri[index]);
    console.log("Mevcut mağaza ürünleri:", magazaUrunleri);

    const updated = [...satisUrunleri];
    updated[index] = { ...updated[index], urun_id: urunId };
    setSatisUrunleri(updated);

    const selectedMagazaUrun = magazaUrunleri.find(
      (mu) => mu.urun_id === urunId
    );
    console.log("Bulunan mağaza ürünü:", selectedMagazaUrun);

    if (selectedMagazaUrun && userRole === "admin") {
      setTimeout(() => {
        setSatisUrunleri((prev) => {
          const newUpdated = [...prev];
          newUpdated[index] = {
            ...newUpdated[index],
            acente_komisyonu: selectedMagazaUrun.acente_komisyonu.toString(),
            rehber_komisyonu: selectedMagazaUrun.rehber_komisyonu.toString(),
            kaptan_komisyonu: selectedMagazaUrun.kaptan_komisyonu.toString(),
            ofis_komisyonu: selectedMagazaUrun.ofis_komisyonu.toString(),
          };
          return newUpdated;
        });
      }, 0);
    }
  };

  const handleMainDialogClose = (open: boolean) => {
    if (!open) {
      if (!isFormSubmittedSuccessfully && hasUnsavedChanges) {
        setIsConfirmCloseDialogOpen(true);
      } else {
        setIsDialogOpen(false);
        resetForm();
        setEditingSatis(null);
        setIsFormSubmittedSuccessfully(false);
        setHasUnsavedChanges(false);
      }
    } else {
      setIsDialogOpen(open);
      setIsFormSubmittedSuccessfully(false);
    }
  };

  const confirmDiscardChanges = () => {
    setIsConfirmCloseDialogOpen(false);
    setIsDialogOpen(false);
    resetForm();
    setEditingSatis(null);
    setIsFormSubmittedSuccessfully(false);
  };

  const cancelDiscardChanges = () => {
    setIsConfirmCloseDialogOpen(false);
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
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Satışlar
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Mağaza ürün bazında satışları yönetin
          </p>
          {userRole === "standart" && (
            <p className="text-xs sm:text-sm text-orange-600 mt-1">
              💡 Mağaza bildirimlerinde fiyat bilgisi gizlidir. Rehber
              bildirimlerinde fiyat düzenleyebilirsiniz.
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full sm:w-auto"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtrele
          </Button>
          <Button onClick={handleAdd} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Yeni Satış
          </Button>
        </div>
      </div>

      {/* Filtreler */}
      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Filtreler
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Temizle
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
              <div>
                <Label>Başlangıç Tarihi</Label>
                <Input
                  type="date"
                  value={filters.baslangic_tarihi}
                  onChange={(e) =>
                    setFilters({ ...filters, baslangic_tarihi: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Bitiş Tarihi</Label>
                <Input
                  type="date"
                  value={filters.bitis_tarihi}
                  onChange={(e) =>
                    setFilters({ ...filters, bitis_tarihi: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Firma</Label>
                <Select
                  value={filters.firma_id}
                  onValueChange={(value) =>
                    setFilters({
                      ...filters,
                      firma_id: value,
                      magaza_id: "all",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Firmalar</SelectItem>
                    {firmalar.map((firma) => (
                      <SelectItem key={firma.id} value={firma.id}>
                        {firma.firma_adi}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mağaza</Label>
                <Select
                  value={filters.magaza_id}
                  onValueChange={(value) =>
                    setFilters({ ...filters, magaza_id: value })
                  }
                  disabled={!filters.firma_id || magazalar.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Mağazalar</SelectItem>
                    {magazalar.map((magaza) => (
                      <SelectItem key={magaza.id} value={magaza.id}>
                        {magaza.magaza_adi}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Operatör</Label>
                <Select
                  value={filters.operator_id}
                  onValueChange={(value) =>
                    setFilters({ ...filters, operator_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Operatörler</SelectItem>
                    {operatorler.map((operator) => (
                      <SelectItem key={operator.id} value={operator.id}>
                        {operator.operator_adi}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Rehber</Label>
                <Select
                  value={filters.rehber_id}
                  onValueChange={(value) =>
                    setFilters({ ...filters, rehber_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key="all" value="all">
                      Tüm Rehberler
                    </SelectItem>
                    {rehberler.map((rehber) => (
                      <SelectItem key={rehber.id} value={rehber.id}>
                        {rehber.rehber_adi}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tur</Label>
                <Select
                  value={filters.tur_id}
                  onValueChange={(value) =>
                    setFilters({ ...filters, tur_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key="all" value="all">
                      Tüm Turlar
                    </SelectItem>
                    {turlar.map((tur) => (
                      <SelectItem key={tur.id} value={tur.id}>
                        {tur.tur_adi}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(userRole === "admin" || userRole === "standart") && (
                <div>
                  <Label>Bildirim Tipi</Label>
                  <Select
                    value={filters.bildirim_tipi}
                    onValueChange={(value) =>
                      setFilters({ ...filters, bildirim_tipi: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tümü" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Bildirimler</SelectItem>
                      <SelectItem value="magaza">Mağaza Bildirimi</SelectItem>
                      <SelectItem value="rehber">Rehber Bildirimi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Durum</Label>
                <Select
                  value={filters.durum}
                  onValueChange={(value) =>
                    setFilters({ ...filters, durum: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Durumlar</SelectItem>
                    <SelectItem value="uyumlu">Uyumlu</SelectItem>
                    <SelectItem value="uyumsuz">Uyumsuz</SelectItem>
                    <SelectItem value="rehber_yok">
                      Rehber Bildirimi Yok
                    </SelectItem>
                    <SelectItem value="magaza_yok">
                      Mağaza Bildirimi Yok
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {message && (
        <Alert className="mb-4">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            Satış Listesi ({groupedSatislar.length} ziyaret)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {groupedSatislar.map((group, groupIndex) => (
              <Card key={groupIndex} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span className="font-semibold text-sm sm:text-base">
                          {group.date
                            ? new Date(group.date).toLocaleDateString("tr-TR")
                            : "-"}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {group.tur}
                        </Badge>
                        {userRole === "admin" && getDurumBadge(group)}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600">
                        <span className="font-medium">{group.firma}</span> -{" "}
                        {group.magaza}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 flex flex-wrap gap-2">
                        <span>Operatör: {group.operator}</span>
                        <span>Rehber: {group.rehber}</span>
                        <span>Grup PAX: {group.grup_pax}</span>
                        <span>Mağaza PAX: {group.magaza_pax}</span>
                      </div>
                    </div>
                    {userRole === "admin" && (
                      <div className="text-right space-y-1 lg:min-w-[150px]">
                        <div className="text-lg font-bold text-green-600">
                          ₺{group.magaza_toplam.toFixed(2)}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500">
                          Mağaza Toplam Tutar
                        </div>
                        {group.magaza_toplam > 0 || group.rehber_toplam > 0 ? (
                          <div className="text-xs text-gray-400">
                            M: ₺{group.magaza_toplam.toFixed(2)} | R: ₺
                            {group.rehber_toplam.toFixed(2)}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table className="min-w-full">
                      <TableHeader>
                        <TableRow>
                          {/* Ürün sütunu - standart kullanıcılar için mağaza satışlarında gizli */}
                          {userRole === "admin" && (
                            <TableHead className="min-w-[120px]">
                              Ürün
                            </TableHead>
                          )}
                          {userRole === "standart" && (
                            <TableHead className="min-w-[120px]">
                              Ürün
                            </TableHead>
                          )}

                          {(userRole === "admin" ||
                            userRole === "standart") && (
                            <TableHead className="min-w-[100px]">
                              Bildirim
                            </TableHead>
                          )}

                          {/* Adet sütunu - standart kullanıcılar için mağaza satışlarında gizli */}
                          {userRole === "admin" && (
                            <TableHead className="min-w-[60px]">Adet</TableHead>
                          )}
                          {userRole === "standart" && (
                            <TableHead className="min-w-[60px]">Adet</TableHead>
                          )}

                          {(userRole === "admin" ||
                            userRole === "standart") && (
                            <TableHead className="min-w-[100px]">
                              Birim Fiyat
                            </TableHead>
                          )}
                          {(userRole === "admin" ||
                            userRole === "standart") && (
                            <TableHead className="min-w-[100px]">
                              Toplam
                            </TableHead>
                          )}

                          {/* Durum sütunu - standart kullanıcılar için mağaza satışlarında gizli */}
                          {userRole === "admin" && (
                            <TableHead className="min-w-[100px]">
                              Durum
                            </TableHead>
                          )}
                          {userRole === "standart" && (
                            <TableHead className="min-w-[100px]">
                              Durum
                            </TableHead>
                          )}

                          <TableHead className="min-w-[200px]">
                            İşlemler
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Mağaza Satışları */}
                        {group.magaza_satislari.map((satis, itemIndex) => (
                          <TableRow
                            key={`magaza-${satis.satis_id}-${itemIndex}`}
                          >
                            {/* Ürün adı - standart kullanıcılar için mağaza satışlarında gizli */}
                            {userRole === "admin" && (
                              <TableCell className="font-medium">
                                {satis.urun_adi || "-"}
                              </TableCell>
                            )}
                            {userRole === "standart" && (
                              <TableCell className="font-medium">
                                ****
                              </TableCell>
                            )}

                            {(userRole === "admin" ||
                              userRole === "standart") && (
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="bg-blue-50 text-blue-700 text-xs"
                                >
                                  <Store className="w-3 h-3 mr-1" />
                                  Mağaza
                                </Badge>
                              </TableCell>
                            )}

                            {/* Adet - standart kullanıcılar için mağaza satışlarında gizli */}
                            {userRole === "admin" && (
                              <TableCell>{satis.adet || 0}</TableCell>
                            )}
                            {userRole === "standart" && (
                              <TableCell>****</TableCell>
                            )}

                            {userRole === "admin" && (
                              <TableCell>₺{satis.birim_fiyat || 0}</TableCell>
                            )}
                            {userRole === "standart" && (
                              <TableCell>
                                {satis.bildirim_tipi === "magaza"
                                  ? "****"
                                  : `₺${satis.birim_fiyat || 0}`}
                              </TableCell>
                            )}
                            {userRole === "admin" && (
                              <TableCell>₺{satis.toplam_tutar || 0}</TableCell>
                            )}
                            {userRole === "standart" && (
                              <TableCell>
                                {satis.bildirim_tipi === "magaza"
                                  ? "****"
                                  : `₺${satis.toplam_tutar || 0}`}
                              </TableCell>
                            )}

                            {/* Durum - standart kullanıcılar için mağaza satışlarında gizli */}
                            {userRole === "admin" && (
                              <TableCell>
                                {satis.status === "onaylandı" && (
                                  <Badge
                                    variant="default"
                                    className="bg-green-100 text-green-800 text-xs"
                                  >
                                    Onaylandı
                                  </Badge>
                                )}
                                {satis.status === "beklemede" && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    <Clock className="w-3 h-3 mr-1" />
                                    Beklemede
                                  </Badge>
                                )}
                                {satis.status === "iptal" && (
                                  <Badge
                                    variant="destructive"
                                    className="text-xs"
                                  >
                                    İptal
                                  </Badge>
                                )}
                                {!satis.status && "-"}
                              </TableCell>
                            )}
                            {userRole === "standart" && (
                              <TableCell>****</TableCell>
                            )}

                            <TableCell>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(satis)}
                                  className="text-xs"
                                >
                                  <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                  Düzenle
                                </Button>
                                {(userRole === "admin" ||
                                  satis.bildirim_tipi === "rehber") && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(satis.satis_id)}
                                    className="text-xs"
                                  >
                                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                    Sil
                                  </Button>
                                )}
                                {userRole === "admin" && (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => showOranlar(satis)}
                                    className="text-xs"
                                  >
                                    <BarChart className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                    Oranlar
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Rehber Satışları - Bu kısımda kısıtlama yok */}
                        {group.rehber_satislari.map((satis, itemIndex) => (
                          <TableRow
                            key={`rehber-${satis.satis_id}-${itemIndex}`}
                          >
                            <TableCell className="font-medium">
                              {satis.urun_adi || "-"}
                            </TableCell>
                            {(userRole === "admin" ||
                              userRole === "standart") && (
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="bg-orange-50 text-orange-700 text-xs"
                                >
                                  <Phone className="w-3 h-3 mr-1" />
                                  Rehber
                                </Badge>
                              </TableCell>
                            )}
                            <TableCell>{satis.adet || 0}</TableCell>
                            {userRole === "admin" && (
                              <TableCell>₺{satis.birim_fiyat || 0}</TableCell>
                            )}
                            {userRole === "standart" && (
                              <TableCell>
                                {satis.bildirim_tipi === "magaza"
                                  ? "****"
                                  : `₺${satis.birim_fiyat || 0}`}
                              </TableCell>
                            )}
                            {userRole === "admin" && (
                              <TableCell>₺{satis.toplam_tutar || 0}</TableCell>
                            )}
                            {userRole === "standart" && (
                              <TableCell>
                                {satis.bildirim_tipi === "magaza"
                                  ? "****"
                                  : `₺${satis.toplam_tutar || 0}`}
                              </TableCell>
                            )}
                            <TableCell>
                              {satis.status === "onaylandı" && (
                                <Badge
                                  variant="default"
                                  className="bg-green-100 text-green-800 text-xs"
                                >
                                  Onaylandı
                                </Badge>
                              )}
                              {satis.status === "beklemede" && (
                                <Badge variant="secondary" className="text-xs">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Beklemede
                                </Badge>
                              )}
                              {satis.status === "iptal" && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  İptal
                                </Badge>
                              )}
                              {!satis.status && "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(satis)}
                                  className="text-xs"
                                >
                                  <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                  Düzenle
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(satis.satis_id)}
                                  className="text-xs"
                                >
                                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                  Sil
                                </Button>
                                {userRole === "admin" && (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => showOranlar(satis)}
                                    className="text-xs"
                                  >
                                    <BarChart className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                    Oranlar
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
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Oranlar Dialog */}
      <Dialog open={isOranlarDialogOpen} onOpenChange={setIsOranlarDialogOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Komisyon Oranları
            </DialogTitle>
            <DialogDescription className="text-sm">
              Seçili satış kaleminin komisyon oranlarını görüntüleyin.
            </DialogDescription>
          </DialogHeader>
          {selectedSatis && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm">Acente Komisyonu</Label>
                  <Input
                    type="text"
                    value={selectedSatis.acente_komisyonu || "0"}
                    disabled
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-sm">Rehber Komisyonu</Label>
                  <Input
                    type="text"
                    value={selectedSatis.rehber_komisyonu || "0"}
                    disabled
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-sm">Kaptan Komisyonu</Label>
                  <Input
                    type="text"
                    value={selectedSatis.kaptan_komisyonu || "0"}
                    disabled
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-sm">Ofis Komisyonu</Label>
                  <Input
                    type="text"
                    value={selectedSatis.ofis_komisyonu || "0"}
                    disabled
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-sm">Acente Komisyon Tutarı</Label>
                  <Input
                    type="text"
                    value={selectedSatis.acente_komisyon_tutari || "0"}
                    disabled
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-sm">Rehber Komisyon Tutarı</Label>
                  <Input
                    type="text"
                    value={selectedSatis.rehber_komisyon_tutari || "0"}
                    disabled
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-sm">Kaptan Komisyon Tutarı</Label>
                  <Input
                    type="text"
                    value={selectedSatis.kaptan_komisyon_tutari || "0"}
                    disabled
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-sm">Ofis Komisyon Tutarı</Label>
                  <Input
                    type="text"
                    value={selectedSatis.ofis_komisyon_tutari || "0"}
                    disabled
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Satış Ekleme/Düzenleme Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleMainDialogClose}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {editingSatis ? "Satış Düzenle" : "Yeni Satış Ekle"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Bu formu kullanarak mağaza satışlarını ekleyebilir veya
              düzenleyebilirsiniz.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="operator_id">Operatör</Label>
                  <div className="flex items-center space-x-2">
                    <Select
                      id="operator_id"
                      value={formData.operator_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, operator_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Operatör Seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {operatorler.map((operator) => (
                          <SelectItem key={operator.id} value={operator.id}>
                            {operator.operator_adi}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      onClick={() => setIsAddOperatorDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="firma_id">Firma</Label>
                  <div className="flex items-center space-x-2">
                    <Select
                      id="firma_id"
                      value={formData.firma_id}
                      onValueChange={(value) => {
                        setFormData({
                          ...formData,
                          firma_id: value,
                          magaza_id: "",
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Firma Seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {firmalar.map((firma) => (
                          <SelectItem key={firma.id} value={firma.id}>
                            {firma.firma_adi}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      onClick={() => setIsAddFirmaDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="magaza_id">Mağaza</Label>
                  <div className="flex items-center space-x-2">
                    <Select
                      id="magaza_id"
                      value={formData.magaza_id}
                      onValueChange={(value) => {
                        setFormData({ ...formData, magaza_id: value });
                      }}
                      disabled={!formData.firma_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Mağaza Seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {magazalar.map((magaza) => (
                          <SelectItem key={magaza.id} value={magaza.id}>
                            {magaza.magaza_adi}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      onClick={() => setIsAddMagazaDialogOpen(true)}
                      disabled={!formData.firma_id}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="grup_gelis_tarihi">Grup Geliş Tarihi</Label>
                  <Input
                    type="date"
                    id="grup_gelis_tarihi"
                    value={formData.grup_gelis_tarihi}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        grup_gelis_tarihi: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="satis_tarihi">Mağaza Giriş Tarihi</Label>
                  <Input
                    type="date"
                    id="satis_tarihi"
                    value={formData.satis_tarihi}
                    onChange={(e) =>
                      setFormData({ ...formData, satis_tarihi: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="grup_pax">Grup PAX</Label>
                  <Input
                    type="number"
                    id="grup_pax"
                    value={formData.grup_pax}
                    onChange={(e) =>
                      setFormData({ ...formData, grup_pax: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="magaza_pax">Mağaza PAX</Label>
                  <Input
                    type="number"
                    id="magaza_pax"
                    value={formData.magaza_pax}
                    onChange={(e) =>
                      setFormData({ ...formData, magaza_pax: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="tur_id">Tur</Label>
                  <div className="flex items-center space-x-2">
                    <Select
                      id="tur_id"
                      value={formData.tur_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, tur_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tur Seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {turlar.map((tur) => (
                          <SelectItem key={tur.id} value={tur.id}>
                            {tur.tur_adi}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      onClick={() => setIsAddTurDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="rehber_id">Rehber</Label>
                  <div className="flex items-center space-x-2">
                    <Select
                      id="rehber_id"
                      value={formData.rehber_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, rehber_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Rehber Seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {rehberler.map((rehber) => (
                          <SelectItem key={rehber.id} value={rehber.id}>
                            {rehber.rehber_adi}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      onClick={() => setIsAddRehberDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Satış Ürünleri */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <Label className="text-sm sm:text-base">Satış Ürünleri</Label>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={addUrunRow}
                    className="w-full sm:w-auto text-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ürün Ekle
                  </Button>
                </div>
                {satisUrunleri.map((urun, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-center p-4 border rounded-lg"
                  >
                    {/* Ürün seçimi */}
                    <div className="sm:col-span-2 lg:col-span-1">
                      <Label htmlFor={`urun_id_${index}`} className="text-sm">
                        Ürün
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Select
                          id={`urun_id_${index}`}
                          value={urun.urun_id}
                          onValueChange={(value) => {
                            updateUrunRow(index, "urun_id", value);
                            handleUrunSelection(index, value);
                          }}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Ürün Seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {urunler.map((urun) => (
                              <SelectItem
                                key={urun.id}
                                value={urun.id}
                                className="text-sm"
                              >
                                {urun.urun_adi}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          onClick={() => setIsAddUrunDialogOpen(true)}
                          className="shrink-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Adet */}
                    <div>
                      <Label htmlFor={`adet_${index}`} className="text-sm">
                        Adet
                      </Label>
                      <Input
                        type="number"
                        id={`adet_${index}`}
                        value={urun.adet}
                        onChange={(e) =>
                          updateUrunRow(index, "adet", e.target.value)
                        }
                        className="text-sm"
                      />
                    </div>

                    {/* Birim Fiyat */}
                    {(userRole === "admin" ||
                      (userRole === "standart" &&
                        urun.bildirim_tipi === "rehber")) && (
                      <div>
                        <Label
                          htmlFor={`birim_fiyat_${index}`}
                          className="text-sm"
                        >
                          Birim Fiyat
                        </Label>
                        <Input
                          type="number"
                          id={`birim_fiyat_${index}`}
                          value={urun.birim_fiyat}
                          onChange={(e) =>
                            updateUrunRow(index, "birim_fiyat", e.target.value)
                          }
                          className="text-sm"
                        />
                      </div>
                    )}

                    {/* Bildirim Tipi */}
                    <div>
                      <Label
                        htmlFor={`bildirim_tipi_${index}`}
                        className="text-sm"
                      >
                        Bildirim Tipi
                      </Label>
                      <Select
                        value={urun.bildirim_tipi}
                        onValueChange={(value) =>
                          updateUrunRow(index, "bildirim_tipi", value)
                        }
                        disabled={userRole === "standart"}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="magaza" className="text-sm">
                            Mağaza
                          </SelectItem>
                          <SelectItem value="rehber" className="text-sm">
                            Rehber
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Durum */}
                    <div>
                      <Label htmlFor={`status_${index}`} className="text-sm">
                        Durum
                      </Label>
                      <Select
                        value={urun.status}
                        onValueChange={(value) =>
                          updateUrunRow(index, "status", value)
                        }
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="onaylandı" className="text-sm">
                            Onaylandı
                          </SelectItem>
                          <SelectItem value="beklemede" className="text-sm">
                            Beklemede
                          </SelectItem>
                          <SelectItem value="iptal" className="text-sm">
                            İptal
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* İşlem Butonları */}
                    <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
                      {userRole === "admin" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateUrunRow(
                              index,
                              "showCommissions",
                              !urun.showCommissions
                            )
                          }
                          className="w-full sm:w-auto text-xs"
                        >
                          {urun.showCommissions ? (
                            <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
                          ) : (
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                          )}
                        </Button>
                      )}
                      {satisUrunleri.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeUrunRow(index)}
                          className="w-full sm:w-auto text-xs"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Komisyon Oranları - Responsive grid */}
                    {userRole === "admin" &&
                      urun.showCommissions &&
                      urun.bildirim_tipi === "magaza" && (
                        <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2 p-3 bg-gray-50 rounded">
                          <div>
                            <Label
                              htmlFor={`acente_komisyonu_${index}`}
                              className="text-sm"
                            >
                              Acente Komisyonu (%)
                            </Label>
                            <Input
                              type="number"
                              id={`acente_komisyonu_${index}`}
                              value={urun.acente_komisyonu}
                              onChange={(e) =>
                                updateUrunRow(
                                  index,
                                  "acente_komisyonu",
                                  e.target.value
                                )
                              }
                              placeholder="0"
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor={`rehber_komisyonu_${index}`}
                              className="text-sm"
                            >
                              Rehber Komisyonu (%)
                            </Label>
                            <Input
                              type="number"
                              id={`rehber_komisyonu_${index}`}
                              value={urun.rehber_komisyonu}
                              onChange={(e) =>
                                updateUrunRow(
                                  index,
                                  "rehber_komisyonu",
                                  e.target.value
                                )
                              }
                              placeholder="0"
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor={`kaptan_komisyonu_${index}`}
                              className="text-sm"
                            >
                              Kaptan Komisyonu (%)
                            </Label>
                            <Input
                              type="number"
                              id={`kaptan_komisyonu_${index}`}
                              value={urun.kaptan_komisyonu}
                              onChange={(e) =>
                                updateUrunRow(
                                  index,
                                  "kaptan_komisyonu",
                                  e.target.value
                                )
                              }
                              placeholder="0"
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor={`ofis_komisyonu_${index}`}
                              className="text-sm"
                            >
                              Ofis Komisyonu (%)
                            </Label>
                            <Input
                              type="number"
                              id={`ofis_komisyonu_${index}`}
                              value={urun.ofis_komisyonu}
                              onChange={(e) =>
                                updateUrunRow(
                                  index,
                                  "ofis_komisyonu",
                                  e.target.value
                                )
                              }
                              placeholder="0"
                              className="text-sm"
                            />
                          </div>
                        </div>
                      )}

                    {/* Açıklama alanı */}
                    <div className="col-span-full">
                      <Label
                        htmlFor={`satis_aciklamasi_${index}`}
                        className="text-sm"
                      >
                        Satış Açıklaması
                      </Label>
                      <Textarea
                        id={`satis_aciklamasi_${index}`}
                        value={urun.satis_aciklamasi}
                        onChange={(e) =>
                          updateUrunRow(
                            index,
                            "satis_aciklamasi",
                            e.target.value
                          )
                        }
                        placeholder="Satış ile ilgili açıklama..."
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="w-full sm:w-auto"
              >
                İptal
              </Button>
              <Button type="submit" className="w-full sm:w-auto">
                {editingSatis ? "Güncelle" : "Kaydet"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Onay Diyalogu - Değişiklikleri atmak için */}
      <Dialog
        open={isConfirmCloseDialogOpen}
        onOpenChange={setIsConfirmCloseDialogOpen}
      >
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">
              Kaydedilmemiş Değişiklikler
            </DialogTitle>
            <DialogDescription className="text-sm">
              Formda kaydedilmemiş değişiklikler var. Bu değişiklikleri atmak
              istediğinizden emin misiniz?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
            <Button
              variant="outline"
              onClick={cancelDiscardChanges}
              className="w-full sm:w-auto bg-transparent"
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDiscardChanges}
              className="w-full sm:w-auto"
            >
              Değişiklikleri At
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Dialog Components */}
      <AddUrunDialog
        open={isAddUrunDialogOpen}
        onOpenChange={setIsAddUrunDialogOpen}
        onUrunAdded={handleUrunAdded}
      />
      <AddMagazaDialog
        open={isAddMagazaDialogOpen}
        onOpenChange={setIsAddMagazaDialogOpen}
        onMagazaAdded={handleMagazaAdded}
        selectedFirmaId={formData.firma_id}
      />
      <AddOperatorDialog
        open={isAddOperatorDialogOpen}
        onOpenChange={setIsAddOperatorDialogOpen}
        onOperatorAdded={handleOperatorAdded}
      />
      <AddTurDialog
        open={isAddTurDialogOpen}
        onOpenChange={setIsAddTurDialogOpen}
        onTurAdded={handleTurAdded}
      />
      <AddFirmaDialog
        open={isAddFirmaDialogOpen}
        onOpenChange={setIsAddFirmaDialogOpen}
        onFirmaAdded={handleFirmaAdded}
      />
      <AddRehberDialog
        open={isAddRehberDialogOpen}
        onOpenChange={setIsAddRehberDialogOpen}
        onRehberAdded={handleRehberAdded}
      />
    </div>
  );
}
