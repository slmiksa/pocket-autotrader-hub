import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";

const ImageAnalysis = () => {
  const navigate = useNavigate();
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [timeframe, setTimeframe] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string>("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("يرجى اختيار صورة صالحة");
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image || !timeframe) {
      toast.error("يرجى رفع صورة واختيار فترة الشمعة");
      return;
    }

    setAnalyzing(true);
    setAnalysis("");

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;

        const { data, error } = await supabase.functions.invoke('analyze-chart-image', {
          body: {
            image: base64Image,
            timeframe: timeframe
          }
        });

        if (error) throw error;

        setAnalysis(data.analysis);
        toast.success("تم تحليل الصورة بنجاح");
      };
      reader.readAsDataURL(image);
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(error.message || "حدث خطأ أثناء تحليل الصورة");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="ml-2 h-4 w-4" />
          رجوع
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">تحليل الشارت بالصورة</CardTitle>
            <CardDescription>
              قم برفع صورة الشارت والشموع اليابانية للحصول على تحليل دقيق من الذكاء الاصطناعي
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="timeframe">فترة الشمعة</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر فترة الشمعة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1 دقيقة</SelectItem>
                  <SelectItem value="5m">5 دقائق</SelectItem>
                  <SelectItem value="15m">15 دقيقة</SelectItem>
                  <SelectItem value="30m">30 دقيقة</SelectItem>
                  <SelectItem value="1h">1 ساعة</SelectItem>
                  <SelectItem value="4h">4 ساعات</SelectItem>
                  <SelectItem value="1d">يوم واحد</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">صورة الشارت</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="cursor-pointer"
                />
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>

            {imagePreview && (
              <div className="space-y-2">
                <Label>معاينة الصورة</Label>
                <div className="border rounded-lg p-4 bg-muted/50">
                  <img
                    src={imagePreview}
                    alt="Chart preview"
                    className="max-w-full h-auto rounded"
                  />
                </div>
              </div>
            )}

            <Button
              onClick={handleAnalyze}
              disabled={!image || !timeframe || analyzing}
              className="w-full"
              size="lg"
            >
              {analyzing ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التحليل...
                </>
              ) : (
                "تحليل الشارت"
              )}
            </Button>

            {analysis && (
              <div className="space-y-2">
                <Label>نتيجة التحليل</Label>
                <Textarea
                  value={analysis}
                  readOnly
                  className="min-h-[300px] font-mono text-sm"
                  dir="rtl"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ImageAnalysis;
