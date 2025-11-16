import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Shield, DollarSign, Target, TrendingUp, AlertCircle } from "lucide-react";

interface AnalysisResultProps {
  analysis: string;
}

export const AnalysisResult = ({ analysis }: AnalysisResultProps) => {
  let data: any;
  try {
    data = JSON.parse(analysis);
  } catch {
    // If not JSON, display as formatted markdown text
    return (
      <div className="bg-card border rounded-lg p-6">
        <div className="whitespace-pre-wrap text-foreground leading-relaxed prose prose-sm max-w-none dark:prose-invert">
          {analysis.split('\n').map((line, index) => {
            // Handle headers
            if (line.startsWith('## ')) {
              return <h2 key={index} className="text-xl font-bold mt-6 mb-3 text-primary">{line.replace('## ', '')}</h2>;
            }
            if (line.startsWith('# ')) {
              return <h1 key={index} className="text-2xl font-bold mt-6 mb-4 text-primary">{line.replace('# ', '')}</h1>;
            }
            // Handle bold text
            if (line.includes('**')) {
              const parts = line.split('**');
              return (
                <p key={index} className="mb-2">
                  {parts.map((part, i) => i % 2 === 0 ? part : <strong key={i} className="font-bold text-foreground">{part}</strong>)}
                </p>
              );
            }
            // Handle bullet points
            if (line.trim().startsWith('- ')) {
              return <li key={index} className="ml-4 mb-1">{line.replace(/^- /, '')}</li>;
            }
            // Regular paragraphs
            if (line.trim()) {
              return <p key={index} className="mb-2">{line}</p>;
            }
            return <br key={index} />;
          })}
        </div>
      </div>
    );
  }

  const isUpDirection = data.direction?.includes('شراء') || data.direction?.includes('CALL') || data.direction?.toUpperCase().includes('BUY');

  return (
    <div className="space-y-4">
      {/* Main Direction Card */}
      <Card className={`border-2 ${isUpDirection ? 'border-green-500 bg-green-500/5' : 'border-red-500 bg-red-500/5'}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isUpDirection ? (
                <div className="p-3 rounded-full bg-green-500/10">
                  <ArrowUp className="h-6 w-6 text-green-500" />
                </div>
              ) : (
                <div className="p-3 rounded-full bg-red-500/10">
                  <ArrowDown className="h-6 w-6 text-red-500" />
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">الاتجاه</p>
                <p className="text-2xl font-bold">{data.direction}</p>
              </div>
            </div>
            {data.confidence && (
              <Badge variant={data.confidence.includes('قوية') ? 'default' : 'secondary'} className="text-lg px-4 py-2">
                {data.confidence}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Price Levels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.entryPoint && (
          <Card className="border-blue-500/50 bg-blue-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-500/10">
                  <DollarSign className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">نقطة الدخول</p>
                  <p className="text-lg font-bold text-foreground">{data.entryPoint}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {data.stopLoss && (
          <Card className="border-red-500/50 bg-red-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-red-500/10">
                  <Shield className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">وقف الخسارة</p>
                  <p className="text-lg font-bold text-foreground">{data.stopLoss}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {data.takeProfit && (
          <Card className="border-green-500/50 bg-green-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500/10">
                  <Target className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">جني الأرباح</p>
                  <p className="text-lg font-bold text-foreground">{data.takeProfit}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Current Price */}
      {data.currentPrice && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-500/10">
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">السعر الحالي</p>
                <p className="text-lg font-bold text-foreground">{data.currentPrice}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trend */}
      {data.trend && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-primary mt-1" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground mb-1">الاتجاه العام</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{data.trend}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Analysis */}
      {data.analysis && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              التحليل التفصيلي
            </h3>
            <div className="prose prose-sm max-w-none dark:prose-invert" dir="rtl">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {data.analysis}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advice */}
      {data.advice && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              💡 النصائح والتوجيهات
            </h3>
            <div className="prose prose-sm max-w-none dark:prose-invert" dir="rtl">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {data.advice}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* General Warning */}
      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-foreground">تحذير هام:</p>
              <p className="text-muted-foreground leading-relaxed">
                التداول في الأسواق المالية يحمل مخاطر عالية. تأكد من فهم التحليل جيداً قبل الدخول في أي صفقة وحدد المبلغ المناسب لك. لا تستثمر أكثر مما يمكنك تحمل خسارته.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
