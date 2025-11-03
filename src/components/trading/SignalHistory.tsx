import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock historical data
const historyData = [
  { id: 1, date: "2025-11-03 14:23", asset: "GBPUSD-OTC", dir: "PUT", amount: 5, result: "win", profit: 4.25 },
  { id: 2, date: "2025-11-03 14:20", asset: "EURUSD-OTC", dir: "CALL", amount: 5, result: "loss", profit: -5.00 },
  { id: 3, date: "2025-11-03 14:18", asset: "AUDCAD-OTC", dir: "PUT", amount: 5, result: "win", profit: 4.25 },
  { id: 4, date: "2025-11-03 14:15", asset: "USDJPY-OTC", dir: "CALL", amount: 5, result: "win", profit: 4.25 },
  { id: 5, date: "2025-11-03 14:12", asset: "GBPJPY-OTC", dir: "PUT", amount: 5, result: "loss", profit: -5.00 },
  { id: 6, date: "2025-11-03 14:09", asset: "EURGBP-OTC", dir: "CALL", amount: 5, result: "win", profit: 4.25 },
  { id: 7, date: "2025-11-03 14:06", asset: "NZDUSD-OTC", dir: "PUT", amount: 5, result: "win", profit: 4.25 },
  { id: 8, date: "2025-11-03 14:03", asset: "USDCAD-OTC", dir: "CALL", amount: 5, result: "loss", profit: -5.00 },
];

export const SignalHistory = () => {
  const totalProfit = historyData.reduce((sum, trade) => sum + trade.profit, 0);
  const winRate = (historyData.filter(t => t.result === "win").length / historyData.length * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الصفقات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{historyData.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">معدل النجاح</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{winRate}%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">صافي الربح/الخسارة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              totalProfit >= 0 ? "text-success" : "text-danger"
            )}>
              ${totalProfit.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>سجل الصفقات</CardTitle>
          <CardDescription>جميع الصفقات المنفذة من النظام الآلي</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الوقت</TableHead>
                  <TableHead>الأداة</TableHead>
                  <TableHead>الاتجاه</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>النتيجة</TableHead>
                  <TableHead className="text-right">الربح/الخسارة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyData.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell className="font-mono text-xs">
                      {trade.date}
                    </TableCell>
                    <TableCell className="font-medium">
                      {trade.asset}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={trade.dir === "CALL" ? "default" : "destructive"}
                        className={cn(
                          "gap-1",
                          trade.dir === "CALL" 
                            ? "bg-success hover:bg-success/90" 
                            : "bg-danger hover:bg-danger/90"
                        )}
                      >
                        {trade.dir === "CALL" ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {trade.dir}
                      </Badge>
                    </TableCell>
                    <TableCell>${trade.amount}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={trade.result === "win" ? "default" : "destructive"}
                        className={cn(
                          "gap-1",
                          trade.result === "win" 
                            ? "bg-success hover:bg-success/90" 
                            : "bg-danger hover:bg-danger/90"
                        )}
                      >
                        {trade.result === "win" ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            ربح
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" />
                            خسارة
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-mono font-semibold",
                      trade.profit >= 0 ? "text-success" : "text-danger"
                    )}>
                      {trade.profit >= 0 ? "+" : ""}{trade.profit.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
