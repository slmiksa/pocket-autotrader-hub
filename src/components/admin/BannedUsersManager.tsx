import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ban, UserX, Loader2, RefreshCw, Trash2, Mail, Shield, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface BannedUser {
  id: string;
  user_id: string;
  user_email: string | null;
  reason: string;
  banned_by: string | null;
  banned_at: string;
}

interface UserProfile {
  user_id: string;
  email: string | null;
}

export function BannedUsersManager() {
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [banReason, setBanReason] = useState("");
  const [banning, setBanning] = useState(false);
  const [unbanning, setUnbanning] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchBannedUsers();
    fetchAllUsers();
  }, []);

  const fetchBannedUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("banned_users")
        .select("*")
        .order("banned_at", { ascending: false });

      if (error) throw error;
      setBannedUsers(data || []);
    } catch (error) {
      console.error("Error fetching banned users:", error);
      toast.error("فشل تحميل قائمة المحظورين");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, email")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAllUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleBanUser = async () => {
    if (!selectedUserId || !banReason.trim()) {
      toast.error("يرجى اختيار المستخدم وإدخال سبب الحظر");
      return;
    }

    setBanning(true);
    try {
      const selectedUser = allUsers.find(u => u.user_id === selectedUserId);
      const { data: { user } } = await supabase.auth.getUser();

      const existingBan = bannedUsers.find(b => b.user_id === selectedUserId);
      if (existingBan) {
        toast.error("هذا المستخدم محظور بالفعل");
        setBanning(false);
        return;
      }

      const { error: banError } = await supabase
        .from("banned_users")
        .insert({
          user_id: selectedUserId,
          user_email: selectedUser?.email || null,
          reason: banReason.trim(),
          banned_by: user?.id || null
        });

      if (banError) throw banError;

      if (selectedUser?.email) {
        try {
          const { error: emailError } = await supabase.functions.invoke("send-ban-notification", {
            body: {
              email: selectedUser.email,
              reason: banReason.trim()
            }
          });

          if (emailError) {
            console.error("Error sending ban notification:", emailError);
            toast.warning("تم الحظر لكن فشل إرسال الإشعار البريدي");
          } else {
            toast.success("تم حظر المستخدم وإرسال إشعار بريدي");
          }
        } catch (emailErr) {
          console.error("Email error:", emailErr);
          toast.warning("تم الحظر لكن فشل إرسال الإشعار البريدي");
        }
      } else {
        toast.success("تم حظر المستخدم");
      }

      setShowBanDialog(false);
      setSelectedUserId("");
      setBanReason("");
      fetchBannedUsers();
    } catch (error) {
      console.error("Error banning user:", error);
      toast.error("فشل حظر المستخدم");
    } finally {
      setBanning(false);
    }
  };

  const handleUnbanUser = async (banId: string, userEmail: string | null) => {
    if (!confirm("هل أنت متأكد من إلغاء حظر هذا المستخدم؟")) return;

    setUnbanning(banId);
    try {
      const { error } = await supabase
        .from("banned_users")
        .delete()
        .eq("id", banId);

      if (error) throw error;

      toast.success("تم إلغاء حظر المستخدم بنجاح");
      fetchBannedUsers();
    } catch (error) {
      console.error("Error unbanning user:", error);
      toast.error("فشل إلغاء الحظر");
    } finally {
      setUnbanning(null);
    }
  };

  const availableUsers = allUsers.filter(
    u => !bannedUsers.some(b => b.user_id === u.user_id)
  );

  const filteredBannedUsers = bannedUsers.filter(
    u => !searchQuery || 
    u.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="space-y-4">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          {bannedUsers.length > 0 && (
            <Badge variant="destructive" className="text-xs w-fit">
              {bannedUsers.length} محظور
            </Badge>
          )}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button variant="outline" size="sm" onClick={fetchBannedUsers} disabled={loading} className="text-xs sm:text-sm">
              <RefreshCw className={`h-4 w-4 ml-1 sm:ml-2 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">تحديث</span>
            </Button>
            <Button 
              size="sm" 
              onClick={() => setShowBanDialog(true)}
              className="bg-red-600 hover:bg-red-700 text-xs sm:text-sm"
            >
              <UserX className="h-4 w-4 ml-1 sm:ml-2" />
              حظر مستخدم
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالبريد أو السبب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 h-9"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredBannedUsers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{searchQuery ? "لا توجد نتائج" : "لا يوجد مستخدمين محظورين"}</p>
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="block sm:hidden space-y-3">
              {filteredBannedUsers.map((user) => (
                <Card key={user.id} className="border-red-500/30 bg-red-500/5">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate">{user.user_email || "غير محدد"}</span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {format(new Date(user.banned_at), "dd/MM/yyyy", { locale: ar })}
                      </span>
                    </div>
                    
                    <Badge variant="destructive" className="font-normal text-xs">
                      {user.reason}
                    </Badge>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnbanUser(user.id, user.user_email)}
                      disabled={unbanning === user.id}
                      className="w-full text-green-600 border-green-600 hover:bg-green-50 h-8 text-xs"
                    >
                      {unbanning === user.id ? (
                        <Loader2 className="h-3 w-3 animate-spin ml-1" />
                      ) : (
                        <Trash2 className="h-3 w-3 ml-1" />
                      )}
                      إلغاء الحظر
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>سبب الحظر</TableHead>
                    <TableHead>تاريخ الحظر</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBannedUsers.map((user) => (
                    <TableRow key={user.id} className="bg-red-500/5">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{user.user_email || "غير محدد"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive" className="font-normal">
                          {user.reason}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(user.banned_at), "dd/MM/yyyy HH:mm", { locale: ar })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnbanUser(user.id, user.user_email)}
                          disabled={unbanning === user.id}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          {unbanning === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin ml-2" />
                          ) : (
                            <Trash2 className="h-4 w-4 ml-2" />
                          )}
                          إلغاء الحظر
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      {/* Ban User Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Ban className="h-5 w-5" />
              حظر مستخدم
            </DialogTitle>
            <DialogDescription>
              سيتم حظر المستخدم من المنصة وإرسال إشعار بريدي له
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">اختر المستخدم</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المستخدم..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      {user.email || user.user_id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">سبب الحظر</label>
              <Textarea
                placeholder="اكتب سبب الحظر هنا..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowBanDialog(false)} className="w-full sm:w-auto">
              إلغاء
            </Button>
            <Button
              onClick={handleBanUser}
              disabled={banning || !selectedUserId || !banReason.trim()}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
            >
              {banning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري الحظر...
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4 ml-2" />
                  حظر المستخدم
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
