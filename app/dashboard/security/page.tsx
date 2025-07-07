"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { monitoredSupabase } from "@/lib/supabase-monitored";
import { useAuth } from "@/contexts/auth-context";
import {
  Shield,
  Activity,
  AlertTriangle,
  Users,
  Clock,
  TrendingUp,
  RefreshCw,
  Search,
  User,
  Trash2,
  Database,
} from "lucide-react";
import { format, subDays, subWeeks, subMonths } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";

interface LogEntryWithUserInfo {
  id: string;
  timestamp: string;
  user_id?: string;
  user_name?: string;
  user_role?: string;
  operation: string;
  table_name?: string;
  method: string;
  success: boolean;
  duration_ms: number;
  error_message?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

interface LogStatistics {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  avg_response_time: number;
  unique_users: number;
  most_active_table: string;
  most_active_user: string;
  error_rate: number;
  oldest_log?: string;
  newest_log?: string;
  total_size_mb?: number;
}

export default function SecurityPage() {
  const { userRole } = useAuth();
  const [logs, setLogs] = useState<LogEntryWithUserInfo[]>([]);
  const [errorLogs, setErrorLogs] = useState<LogEntryWithUserInfo[]>([]);
  const [statistics, setStatistics] = useState<LogStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMethod, setFilterMethod] = useState("all");
  const [filterSuccess, setFilterSuccess] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedCutoffDate, setSelectedCutoffDate] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recentLogs, errors, stats] = await Promise.all([
        monitoredSupabase.getRecentLogs(100),
        monitoredSupabase.getErrorLogs(50),
        monitoredSupabase.getLogStatistics(),
      ]);

      setLogs(recentLogs || []);
      setErrorLogs(errors || []);
      setStatistics(stats);
    } catch (error) {
      console.error("Veri yükleme hatası:", error);
      toast.error("Veri yükleme hatası");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLogs = async (deleteAll = false) => {
    if (!deleteAll && !selectedCutoffDate) {
      toast.error("Lütfen bir tarih seçin");
      return;
    }

    setDeleteLoading(true);
    try {
      const response = await fetch("/api/delete-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cutoffDate: deleteAll ? null : selectedCutoffDate,
          deleteAll,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Log silme işlemi başarısız");
      }

      toast.success(result.message);
      setDeleteDialogOpen(false);
      setSelectedCutoffDate("");

      // Verileri yenile
      await fetchData();
    } catch (error) {
      console.error("Log silme hatası:", error);
      toast.error(
        error instanceof Error ? error.message : "Log silme işlemi başarısız"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const getQuickDateOptions = () => {
    const now = new Date();
    return [
      { label: "1 gün öncesi", value: subDays(now, 1).toISOString() },
      { label: "1 hafta öncesi", value: subWeeks(now, 1).toISOString() },
      { label: "1 ay öncesi", value: subMonths(now, 1).toISOString() },
      { label: "3 ay öncesi", value: subMonths(now, 3).toISOString() },
      { label: "6 ay öncesi", value: subMonths(now, 6).toISOString() },
    ];
  };

  useEffect(() => {
    if (userRole === "admin") {
      fetchData();

      // Her 30 saniyede bir otomatik yenile
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [userRole]);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchTerm === "" ||
      log.operation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.table_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMethod = filterMethod === "all" || log.method === filterMethod;
    const matchesSuccess =
      filterSuccess === "all" ||
      (filterSuccess === "success" && log.success) ||
      (filterSuccess === "error" && !log.success);

    return matchesSearch && matchesMethod && matchesSuccess;
  });

  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case "READ":
        return "bg-blue-100 text-blue-800";
      case "CREATE":
        return "bg-green-100 text-green-800";
      case "UPDATE":
        return "bg-yellow-100 text-yellow-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      case "AUTH":
        return "bg-purple-100 text-purple-800";
      case "RPC":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "magaza":
        return "bg-blue-100 text-blue-800";
      case "rehber":
        return "bg-green-100 text-green-800";
      case "standart":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getUserInitials = (name?: string) => {
    if (name && name !== "Sistem") {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return "SY"; // Sistem
  };

  const UserCell = ({ log }: { log: LogEntryWithUserInfo }) => {
    // Eğer user_id yoksa veya user_name "Sistem" ise sistem işlemi
    if (!log.user_id || !log.user_name || log.user_name === "Sistem") {
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs bg-gray-200">SY</AvatarFallback>
          </Avatar>
          <span className="text-gray-500 text-sm">Sistem</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Avatar className="h-6 w-6">
          <AvatarFallback className="text-xs">
            {getUserInitials(log.user_name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-medium">{log.user_name}</span>
          {log.user_role && (
            <Badge
              className={`text-xs ${getRoleBadgeColor(log.user_role)} h-4`}
            >
              {log.user_role}
            </Badge>
          )}
        </div>
      </div>
    );
  };

  if (userRole !== "admin") {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Bu sayfaya erişim yetkiniz bulunmamaktadır.
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
          <p>Güvenlik logları yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Güvenlik & İzleme
          </h1>
          <p className="text-gray-600 mt-2">
            Sistem aktivitelerini ve güvenlik olaylarını izleyin
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Log Sil
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-red-500" />
                  Log Kayıtlarını Sil
                </DialogTitle>
                <DialogDescription>
                  Seçilen tarihten önceki tüm log kayıtları kalıcı olarak
                  silinecektir. Bu işlem geri alınamaz.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="cutoff-date">Silme Tarihi</Label>
                  <Input
                    id="cutoff-date"
                    type="datetime-local"
                    value={selectedCutoffDate}
                    onChange={(e) => setSelectedCutoffDate(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Bu tarihten önceki tüm loglar silinecek
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    Hızlı Seçenekler
                  </Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {getQuickDateOptions().map((option) => (
                      <Button
                        key={option.label}
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setSelectedCutoffDate(option.value.slice(0, 16))
                        }
                        className="text-xs"
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {statistics && (
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="h-4 w-4" />
                      <span className="font-medium">
                        Mevcut Log İstatistikleri
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div>Toplam kayıt: {statistics.total_requests}</div>
                      {statistics.oldest_log && (
                        <div>
                          En eski:{" "}
                          {format(
                            new Date(statistics.oldest_log),
                            "dd/MM/yyyy HH:mm",
                            { locale: tr }
                          )}
                        </div>
                      )}
                      {statistics.total_size_mb && (
                        <div>Boyut: {statistics.total_size_mb} MB</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="flex-col sm:flex-col gap-2">
                <Button
                  onClick={() => handleDeleteLogs(false)}
                  disabled={deleteLoading || !selectedCutoffDate}
                  variant="destructive"
                  className="w-full"
                >
                  {deleteLoading
                    ? "Siliniyor..."
                    : "Seçilen Tarihten Önceki Logları Sil"}
                </Button>
                <Button
                  onClick={() => handleDeleteLogs(true)}
                  disabled={deleteLoading}
                  variant="destructive"
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {deleteLoading ? "Siliniyor..." : "TÜM LOGLARI SİL"}
                </Button>
                <Button
                  onClick={() => setDeleteDialogOpen(false)}
                  variant="outline"
                  className="w-full"
                  disabled={deleteLoading}
                >
                  İptal
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button onClick={fetchData} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Yenile
          </Button>
        </div>
      </div>

      {/* İstatistikler */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Toplam İstek
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.total_requests}
              </div>
              <p className="text-xs text-muted-foreground">Son 24 saat</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Başarı Oranı
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statistics.total_requests > 0
                  ? (
                      (statistics.successful_requests /
                        statistics.total_requests) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">
                {statistics.successful_requests} başarılı
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ortalama Süre
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDuration(statistics.avg_response_time)}
              </div>
              <p className="text-xs text-muted-foreground">Yanıt süresi</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Aktif Kullanıcı
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.unique_users}
              </div>
              <p className="text-xs text-muted-foreground">Son 24 saat</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                En Aktif Kullanıcı
              </CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className="text-sm font-bold truncate"
                title={statistics.most_active_user}
              >
                {statistics.most_active_user || "Bilinmiyor"}
              </div>
              <p className="text-xs text-muted-foreground">
                En çok işlem yapan
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Tüm Loglar</TabsTrigger>
          <TabsTrigger value="errors">Hatalar</TabsTrigger>
          <TabsTrigger value="analytics">Analitik</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          {/* Filtreler */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtreler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="İşlem, tablo veya kullanıcı adı ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterMethod} onValueChange={setFilterMethod}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Metod seç" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Metodlar</SelectItem>
                    <SelectItem value="READ">READ</SelectItem>
                    <SelectItem value="CREATE">CREATE</SelectItem>
                    <SelectItem value="UPDATE">UPDATE</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                    <SelectItem value="AUTH">AUTH</SelectItem>
                    <SelectItem value="RPC">RPC</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterSuccess} onValueChange={setFilterSuccess}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Durum seç" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Durumlar</SelectItem>
                    <SelectItem value="success">Başarılı</SelectItem>
                    <SelectItem value="error">Hatalı</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Log Tablosu */}
          <Card>
            <CardHeader>
              <CardTitle>Sistem Logları</CardTitle>
              <CardDescription>
                Son {filteredLogs.length} kayıt gösteriliyor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Zaman</TableHead>
                      <TableHead>Kullanıcı</TableHead>
                      <TableHead>İşlem</TableHead>
                      <TableHead>Tablo</TableHead>
                      <TableHead>Metod</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Süre</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {format(
                            new Date(log.timestamp),
                            "dd/MM/yyyy HH:mm:ss",
                            { locale: tr }
                          )}
                        </TableCell>
                        <TableCell>
                          <UserCell log={log} />
                        </TableCell>
                        <TableCell className="font-medium">
                          {log.operation}
                        </TableCell>
                        <TableCell>{log.table_name || "-"}</TableCell>
                        <TableCell>
                          <Badge className={getMethodBadgeColor(log.method)}>
                            {log.method}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.success ? (
                            <Badge className="bg-green-100 text-green-800">
                              Başarılı
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">
                              Hata
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {formatDuration(log.duration_ms)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Hata Logları
              </CardTitle>
              <CardDescription>
                Son {errorLogs.length} hata kaydı
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Zaman</TableHead>
                      <TableHead>Kullanıcı</TableHead>
                      <TableHead>İşlem</TableHead>
                      <TableHead>Tablo</TableHead>
                      <TableHead>Hata Mesajı</TableHead>
                      <TableHead>Süre</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {errorLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {format(
                            new Date(log.timestamp),
                            "dd/MM/yyyy HH:mm:ss",
                            { locale: tr }
                          )}
                        </TableCell>
                        <TableCell>
                          <UserCell log={log} />
                        </TableCell>
                        <TableCell className="font-medium">
                          {log.operation}
                        </TableCell>
                        <TableCell>{log.table_name || "-"}</TableCell>
                        <TableCell className="max-w-md">
                          <div
                            className="truncate text-red-600"
                            title={log.error_message}
                          >
                            {log.error_message}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {formatDuration(log.duration_ms)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>En Çok Kullanılan Tablolar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {statistics?.most_active_table && (
                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                      <span className="font-medium">
                        {statistics.most_active_table}
                      </span>
                      <Badge>En Aktif</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hata Oranı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {statistics ? (statistics.error_rate * 100).toFixed(2) : 0}%
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Toplam isteklerin hata oranı
                  </p>
                </div>
              </CardContent>
            </Card>

            {statistics && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Veritabanı Bilgileri
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {statistics.oldest_log && (
                      <div>
                        <Label className="text-sm text-gray-600">
                          En Eski Log
                        </Label>
                        <p className="font-mono text-sm">
                          {format(
                            new Date(statistics.oldest_log),
                            "dd/MM/yyyy HH:mm",
                            { locale: tr }
                          )}
                        </p>
                      </div>
                    )}
                    {statistics.newest_log && (
                      <div>
                        <Label className="text-sm text-gray-600">
                          En Yeni Log
                        </Label>
                        <p className="font-mono text-sm">
                          {format(
                            new Date(statistics.newest_log),
                            "dd/MM/yyyy HH:mm",
                            { locale: tr }
                          )}
                        </p>
                      </div>
                    )}
                    {statistics.total_size_mb && (
                      <div>
                        <Label className="text-sm text-gray-600">
                          Toplam Boyut
                        </Label>
                        <p className="font-mono text-sm">
                          {statistics.total_size_mb} MB
                        </p>
                      </div>
                    )}
                    <div>
                      <Label className="text-sm text-gray-600">
                        Toplam Kayıt
                      </Label>
                      <p className="font-mono text-sm">
                        {statistics.total_requests}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
