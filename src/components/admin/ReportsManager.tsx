import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flag, Eye, Trash2, CheckCircle2, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Report {
  id: string;
  post_id: string;
  reporter_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  post?: {
    id: string;
    title: string;
    content: string;
    user_email: string | null;
    image_url: string | null;
  };
}

const reasonLabels: Record<string, string> = {
  spam: "محتوى مزعج (سبام)",
  inappropriate: "محتوى غير لائق",
  harassment: "تحرش أو إساءة",
  misinformation: "معلومات مضللة",
  scam: "احتيال أو نصب",
  other: "سبب آخر",
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "قيد المراجعة", variant: "secondary" },
  resolved: { label: "تم الحل", variant: "default" },
  dismissed: { label: "مرفوض", variant: "outline" },
};

export function ReportsManager() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data: reportsData, error } = await supabase
        .from("community_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch post details for each report
      const reportsWithPosts = await Promise.all(
        (reportsData || []).map(async (report) => {
          const { data: postData } = await supabase
            .from("community_posts")
            .select("id, title, content, user_email, image_url")
            .eq("id", report.post_id)
            .single();
          
          return { ...report, post: postData };
        })
      );

      setReports(reportsWithPosts);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("فشل تحميل البلاغات");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    setProcessingId(reportId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("community_reports")
        .update({
          status: newStatus,
          resolved_at: newStatus !== "pending" ? new Date().toISOString() : null,
          resolved_by: newStatus !== "pending" ? user?.id : null,
        })
        .eq("id", reportId);

      if (error) throw error;

      toast.success("تم تحديث حالة البلاغ");
      fetchReports();
    } catch (error) {
      console.error("Error updating report:", error);
      toast.error("فشل تحديث البلاغ");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeletePost = async (postId: string, reportId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه المشاركة؟ سيتم حذفها نهائياً.")) return;

    setProcessingId(reportId);
    try {
      // Delete the post
      const { error: deleteError } = await supabase
        .from("community_posts")
        .delete()
        .eq("id", postId);

      if (deleteError) throw deleteError;

      // Update report status
      await handleUpdateStatus(reportId, "resolved");
      
      toast.success("تم حذف المشاركة وحل البلاغ");
      setShowDetailsDialog(false);
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("فشل حذف المشاركة");
    } finally {
      setProcessingId(null);
    }
  };

  const openDetails = (report: Report) => {
    setSelectedReport(report);
    setShowDetailsDialog(true);
  };

  const pendingCount = reports.filter(r => r.status === "pending").length;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Flag className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  إدارة البلاغات
                  {pendingCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {pendingCount} جديد
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  مراجعة ومعالجة البلاغات المقدمة من المستخدمين
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchReports} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Flag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد بلاغات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المشاركة</TableHead>
                    <TableHead>سبب البلاغ</TableHead>
                    <TableHead>تاريخ البلاغ</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id} className={report.status === "pending" ? "bg-red-500/5" : ""}>
                      <TableCell>
                        <div className="max-w-xs">
                          {report.post ? (
                            <>
                              <p className="font-medium truncate">{report.post.title}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {report.post.user_email?.split('@')[0] || 'مستخدم'}
                              </p>
                            </>
                          ) : (
                            <span className="text-muted-foreground italic">المشاركة محذوفة</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {reasonLabels[report.reason] || report.reason}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(report.created_at), "dd/MM/yyyy HH:mm", { locale: ar })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusLabels[report.status]?.variant || "secondary"}>
                          {statusLabels[report.status]?.label || report.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetails(report)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {report.status === "pending" && (
                            <Select
                              value={report.status}
                              onValueChange={(value) => handleUpdateStatus(report.id, value)}
                              disabled={processingId === report.id}
                            >
                              <SelectTrigger className="w-28 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">قيد المراجعة</SelectItem>
                                <SelectItem value="resolved">تم الحل</SelectItem>
                                <SelectItem value="dismissed">رفض</SelectItem>
                              </SelectContent>
                            </Select>
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

      {/* Report Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              تفاصيل البلاغ
            </DialogTitle>
            <DialogDescription>
              مراجعة محتوى البلاغ واتخاذ الإجراء المناسب
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6">
              {/* Report Info */}
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">سبب البلاغ:</span>
                  <Badge variant="destructive">
                    {reasonLabels[selectedReport.reason] || selectedReport.reason}
                  </Badge>
                </div>
                {selectedReport.details && (
                  <div>
                    <span className="text-sm text-muted-foreground">تفاصيل إضافية:</span>
                    <p className="mt-1 text-sm bg-background p-2 rounded border">
                      {selectedReport.details}
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">تاريخ البلاغ:</span>
                  <span className="text-sm">
                    {format(new Date(selectedReport.created_at), "dd MMMM yyyy - HH:mm", { locale: ar })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">الحالة:</span>
                  <Badge variant={statusLabels[selectedReport.status]?.variant || "secondary"}>
                    {statusLabels[selectedReport.status]?.label || selectedReport.status}
                  </Badge>
                </div>
              </div>

              {/* Post Content */}
              {selectedReport.post ? (
                <div className="space-y-3">
                  <h4 className="font-semibold">المشاركة المُبلغ عنها:</h4>
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {selectedReport.post.user_email?.split('@')[0] || 'مستخدم'}
                      </Badge>
                    </div>
                    <h5 className="font-bold text-lg">{selectedReport.post.title}</h5>
                    {selectedReport.post.image_url && (
                      <img
                        src={selectedReport.post.image_url}
                        alt="Post image"
                        className="w-full max-h-48 object-cover rounded-lg"
                      />
                    )}
                    <p className="text-muted-foreground whitespace-pre-wrap text-sm">
                      {selectedReport.post.content}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  <Trash2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>تم حذف هذه المشاركة</p>
                </div>
              )}

              {/* Actions */}
              {selectedReport.status === "pending" && selectedReport.post && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    variant="destructive"
                    onClick={() => handleDeletePost(selectedReport.post_id, selectedReport.id)}
                    disabled={processingId === selectedReport.id}
                    className="gap-2"
                  >
                    {processingId === selectedReport.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    حذف المشاركة
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus(selectedReport.id, "dismissed")}
                    disabled={processingId === selectedReport.id}
                    className="gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    رفض البلاغ
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
