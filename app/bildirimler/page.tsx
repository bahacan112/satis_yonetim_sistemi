"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export default function BildirimlerPage() {
  const { userRole, user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();

    // Realtime subscription for new notifications
    if (user) {
      const subscription = supabase
        .channel("notifications_page")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({
        title: "Hata!",
        description: "Bildirimler yüklenirken hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
      if (selectedNotification && selectedNotification.id === id) {
        setSelectedNotification((prev) =>
          prev ? { ...prev, read: true } : null
        );
      }

      toast({
        title: "Başarılı!",
        description: "Bildirim okundu olarak işaretlendi.",
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast({
        title: "Hata!",
        description: "Bildirim güncellenirken hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const markAsUnread = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: false })
        .eq("id", id);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, read: false } : notif
        )
      );
      if (selectedNotification && selectedNotification.id === id) {
        setSelectedNotification((prev) =>
          prev ? { ...prev, read: false } : null
        );
      }

      toast({
        title: "Başarılı!",
        description: "Bildirim okunmadı olarak işaretlendi.",
      });
    } catch (error) {
      console.error("Error marking notification as unread:", error);
      toast({
        title: "Hata!",
        description: "Bildirim güncellenirken hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const deleteNotification = async (id: string) => {
    if (!confirm("Bu bildirimi silmek istediğinizden emin misiniz?")) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setNotifications((prev) => prev.filter((notif) => notif.id !== id));
      setIsDialogOpen(false); // Close dialog if the deleted notification was open

      toast({
        title: "Başarılı!",
        description: "Bildirim silindi.",
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast({
        title: "Hata!",
        description: "Bildirim silinirken hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user?.id)
        .eq("read", false);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );
      if (selectedNotification) {
        setSelectedNotification((prev) =>
          prev ? { ...prev, read: true } : null
        );
      }

      toast({
        title: "Başarılı!",
        description: "Tüm bildirimler okundu olarak işaretlendi.",
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast({
        title: "Hata!",
        description: "Bildirimler güncellenirken hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "sales_update":
        return "Satış Güncelleme";
      case "general":
        return "Genel";
      default:
        return type;
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "sales_update":
        return "default";
      case "general":
        return "secondary";
      default:
        return "outline";
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "unread") return !notif.read;
    if (filter === "read") return notif.read;
    return true;
  });

  const unreadCount = notifications.filter((notif) => !notif.read).length;

  const handleRowClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsDialogOpen(true);
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-8 h-8" />
            Bildirimler
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} okunmamış
              </Badge>
            )}
          </h1>
          <p className="text-gray-600">Sistem bildirimleri ve güncellemeler</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setFilter("all")}
            className={filter === "all" ? "bg-blue-50" : ""}
          >
            Tümü ({notifications.length})
          </Button>
          <Button
            variant="outline"
            onClick={() => setFilter("unread")}
            className={filter === "unread" ? "bg-blue-50" : ""}
          >
            Okunmamış ({unreadCount})
          </Button>
          <Button
            variant="outline"
            onClick={() => setFilter("read")}
            className={filter === "read" ? "bg-blue-50" : ""}
          >
            Okunmuş ({notifications.length - unreadCount})
          </Button>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead}>
              <Check className="w-4 h-4 mr-2" />
              Tümünü Okundu İşaretle
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Bildirim Listesi ({filteredNotifications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredNotifications.length === 0 ? (
            <Alert>
              <AlertDescription>
                {filter === "unread"
                  ? "Okunmamış bildirim bulunmuyor."
                  : filter === "read"
                  ? "Okunmuş bildirim bulunmuyor."
                  : "Henüz bildirim bulunmuyor."}
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Durum</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Başlık</TableHead>
                  <TableHead>Mesaj</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotifications.map((notification) => (
                  <TableRow
                    key={notification.id}
                    className={
                      !notification.read
                        ? "bg-blue-50 cursor-pointer"
                        : "cursor-pointer"
                    }
                    onClick={() => handleRowClick(notification)}
                  >
                    <TableCell>
                      {notification.read ? (
                        <Badge variant="secondary">Okundu</Badge>
                      ) : (
                        <Badge variant="default">Yeni</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTypeBadgeVariant(notification.type)}>
                        {getTypeLabel(notification.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {notification.title}
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {notification.message}
                    </TableCell>
                    <TableCell>
                      {new Date(notification.created_at).toLocaleString(
                        "tr-TR"
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {" "}
                      {/* Stop propagation to prevent dialog from opening when clicking buttons */}
                      <div className="flex gap-2">
                        {notification.read ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAsUnread(notification.id)}
                          >
                            <EyeOff className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedNotification && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{selectedNotification.title}</DialogTitle>
              <DialogDescription>Bildirim Detayları</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium text-gray-500">
                  Durum:
                </span>
                <div className="col-span-3">
                  {selectedNotification.read ? (
                    <Badge variant="secondary">Okundu</Badge>
                  ) : (
                    <Badge variant="default">Yeni</Badge>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium text-gray-500">Tip:</span>
                <div className="col-span-3">
                  <Badge
                    variant={getTypeBadgeVariant(selectedNotification.type)}
                  >
                    {getTypeLabel(selectedNotification.type)}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <span className="text-sm font-medium text-gray-500">
                  Mesaj:
                </span>
                <p className="col-span-3 text-sm text-gray-700 whitespace-pre-wrap">
                  {selectedNotification.message}
                </p>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium text-gray-500">
                  Tarih:
                </span>
                <p className="col-span-3 text-sm text-gray-700">
                  {new Date(selectedNotification.created_at).toLocaleString(
                    "tr-TR"
                  )}
                </p>
              </div>
            </div>
            <DialogFooter className="flex justify-between sm:justify-between">
              <div className="flex gap-2">
                {selectedNotification.read ? (
                  <Button
                    variant="outline"
                    onClick={() => markAsUnread(selectedNotification.id)}
                  >
                    <EyeOff className="w-4 h-4 mr-2" />
                    Okunmadı İşaretle
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => markAsRead(selectedNotification.id)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Okundu İşaretle
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => deleteNotification(selectedNotification.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Sil
                </Button>
              </div>
              <Button
                variant="secondary"
                onClick={() => setIsDialogOpen(false)}
              >
                Kapat
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
