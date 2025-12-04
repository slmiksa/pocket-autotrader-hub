import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Download } from "lucide-react";
import { toast } from "sonner";

interface PatternImageDisplayProps {
  patternImage: string;
  isLoading?: boolean;
}

export const PatternImageDisplay = ({ patternImage, isLoading }: PatternImageDisplayProps) => {
  const handleDownload = async () => {
    try {
      // Create a link element
      const link = document.createElement('a');
      
      // If it's a base64 image
      if (patternImage.startsWith('data:')) {
        link.href = patternImage;
      } else {
        // If it's a URL, fetch and convert to blob
        const response = await fetch(patternImage);
        const blob = await response.blob();
        link.href = URL.createObjectURL(blob);
      }
      
      // Set filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      link.download = `chart-analysis-${timestamp}.png`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('تم تنزيل الصورة بنجاح');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('فشل في تنزيل الصورة');
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="flex flex-col items-center justify-center p-6 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-slate-400">جاري تحليل ورسم النمط على الصورة...</p>
        </CardContent>
      </Card>
    );
  }

  if (!patternImage) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            الشارت المحلل
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/50 text-primary">
              مستويات الدعم والمقاومة
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="border-green-500/50 text-green-400 hover:bg-green-500/20 hover:text-green-300"
            >
              <Download className="h-4 w-4 ml-1" />
              تنزيل
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="relative rounded-lg overflow-hidden border border-slate-600/50 bg-slate-900/50">
          <img 
            src={patternImage} 
            alt="الشارت المحلل مع مستويات الدعم والمقاومة" 
            className="w-full h-auto object-contain max-h-[500px]"
          />
        </div>
      </CardContent>
    </Card>
  );
};
