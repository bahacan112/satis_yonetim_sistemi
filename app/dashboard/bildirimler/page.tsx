"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/contexts/i18n-context";
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
import { Switch } from "@/components/ui/switch";
import { Bell, Check, Trash2, Eye, EyeOff, Mail } from "lucide-react";
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
  const { t } = useI18n();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    loadEmailSettings();

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
        title: t("common.error"),
        description: t("common.error"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEmailSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("email_notifications")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      setEmailNotifications(data?.email_notifications || false);
    } catch (error) {
      console.error("Error loading email settings:", error);
    }
  };

  const toggleEmailNotifications = async (enabled: boolean) => {
    if (!user) return;

    setEmailLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ email_notifications: enabled })
        .eq("id", user.id);

      if (error) throw error;

      setEmailNotifications(enabled);
      toast({
        title: t("common.success"),
        description: enabled
          ? t("notifications.emailNotificationsEnabled")
          : t("notifications.emailNotificationsDisabled"),
      });
    } catch (error) {
      console.error("Error updating email settings:", error);
      toast({
        title: t("common.error"),
        description: t("common.error"),
        variant: "destructive",
      });
    } finally {
      setEmailLoading(false);
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
        title: t("common.success"),
        description: t("notifications.markReadSuccess"),
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast({
        title: t("common.error"),
        description: t("common.error"),
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
        title: t("common.success"),
        description: t("notifications.markUnreadSuccess"),
      });
    } catch (error) {
      console.error("Error marking notification as unread:", error);
      toast({
        title: t("common.error"),
        description: t("common.error"),
        variant: "destructive",
      });
    }
  };

  const deleteNotification = async (id: string) => {
    if (!confirm(t("notifications.deleteConfirm"))) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setNotifications((prev) => prev.filter((notif) => notif.id !== id));
      if (selectedNotification && selectedNotification.id === id) {
        setIsDialogOpen(false);
        setSelectedNotification(null);
      }

      toast({
        title: t("common.success"),
        description: t("notifications.deleteSuccess"),
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast({
        title: t("common.error"),
        description: t("common.error"),
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
        title: t("common.success"),
        description: t("notifications.markAllReadSuccess"),
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast({
        title: t("common.error"),
        description: t("common.error"),
        variant: "destructive",
      });
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "sales_update":
        return t("notifications.salesUpdate");
      case "general":
        return t("notifications.general");
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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 sm:w-8 sm:h-8" />
            {t("notifications.title")}
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {t("notifications.unreadCount").replace(
                  "{count}",
                  unreadCount.toString()
                )}
              </Badge>
            )}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            {t("notifications.subtitle")}
          </p>
        </div>

        {/* Email Notifications Toggle */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <Mail className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium">
            {t("notifications.emailNotifications")}
          </span>
          <Switch
            checked={emailNotifications}
            onCheckedChange={toggleEmailNotifications}
            disabled={emailLoading}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setFilter("all")}
            className={`text-xs sm:text-sm ${
              filter === "all" ? "bg-blue-50 border-blue-200" : ""
            }`}
          >
            {t("notifications.all")} ({notifications.length})
          </Button>
          <Button
            variant="outline"
            onClick={() => setFilter("unread")}
            className={`text-xs sm:text-sm ${
              filter === "unread" ? "bg-blue-50 border-blue-200" : ""
            }`}
          >
            {t("notifications.unread")} ({unreadCount})
          </Button>
          <Button
            variant="outline"
            onClick={() => setFilter("read")}
            className={`text-xs sm:text-sm ${
              filter === "read" ? "bg-blue-50 border-blue-200" : ""
            }`}
          >
            {t("notifications.read")} ({notifications.length - unreadCount})
          </Button>
        </div>

        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} className="text-xs sm:text-sm">
            <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            {t("notifications.markAllRead")}
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">
            {t("notifications.list")} ({filteredNotifications.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {filteredNotifications.length === 0 ? (
            <div className="p-6">
              <Alert>
                <AlertDescription>
                  {filter === "unread"
                    ? t("notifications.noUnread")
                    : filter === "read"
                    ? t("notifications.noRead")
                    : t("notifications.noNotifications")}
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">
                      {t("notifications.status")}
                    </TableHead>
                    <TableHead className="w-24">
                      {t("notifications.type")}
                    </TableHead>
                    <TableHead className="min-w-[150px]">
                      {t("notifications.title")}
                    </TableHead>
                    <TableHead className="min-w-[200px] hidden sm:table-cell">
                      {t("notifications.message")}
                    </TableHead>
                    <TableHead className="w-32 hidden md:table-cell">
                      {t("notifications.date")}
                    </TableHead>
                    <TableHead className="w-24">
                      {t("notifications.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotifications.map((notification) => (
                    <TableRow
                      key={notification.id}
                      className={`cursor-pointer transition-colors ${
                        !notification.read
                          ? "bg-blue-50 hover:bg-blue-100"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => handleRowClick(notification)}
                    >
                      <TableCell>
                        {notification.read ? (
                          <Badge variant="secondary" className="text-xs">
                            {t("notifications.readStatus")}
                          </Badge>
                        ) : (
                          <Badge variant="default" className="text-xs">
                            {t("notifications.new")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getTypeBadgeVariant(notification.type)}
                          className="text-xs"
                        >
                          {getTypeLabel(notification.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {notification.title}
                      </TableCell>
                      <TableCell className="max-w-md truncate text-sm hidden sm:table-cell">
                        {notification.message}
                      </TableCell>
                      <TableCell className="text-xs hidden md:table-cell">
                        {new Date(notification.created_at).toLocaleString(
                          "tr-TR"
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          {notification.read ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markAsUnread(notification.id)}
                              className="h-8 w-8 p-0"
                            >
                              <EyeOff className="w-3 h-3" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
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

      {/* Notification Detail Dialog */}
      {selectedNotification && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {selectedNotification.title}
              </DialogTitle>
              <DialogDescription>
                {t("notifications.details")}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
                <span className="text-sm font-medium text-gray-500">
                  {t("notifications.status")}:
                </span>
                <div className="sm:col-span-3">
                  {selectedNotification.read ? (
                    <Badge variant="secondary">
                      {t("notifications.readStatus")}
                    </Badge>
                  ) : (
                    <Badge variant="default">{t("notifications.new")}</Badge>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
                <span className="text-sm font-medium text-gray-500">
                  {t("notifications.type")}:
                </span>
                <div className="sm:col-span-3">
                  <Badge
                    variant={getTypeBadgeVariant(selectedNotification.type)}
                  >
                    {getTypeLabel(selectedNotification.type)}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
                <span className="text-sm font-medium text-gray-500">
                  {t("notifications.message")}:
                </span>
                <div className="sm:col-span-3 text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
                  {selectedNotification.message}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
                <span className="text-sm font-medium text-gray-500">
                  {t("notifications.date")}:
                </span>
                <p className="sm:col-span-3 text-sm text-gray-700">
                  {new Date(selectedNotification.created_at).toLocaleString(
                    "tr-TR"
                  )}
                </p>
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row justify-between gap-2">
              <div className="flex flex-col sm:flex-row gap-2">
                {selectedNotification.read ? (
                  <Button
                    variant="outline"
                    onClick={() => markAsUnread(selectedNotification.id)}
                    className="text-xs sm:text-sm"
                  >
                    <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    {t("notifications.markUnread")}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => markAsRead(selectedNotification.id)}
                    className="text-xs sm:text-sm"
                  >
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    {t("notifications.markRead")}
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => deleteNotification(selectedNotification.id)}
                  className="text-xs sm:text-sm"
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  {t("notifications.delete")}
                </Button>
              </div>
              <Button
                variant="secondary"
                onClick={() => setIsDialogOpen(false)}
                className="text-xs sm:text-sm"
              >
                {t("notifications.close")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
