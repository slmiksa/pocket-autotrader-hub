import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Shield, DollarSign, Target, TrendingUp, AlertCircle } from "lucide-react";
import ReactMarkdown from 'react-markdown';
interface AnalysisResultProps {
  analysis: string | any;
}
// Helper function to extract JSON from markdown code blocks
const extractJsonFromMarkdown = (text: string): string => {
  // Match ```json ... ``` or ``` ... ```
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/;
  const match = text.match(codeBlockRegex);
  if (match && match[1]) {
    return match[1].trim();
  }
  return text;
};

export const AnalysisResult = ({
  analysis
}: AnalysisResultProps) => {
  let data: any;

  // Check if analysis is already an object
  if (typeof analysis === 'object' && analysis !== null) {
    data = analysis;
  } else {
    try {
      // First try direct parse
      data = JSON.parse(analysis);
    } catch {
      try {
        // Try extracting JSON from markdown code blocks
        const extractedJson = extractJsonFromMarkdown(analysis);
        data = JSON.parse(extractedJson);
      } catch {
        // If still not JSON, display as formatted markdown text
        return <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="prose prose-sm max-w-none dark:prose-invert" dir="rtl" style={{
              fontSize: '15px',
              lineHeight: '1.8',
              textAlign: 'right'
            }}>
              <ReactMarkdown components={{
                h1: ({
                  children
                }) => <h1 className="text-2xl font-bold mt-6 mb-4 text-foreground">{children}</h1>,
                h2: ({
                  children
                }) => <h2 className="text-xl font-bold mt-6 mb-3 text-foreground">{children}</h2>,
                h3: ({
                  children
                }) => <h3 className="text-lg font-semibold mt-4 mb-2 text-foreground">{children}</h3>,
                p: ({
                  children
                }) => <p className="mb-3 text-foreground">{children}</p>,
                ul: ({
                  children
                }) => <ul className="list-disc pr-6 mb-4 space-y-2">{children}</ul>,
                ol: ({
                  children
                }) => <ol className="list-decimal pr-6 mb-4 space-y-2">{children}</ol>,
                li: ({
                  children
                }) => <li className="text-foreground">{children}</li>,
                strong: ({
                  children
                }) => <strong className="font-bold text-primary">{children}</strong>,
                em: ({
                  children
                }) => <em className="italic text-foreground">{children}</em>,
                blockquote: ({
                  children
                }) => <blockquote className="border-r-4 border-primary pr-4 py-2 my-4 bg-muted/50 rounded">{children}</blockquote>,
                code: ({
                  children
                }) => <code className="bg-muted px-2 py-1 rounded text-sm">{children}</code>
              }}>
                {analysis}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>;
      }
    }
  }
  const isUpDirection = data.direction?.includes('شراء') || data.direction?.includes('CALL') || data.direction?.toUpperCase().includes('BUY');
  return <div className="space-y-4">
      {/* Main Direction Card */}
      <Card className={`border-2 ${isUpDirection ? 'border-green-500 bg-green-500/5' : 'border-red-500 bg-red-500/5'}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isUpDirection ? <div className="p-3 rounded-full bg-green-500/10">
                  <ArrowUp className="h-6 w-6 text-green-500" />
                </div> : <div className="p-3 rounded-full bg-red-500/10">
                  <ArrowDown className="h-6 w-6 text-red-500" />
                </div>}
              <div>
                <p className="text-sm text-primary-foreground">الاتجاه</p>
                <p className="text-2xl font-bold text-primary-foreground">{data.direction}</p>
              </div>
            </div>
            {data.confidence && <Badge variant={data.confidence.includes('قوية') ? 'default' : 'secondary'} className="text-lg px-4 py-2">
                {data.confidence}
              </Badge>}
          </div>
        </CardContent>
      </Card>

      {/* Price Levels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.entryPoint && <Card className="border-blue-500/50 bg-blue-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-500/10">
                  <DollarSign className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-primary-foreground">نقطة الدخول</p>
                  <p className="text-lg font-bold bg-transparent text-primary-foreground">{data.entryPoint}</p>
                </div>
              </div>
            </CardContent>
          </Card>}

        {data.stopLoss && <Card className="border-red-500/50 bg-red-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-red-500/10">
                  <Shield className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-primary-foreground">وقف الخسارة</p>
                  <p className="text-lg font-bold text-primary-foreground">{data.stopLoss}</p>
                </div>
              </div>
            </CardContent>
          </Card>}

        {data.takeProfit && <Card className="border-green-500/50 bg-green-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500/10">
                  <Target className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-primary-foreground">جني الأرباح</p>
                  <p className="text-lg font-bold text-primary-foreground">{data.takeProfit}</p>
                </div>
              </div>
            </CardContent>
          </Card>}
      </div>

      {/* Current Price */}
      {data.currentPrice && <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-500/10">
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-primary-foreground">السعر الحالي</p>
                <p className="text-lg font-bold text-primary-foreground">{data.currentPrice}</p>
              </div>
            </div>
          </CardContent>
        </Card>}

      {/* Trend */}
      {data.trend && <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-primary mt-1" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground mb-1">الاتجاه العام</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{data.trend}</p>
              </div>
            </div>
          </CardContent>
        </Card>}

      {/* Detailed Analysis */}
      {data.analysis && <Card>
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
        </Card>}

      {/* Advice */}
      {data.advice && <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-primary-foreground">
              💡 النصائح والتوجيهات
            </h3>
            <div className="prose prose-sm max-w-none dark:prose-invert" dir="rtl">
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-primary-foreground">
                {data.advice}
              </p>
            </div>
          </CardContent>
        </Card>}

      {/* General Warning */}
      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-primary-foreground">تحذير هام:</p>
              <p className="leading-relaxed text-primary-foreground">
                التداول في الأسواق المالية يحمل مخاطر عالية. تأكد من فهم التحليل جيداً قبل الدخول في أي صفقة وحدد المبلغ المناسب لك. لا تستثمر أكثر مما يمكنك تحمل خسارته.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>;
};