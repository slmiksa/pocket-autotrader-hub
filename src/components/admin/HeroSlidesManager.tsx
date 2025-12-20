import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Save, Image, ExternalLink, Upload, Loader2 } from "lucide-react";

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
  image_url: string | null;
  gradient_color: string;
  is_active: boolean;
  display_order: number;
}

export const HeroSlidesManager = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customLinks, setCustomLinks] = useState<Record<string, string>>({});
  const [uploadingSlide, setUploadingSlide] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleImageUpload = async (slideId: string, file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("الرجاء اختيار ملف صورة صالح");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 5 ميجابايت");
      return;
    }

    setUploadingSlide(slideId);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${slideId}-${Date.now()}.${fileExt}`;
      const filePath = `slides/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('hero-slides')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('hero-slides')
        .getPublicUrl(filePath);

      updateSlide(slideId, "image_url", urlData.publicUrl);
      toast.success("تم رفع الصورة بنجاح");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("فشل في رفع الصورة");
    } finally {
      setUploadingSlide(null);
    }
  };

  const gradientOptions = [
    { value: "primary", label: "أزرق (الرئيسي)" },
    { value: "blue", label: "أزرق فاتح" },
    { value: "purple", label: "بنفسجي" },
    { value: "emerald", label: "أخضر" },
    { value: "amber", label: "برتقالي" },
    { value: "red", label: "أحمر" },
  ];

  const linkOptions = [
    { value: "/", label: "الصفحة الرئيسية" },
    { value: "/binary-options", label: "توصيات الخيارات الثنائية" },
    { value: "/supply-demand", label: "محلل العرض والطلب" },
    { value: "/markets", label: "الأسواق المالية" },
    { value: "/economic-calendar", label: "التقويم الاقتصادي" },
    { value: "/live-chart", label: "الشارت المباشر" },
    { value: "/professional-signals", label: "توصيات المحترفين" },
    { value: "/smart-recovery", label: "نظام الصياد الهادئ" },
    { value: "/image-analysis", label: "تحليل الصور بالذكاء" },
    { value: "/community", label: "مجتمع المتداولين" },
    { value: "/profile", label: "الملف الشخصي" },
    { value: "/about", label: "عن التطبيق" },
    { value: "external", label: "🔗 رابط خارجي (أدخل يدوياً)" },
  ];

  const isExternalLink = (link: string) => {
    return link.startsWith("http://") || link.startsWith("https://");
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setSlides(data || []);
    } catch (error) {
      console.error("Error fetching slides:", error);
      toast.error("فشل في تحميل الشرائح");
    } finally {
      setLoading(false);
    }
  };

  const addSlide = () => {
    const newSlide: HeroSlide = {
      id: `new-${Date.now()}`,
      title: "عنوان جديد",
      subtitle: "وصف الشريحة",
      button_text: "ابدأ الآن",
      button_link: "/binary-options",
      image_url: null,
      gradient_color: "primary",
      is_active: true,
      display_order: slides.length + 1,
    };
    setSlides([...slides, newSlide]);
  };

  const updateSlide = (id: string, field: keyof HeroSlide, value: any) => {
    setSlides(slides.map(slide => 
      slide.id === id ? { ...slide, [field]: value } : slide
    ));
  };

  const deleteSlide = async (id: string) => {
    if (id.startsWith("new-")) {
      setSlides(slides.filter(s => s.id !== id));
      return;
    }

    try {
      const { error } = await supabase
        .from("hero_slides")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setSlides(slides.filter(s => s.id !== id));
      toast.success("تم حذف الشريحة");
    } catch (error) {
      console.error("Error deleting slide:", error);
      toast.error("فشل في حذف الشريحة");
    }
  };

  const saveSlides = async () => {
    setSaving(true);
    try {
      for (const slide of slides) {
        const slideData = {
          title: slide.title,
          subtitle: slide.subtitle,
          button_text: slide.button_text,
          button_link: slide.button_link,
          image_url: slide.image_url,
          gradient_color: slide.gradient_color,
          is_active: slide.is_active,
          display_order: slide.display_order,
        };

        if (slide.id.startsWith("new-")) {
          const { error } = await supabase
            .from("hero_slides")
            .insert(slideData);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("hero_slides")
            .update(slideData)
            .eq("id", slide.id);
          if (error) throw error;
        }
      }
      toast.success("تم حفظ التغييرات بنجاح");
      fetchSlides();
    } catch (error) {
      console.error("Error saving slides:", error);
      toast.error("فشل في حفظ التغييرات");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
        <Button variant="outline" size="sm" onClick={addSlide} className="text-xs sm:text-sm">
          <Plus className="h-4 w-4 ml-1 sm:ml-2" />
          إضافة شريحة
        </Button>
        <Button size="sm" onClick={saveSlides} disabled={saving} className="text-xs sm:text-sm">
          <Save className="h-4 w-4 ml-1 sm:ml-2" />
          {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
        </Button>
      </div>

      {/* Slides */}
      <div className="space-y-3">
        {slides.map((slide, index) => (
          <Card key={slide.id} className="border-border/30 bg-muted/20">
            <CardContent className="p-3 sm:p-4">
              {/* Mobile: Stack everything */}
              <div className="space-y-3">
                {/* Header with number, switch and delete */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">شريحة #{index + 1}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={slide.is_active}
                        onCheckedChange={(checked) => updateSlide(slide.id, "is_active", checked)}
                      />
                      <span className="text-xs text-muted-foreground">
                        {slide.is_active ? "مفعّل" : "معطّل"}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteSlide(slide.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Form fields */}
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">العنوان</Label>
                    <Input
                      value={slide.title}
                      onChange={(e) => updateSlide(slide.id, "title", e.target.value)}
                      placeholder="عنوان الشريحة"
                      className="h-9 text-sm"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label className="text-xs">الوصف</Label>
                    <Input
                      value={slide.subtitle}
                      onChange={(e) => updateSlide(slide.id, "subtitle", e.target.value)}
                      placeholder="وصف الشريحة"
                      className="h-9 text-sm"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label className="text-xs">نص الزر</Label>
                    <Input
                      value={slide.button_text}
                      onChange={(e) => updateSlide(slide.id, "button_text", e.target.value)}
                      placeholder="نص الزر"
                      className="h-9 text-sm"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1">
                      رابط الزر
                      {isExternalLink(slide.button_link) && (
                        <ExternalLink className="h-3 w-3 text-primary" />
                      )}
                    </Label>
                    <Select
                      value={isExternalLink(slide.button_link) ? "external" : slide.button_link}
                      onValueChange={(value) => {
                        if (value === "external") {
                          setCustomLinks(prev => ({ ...prev, [slide.id]: slide.button_link.startsWith("http") ? slide.button_link : "" }));
                          updateSlide(slide.id, "button_link", customLinks[slide.id] || "https://");
                        } else {
                          updateSlide(slide.id, "button_link", value);
                        }
                      }}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue>
                          {isExternalLink(slide.button_link) 
                            ? "🔗 رابط خارجي" 
                            : linkOptions.find(o => o.value === slide.button_link)?.label || slide.button_link}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {linkOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isExternalLink(slide.button_link) && (
                      <Input
                        value={slide.button_link}
                        onChange={(e) => updateSlide(slide.id, "button_link", e.target.value)}
                        placeholder="https://example.com"
                        className="h-9 text-sm mt-1.5"
                        dir="ltr"
                      />
                    )}
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label className="text-xs">لون التدرج</Label>
                    <Select
                      value={slide.gradient_color}
                      onValueChange={(value) => updateSlide(slide.id, "gradient_color", value)}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {gradientOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs flex items-center gap-1">
                      <Image className="h-3 w-3" />
                      صورة الشريحة
                    </Label>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Input
                          value={slide.image_url || ""}
                          onChange={(e) => updateSlide(slide.id, "image_url", e.target.value || null)}
                          placeholder="https://... أو ارفع من جهازك"
                          className="h-9 text-sm flex-1"
                          dir="ltr"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={(el) => { fileInputRefs.current[slide.id] = el; }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(slide.id, file);
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 px-3"
                          disabled={uploadingSlide === slide.id}
                          onClick={() => fileInputRefs.current[slide.id]?.click()}
                        >
                          {uploadingSlide === slide.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {slide.image_url && (
                        <div className="relative w-full h-24 rounded-md overflow-hidden bg-muted/50">
                          <img
                            src={slide.image_url}
                            alt={slide.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {slides.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد شرائح حالياً. اضغط على "إضافة شريحة" للبدء.
          </div>
        )}
      </div>
    </div>
  );
};
