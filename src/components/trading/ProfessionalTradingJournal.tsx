import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTradingGoals, NewTradingGoal } from '@/hooks/useTradingGoals';
import { useDailyJournal } from '@/hooks/useDailyJournal';
import { useTradingGoalProgress } from '@/hooks/useTradingGoalProgress';
import { Target, TrendingUp, Calendar, Download, Plus, Clock, Edit2, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export const ProfessionalTradingJournal = () => {
  const { activeGoal, createGoal, loading: goalsLoading } = useTradingGoals();
  const { getStats } = useDailyJournal();
  const { 
    progress, 
    loading: progressLoading,
    updateProgress, 
    deleteProgress, 
    clearAllProgress,
    getProgressForDay,
    getTotalAchieved,
    getCompletedDays
  } = useTradingGoalProgress(activeGoal?.id || null);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNotes, setEditNotes] = useState('');
  
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

  const dailyPlan = calculateDailyPlan();

  const handleEditDay = (dayNumber: number) => {
    const existingProgress = getProgressForDay(dayNumber);
    setEditingDay(dayNumber);
    setEditAmount(existingProgress?.achieved_amount.toString() || '');
    setEditNotes(existingProgress?.notes || '');
  };

  const handleSaveProgress = async () => {
    if (editingDay === null) return;
    
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error('الرجاء إدخال مبلغ صحيح');
      return;
    }

    const success = await updateProgress(editingDay, amount, editNotes);
    if (success) {
      setEditingDay(null);
      setEditAmount('');
      setEditNotes('');
    }
  };

  const handleCancelEdit = () => {
    setEditingDay(null);
    setEditAmount('');
    setEditNotes('');
  };

  const handleDeleteDay = async (dayNumber: number) => {
    await deleteProgress(dayNumber);
  };

  const handleClearAll = async () => {
    await clearAllProgress();
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!activeGoal) return;
    
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

  // Market session times
  const marketSessions = [
    { 
      name: 'السوق الآسيوي', 
      openTime: '12:00 صباحاً',
      closeTime: '9:00 صباحاً',
      days: 'الأحد - الجمعة',
      icon: '🌏', 
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    { 
      name: 'السوق الأوروبي', 
      openTime: '8:00 صباحاً',
      closeTime: '4:00 مساءً',
      days: 'الاثنين - الجمعة',
      icon: '🌍', 
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    { 
      name: 'السوق الأمريكي', 
      openTime: '1:00 ظهراً',
      closeTime: '10:00 مساءً',
      days: 'الاثنين - الجمعة',
      icon: '🌎', 
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
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
              className={`p-5 ${session.bgColor} rounded-lg border border-border hover:border-primary transition-all hover:shadow-md`}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{session.icon}</span>
                <div>
                  <p className={`font-bold text-lg ${session.color}`}>{session.name}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">يفتح:</span>
                  <span className="font-semibold text-foreground">{session.openTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">يغلق:</span>
                  <span className="font-semibold text-foreground">{session.closeTime}</span>
                </div>
                <div className="pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">أيام العمل:</span>
                    <span className="font-medium text-foreground text-xs">{session.days}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Progress Summary */}
      {activeGoal && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">إجمالي المحقق</p>
            <p className="text-2xl font-bold text-success">
              {getTotalAchieved().toFixed(2)} ريال
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">الأيام المكتملة</p>
            <p className="text-2xl font-bold text-primary">
              {getCompletedDays()} / {activeGoal.duration_days}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">المتبقي للهدف</p>
            <p className="text-2xl font-bold text-foreground">
              {(activeGoal.target_amount - activeGoal.initial_capital - getTotalAchieved()).toFixed(2)} ريال
            </p>
          </Card>
        </div>
      )}

      {/* Daily Plan Table */}
      {activeGoal && dailyPlan.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">الجدول اليومي للوصول للهدف</h3>
            </div>
            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="gap-2 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                    مسح الكل
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                    <AlertDialogDescription>
                      سيتم حذف جميع التقدم المسجل. هذا الإجراء لا يمكن التراجع عنه.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAll} className="bg-destructive hover:bg-destructive/90">
                      مسح الكل
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button variant="outline" className="gap-2" onClick={exportToExcel}>
                <Download className="h-4 w-4" />
                تحميل Excel
              </Button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">اليوم</TableHead>
                  <TableHead className="text-right">رأس المال (بداية)</TableHead>
                  <TableHead className="text-right">الهدف اليومي</TableHead>
                  <TableHead className="text-right">ما تم تحقيقه</TableHead>
                  <TableHead className="text-right">رأس المال (نهاية)</TableHead>
                  <TableHead className="text-right">تعويض الخسارة</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyPlan.slice(0, 30).map((day) => {
                  const dayProgress = getProgressForDay(day.day);
                  const isEditing = editingDay === day.day;
                  
                  return (
                    <TableRow key={day.day} className={dayProgress ? 'bg-success/5' : ''}>
                      <TableCell className="font-medium">{day.day}</TableCell>
                      <TableCell>{day.startCapital.toFixed(2)}</TableCell>
                      <TableCell className="text-primary font-bold">+{day.dailyTarget.toFixed(2)}</TableCell>
                      <TableCell>
                        {isEditing ? (
                          <div className="space-y-1">
                            <Input
                              type="number"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              placeholder="المبلغ"
                              className="w-24"
                              step="0.01"
                            />
                            <Input
                              type="text"
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              placeholder="ملاحظات"
                              className="w-full text-xs"
                            />
                          </div>
                        ) : dayProgress ? (
                          <div>
                            <span className="text-success font-bold">
                              +{dayProgress.achieved_amount.toFixed(2)}
                            </span>
                            {dayProgress.notes && (
                              <p className="text-xs text-muted-foreground mt-1">{dayProgress.notes}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-bold">{day.endCapital.toFixed(2)}</TableCell>
                      <TableCell className="text-warning">{day.lossCompensation.toFixed(2)}</TableCell>
                      <TableCell>
                        {isEditing ? (
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                              onClick={handleSaveProgress}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 hover:bg-primary/10"
                              onClick={() => handleEditDay(day.day)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            {dayProgress && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>حذف التقدم</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      هل تريد حذف التقدم المسجل لليوم {day.day}؟
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteDay(day.day)}
                                      className="bg-destructive hover:bg-destructive/90"
                                    >
                                      حذف
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
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