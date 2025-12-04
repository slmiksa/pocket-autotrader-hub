import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";

interface PatternImageDisplayProps {
  patternImage: string;
  isLoading?: boolean;
}

export const PatternImageDisplay = ({ patternImage, isLoading }: PatternImageDisplayProps) => {
  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="flex flex-col items-center justify-center p-6 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-slate-400">جاري إنشاء صورة النمط الفني...</p>
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
            النمط الفني المتوقع
          </CardTitle>
          <Badge variant="outline" className="border-primary/50 text-primary">
            توضيح بصري
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="relative rounded-lg overflow-hidden border border-slate-600/50 bg-slate-900/50">
          <img 
            src={patternImage} 
            alt="النمط الفني المتوقع" 
            className="w-full h-auto object-contain max-h-[400px]"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 to-transparent p-3">
            <p className="text-xs text-slate-300 text-center">
              هذه صورة توضيحية للنمط الفني المتوقع بناءً على التحليل
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
