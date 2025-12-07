import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, TrendingDown, Clock, Target, Shield, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { PullToRefresh } from "@/components/PullToRefresh";

interface ProfessionalSignal {
  id: string;
  asset: string;
  direction: string;
  entry_price: string | null;
  target_price: string | null;
  stop_loss: string | null;
  timeframe: string;
  confidence_level: string | null;
  analysis: string | null;
  created_at: string;
  expires_at: string | null;
  result: string | null;
}

const ProfessionalSignals = () => {
  const navigate = useNavigate();
  const [signals, setSignals] = useState<ProfessionalSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("يجب تسجيل الدخول أولاً");
        navigate("/auth");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("professional_signals_enabled")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error checking access:", error);
        setHasAccess(false);
        setLoading(false);
        return;
      }

      if (profile?.professional_signals_enabled) {
        setHasAccess(true);
        await fetchSignals();
      } else {
        setHasAccess(false);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error:", error);
      setHasAccess(false);
      setLoading(false);
    }
  };

  const fetchSignals = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("professional_signals")
        .select("*")
        .eq("is_active", true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setSignals(data || []);
    } catch (error) {
      console.error("Error fetching signals:", error);
      toast.error("فشل تحميل التوصيات");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    await fetchSignals();
  }, [fetchSignals]);

  const getDirectionIcon = (direction: string) => {
    return direction === "CALL" || direction === "BUY" ? (
      <TrendingUp className="h-5 w-5 text-success" />
    ) : (
      <TrendingDown className="h-5 w-5 text-destructive" />
    );
  };

  const getDirectionColor = (direction: string) => {
    return direction === "CALL" || direction === "BUY"
      ? "bg-success/10 text-success border-success/20"
      : "bg-destructive/10 text-destructive border-destructive/20";
  };

  const getConfidenceColor = (level: string | null) => {
    switch (level) {
      case "high":
        return "bg-success/10 text-success";
      case "medium":
        return "bg-warning/10 text-warning";
      case "low":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getConfidenceLabel = (level: string | null) => {
    switch (level) {
      case "high":
        return "ثقة عالية";
      case "medium":
        return "ثقة متوسطة";
      case "low":
        return "ثقة منخفضة";
      default:
        return "غير محدد";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background p-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <div className="fixed top-0 left-0 right-0 h-[env(safe-area-inset-top)] bg-background z-[60]" />
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="ml-2 h-4 w-4" />
            رجوع
          </Button>

          <Card className="border-amber-500">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
                <Lock className="h-8 w-8 text-amber-500" />
              </div>
              <CardTitle className="text-2xl">ميزة غير متاحة</CardTitle>
              <CardDescription>
                اشتراكك الحالي لا يسمح بالوصول إلى توصيات المحترفين
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-lg">للحصول على هذه الميزة:</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span>توصيات من محترفين بخبرة سنوات</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span>تحليل شامل لكل توصية</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span>نقاط دخول وهدف ووقف خسارة دقيقة</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span>مستوى ثقة لكل توصية</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen bg-background p-4 pt-[calc(env(safe-area-inset-top,0px)+48px)]">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="ml-2 h-4 w-4" />
            رجوع
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2">
              <Shield className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">توصيات المحترفين</h1>
              <p className="text-sm text-muted-foreground">توصيات حصرية من خبراء التداول</p>
            </div>
          </div>
        </div>

        {signals.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد توصيات حالياً</h3>
              <p className="text-sm text-muted-foreground">
                سيتم نشر التوصيات الجديدة قريباً
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {signals.map((signal) => (
              <Card key={signal.id} className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getDirectionIcon(signal.direction)}
                      <div>
                        <CardTitle className="text-xl">{signal.asset}</CardTitle>
                        <CardDescription className="mt-1">
                          <Badge className={getDirectionColor(signal.direction)}>
                            {signal.direction}
                          </Badge>
                        </CardDescription>
                      </div>
                    </div>
                    {signal.confidence_level && (
                      <Badge className={getConfidenceColor(signal.confidence_level)}>
                        {getConfidenceLabel(signal.confidence_level)}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Price Information */}
                  <div className="grid grid-cols-3 gap-4">
                    {signal.entry_price && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">سعر الدخول</p>
                        <p className="font-semibold text-sm">{signal.entry_price}</p>
                      </div>
                    )}
                    {signal.target_price && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          الهدف
                        </p>
                        <p className="font-semibold text-sm text-success">{signal.target_price}</p>
                      </div>
                    )}
                    {signal.stop_loss && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          وقف الخسارة
                        </p>
                        <p className="font-semibold text-sm text-destructive">{signal.stop_loss}</p>
                      </div>
                    )}
                  </div>

                  {/* Analysis */}
                  {signal.analysis && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm font-medium mb-1">التحليل:</p>
                      <p className="text-sm text-muted-foreground">{signal.analysis}</p>
                    </div>
                  )}

                  {/* Timeframe and Date */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {signal.timeframe}
                    </div>
                    <div>
                      {format(new Date(signal.created_at), "dd MMM yyyy, HH:mm", { locale: ar })}
                    </div>
                  </div>

                  {/* Expiry */}
                  {signal.expires_at && (
                    <div className="text-xs text-amber-500 bg-amber-500/10 rounded px-2 py-1">
                      صالحة حتى: {format(new Date(signal.expires_at), "dd MMM yyyy, HH:mm", { locale: ar })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PullToRefresh>
  );
};

export default ProfessionalSignals;