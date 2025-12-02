import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTradingGoals, NewTradingGoal } from '@/hooks/useTradingGoals';
import { useDailyJournal } from '@/hooks/useDailyJournal';
import { Target, TrendingUp, Calendar, Download, Plus, Clock } from 'lucide-react';
import * as XLSX from 'xlsx';

export const ProfessionalTradingJournal = () => {
  const { activeGoal, createGoal, loading: goalsLoading } = useTradingGoals();
  const { getStats } = useDailyJournal();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState<NewTradingGoal>({
    initial_capital: 1000,
    target_amount: 4000,
    duration_days: 60,
    market_type: 'forex',
    loss_compensation_rate: 2.0
  });

  const stats = getStats();

  // Calculate daily plan
  const calculateDailyPlan = () => {
    if (!activeGoal) return [];
    
    const { initial_capital, target_amount, duration_days, loss_compensation_rate } = activeGoal;
    const targetProfit = target_amount - initial_capital;
    const dailyTargetProfit = targetProfit / duration_days;
    
    const dailyPlan = [];
    let currentCapital = initial_capital;
    
    for (let day = 1; day <= duration_days; day++) {
      const dailyTarget = currentCapital + dailyTargetProfit;
      const lossCompensation = dailyTargetProfit * loss_compensation_rate;
      
      dailyPlan.push({
        day,
        startCapital: currentCapital,
        dailyTarget: dailyTargetProfit,
        endCapital: dailyTarget,
        lossCompensation
      });
      
      currentCapital = dailyTarget;
    }
    
    return dailyPlan;
  };

  const handleCreateGoal = async () => {
    const success = await createGoal(newGoal);
    if (success) {
      setDialogOpen(false);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!activeGoal) return;
    
    const dailyPlan = calculateDailyPlan();
    const ws = XLSX.utils.json_to_sheet(
      dailyPlan.map(day => ({
        'اليوم': day.day,
        'رأس المال (بداية)': day.startCapital.toFixed(2),
        'الهدف اليومي': day.dailyTarget.toFixed(2),
        'رأس المال (نهاية)': day.endCapital.toFixed(2),
        'تعويض الخسارة': day.lossCompensation.toFixed(2)
      }))
    );
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'خطة التداول');
    
    // Add goal info sheet
    const goalInfo = {
      'رأس المال': activeGoal.initial_capital,
      'الهدف': activeGoal.target_amount,
      'المدة (أيام)': activeGoal.duration_days,
      'السوق': activeGoal.market_type,
      'نسبة تعويض الخسارة': activeGoal.loss_compensation_rate
    };
    
    const ws2 = XLSX.utils.json_to_sheet([goalInfo]);
    XLSX.utils.book_append_sheet(wb, ws2, 'معلومات الخطة');
    
    XLSX.writeFile(wb, 'خطة_التداول.xlsx');
  };

  const dailyPlan = calculateDailyPlan();

  // Market session times
  const marketSessions = [
    { name: 'السوق الآسيوي', time: '12:00 AM - 9:00 AM', icon: '🌏', color: 'text-blue-500' },
    { name: 'السوق الأوروبي', time: '8:00 AM - 4:00 PM', icon: '🌍', color: 'text-green-500' },
    { name: 'السوق الأمريكي', time: '1:00 PM - 10:00 PM', icon: '🌎', color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Goal Setup */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">دفتر التداول الاحترافي</h2>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                خطة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>إنشاء خطة تداول جديدة</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>رأس المال (ريال)</Label>
                    <Input
                      type="number"
                      value={newGoal.initial_capital}
                      onChange={(e) => setNewGoal({ ...newGoal, initial_capital: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الهدف (ريال)</Label>
                    <Input
                      type="number"
                      value={newGoal.target_amount}
                      onChange={(e) => setNewGoal({ ...newGoal, target_amount: Number(e.target.value) })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>المدة (أيام)</Label>
                    <Input
                      type="number"
                      value={newGoal.duration_days}
                      onChange={(e) => setNewGoal({ ...newGoal, duration_days: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>نوع السوق</Label>
                    <Select
                      value={newGoal.market_type}
                      onValueChange={(value: any) => setNewGoal({ ...newGoal, market_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="forex">فوركس</SelectItem>
                        <SelectItem value="crypto">عملات رقمية</SelectItem>
                        <SelectItem value="stocks">أسهم</SelectItem>
                        <SelectItem value="metals">معادن</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>نسبة تعويض الخسارة (مضاعف)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newGoal.loss_compensation_rate}
                    onChange={(e) => setNewGoal({ ...newGoal, loss_compensation_rate: Number(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground">
                    كم مرة تحتاج للربح لتعويض الخسارة (مثال: 2 = ربحتين لتعويض خسارة واحدة)
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleCreateGoal}>
                  إنشاء الخطة
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {activeGoal && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-background/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">رأس المال</p>
              <p className="text-lg font-bold text-foreground">{activeGoal.initial_capital.toLocaleString()} ريال</p>
            </div>
            <div className="text-center p-3 bg-background/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">الهدف</p>
              <p className="text-lg font-bold text-success">{activeGoal.target_amount.toLocaleString()} ريال</p>
            </div>
            <div className="text-center p-3 bg-background/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">المدة</p>
              <p className="text-lg font-bold text-primary">{activeGoal.duration_days} يوم</p>
            </div>
            <div className="text-center p-3 bg-background/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">السوق</p>
              <p className="text-lg font-bold text-foreground capitalize">{activeGoal.market_type}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Current Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <TrendingUp className="h-8 w-8 mx-auto mb-2 text-success" />
          <p className="text-xs text-muted-foreground mb-1">نسبة النجاح</p>
          <p className="text-2xl font-bold text-success">{stats.winRate}%</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">إجمالي الصفقات</p>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">صفقات رابحة</p>
          <p className="text-2xl font-bold text-success">{stats.wins}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">صفقات خاسرة</p>
          <p className="text-2xl font-bold text-destructive">{stats.losses}</p>
        </Card>
      </div>

      {/* Market Sessions */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">أفضل أوقات التداول</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {marketSessions.map((session) => (
            <div
              key={session.name}
              className="p-4 bg-secondary/30 rounded-lg border border-border hover:border-primary transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{session.icon}</span>
                <div>
                  <p className={`font-bold ${session.color}`}>{session.name}</p>
                  <p className="text-xs text-muted-foreground">{session.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Daily Plan Table */}
      {activeGoal && dailyPlan.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">الجدول اليومي للوصول للهدف</h3>
            </div>
            <Button variant="outline" className="gap-2" onClick={exportToExcel}>
              <Download className="h-4 w-4" />
              تحميل Excel
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">اليوم</TableHead>
                  <TableHead className="text-right">رأس المال (بداية)</TableHead>
                  <TableHead className="text-right">الهدف اليومي</TableHead>
                  <TableHead className="text-right">رأس المال (نهاية)</TableHead>
                  <TableHead className="text-right">تعويض الخسارة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyPlan.slice(0, 30).map((day) => (
                  <TableRow key={day.day}>
                    <TableCell className="font-medium">{day.day}</TableCell>
                    <TableCell>{day.startCapital.toFixed(2)}</TableCell>
                    <TableCell className="text-success font-bold">+{day.dailyTarget.toFixed(2)}</TableCell>
                    <TableCell className="font-bold">{day.endCapital.toFixed(2)}</TableCell>
                    <TableCell className="text-warning">{day.lossCompensation.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {dailyPlan.length > 30 && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              عرض أول 30 يوم. حمل الملف الكامل بصيغة Excel
            </p>
          )}
        </Card>
      )}

      {!activeGoal && !goalsLoading && (
        <Card className="p-12 text-center">
          <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h3 className="text-xl font-bold text-foreground mb-2">لم تقم بإنشاء خطة تداول بعد</h3>
          <p className="text-muted-foreground mb-6">
            ابدأ بإنشاء خطة تداول احترافية لتحقيق أهدافك المالية
          </p>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            إنشاء خطة جديدة
          </Button>
        </Card>
      )}
    </div>
  );
};