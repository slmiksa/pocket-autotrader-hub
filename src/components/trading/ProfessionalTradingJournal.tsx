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
import { Target, TrendingUp, Calendar, Download, Plus, Clock, Edit2, Trash2, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export const ProfessionalTradingJournal = () => {
  const { activeGoal, createGoal, deleteGoal, loading: goalsLoading } = useTradingGoals();
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
  const [showDetails, setShowDetails] = useState(false);
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

  const handleDeleteGoal = async () => {
    if (!activeGoal) return;
    const success = await deleteGoal(activeGoal.id);
    if (success) {
      setShowDetails(false);
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
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    { 
      name: 'السوق الأوروبي', 
      openTime: '8:00 صباحاً',
      closeTime: '4:00 مساءً',
      days: 'الاثنين - الجمعة',
      icon: '🌍', 
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10'
    },
    { 
      name: 'السوق الأمريكي', 
      openTime: '1:00 ظهراً',
      closeTime: '10:00 مساءً',
      days: 'الاثنين - الجمعة',
      icon: '🌎', 
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
  ];

  const getMarketTypeLabel = (type: string) => {
    switch (type) {
      case 'forex': return 'فوركس';
      case 'crypto': return 'عملات رقمية';
      case 'stocks': return 'أسهم';
      case 'metals': return 'معادن';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Goal Setup */}
      <Card className="p-6 border-[hsl(217,33%,17%)] bg-gradient-to-br from-[hsl(224,47%,11%)] via-[hsl(224,47%,9%)] to-[hsl(224,47%,9%)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-[hsl(210,40%,98%)]">دفتر التداول الاحترافي</h2>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4" />
                خطة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-[hsl(224,47%,9%)] border-[hsl(217,33%,17%)]">
              <DialogHeader>
                <DialogTitle className="text-[hsl(210,40%,98%)]">إنشاء خطة تداول جديدة</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[hsl(215,20%,65%)]">رأس المال (ريال)</Label>
                    <Input
                      type="number"
                      value={newGoal.initial_capital}
                      onChange={(e) => setNewGoal({ ...newGoal, initial_capital: Number(e.target.value) })}
                      className="bg-[hsl(217,33%,12%)] border-[hsl(217,33%,17%)] text-[hsl(210,40%,98%)]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[hsl(215,20%,65%)]">الهدف (ريال)</Label>
                    <Input
                      type="number"
                      value={newGoal.target_amount}
                      onChange={(e) => setNewGoal({ ...newGoal, target_amount: Number(e.target.value) })}
                      className="bg-[hsl(217,33%,12%)] border-[hsl(217,33%,17%)] text-[hsl(210,40%,98%)]"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[hsl(215,20%,65%)]">المدة (أيام)</Label>
                    <Input
                      type="number"
                      value={newGoal.duration_days}
                      onChange={(e) => setNewGoal({ ...newGoal, duration_days: Number(e.target.value) })}
                      className="bg-[hsl(217,33%,12%)] border-[hsl(217,33%,17%)] text-[hsl(210,40%,98%)]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[hsl(215,20%,65%)]">نوع السوق</Label>
                    <Select
                      value={newGoal.market_type}
                      onValueChange={(value: any) => setNewGoal({ ...newGoal, market_type: value })}
                    >
                      <SelectTrigger className="bg-[hsl(217,33%,12%)] border-[hsl(217,33%,17%)] text-[hsl(210,40%,98%)]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[hsl(224,47%,9%)] border-[hsl(217,33%,17%)]">
                        <SelectItem value="forex">فوركس</SelectItem>
                        <SelectItem value="crypto">عملات رقمية</SelectItem>
                        <SelectItem value="stocks">أسهم</SelectItem>
                        <SelectItem value="metals">معادن</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[hsl(215,20%,65%)]">نسبة تعويض الخسارة (مضاعف)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newGoal.loss_compensation_rate}
                    onChange={(e) => setNewGoal({ ...newGoal, loss_compensation_rate: Number(e.target.value) })}
                    className="bg-[hsl(217,33%,12%)] border-[hsl(217,33%,17%)] text-[hsl(210,40%,98%)]"
                  />
                  <p className="text-xs text-[hsl(215,20%,50%)]">
                    كم مرة تحتاج للربح لتعويض الخسارة (مثال: 2 = ربحتين لتعويض خسارة واحدة)
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(217,33%,17%)]">
                  إلغاء
                </Button>
                <Button onClick={handleCreateGoal} className="bg-primary hover:bg-primary/90">
                  إنشاء الخطة
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Active Goal Card - Clickable */}
        {activeGoal && (
          <div 
            className="cursor-pointer group"
            onClick={() => setShowDetails(!showDetails)}
          >
            <div className="p-4 rounded-xl bg-[hsl(217,33%,12%)] border border-[hsl(217,33%,17%)] hover:border-primary/30 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <Target className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[hsl(210,40%,98%)]">خطة {getMarketTypeLabel(activeGoal.market_type)}</h3>
                    <p className="text-xs text-[hsl(215,20%,50%)]">
                      {new Date(activeGoal.created_at).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-red-400/60 hover:text-red-400 hover:bg-red-500/10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[hsl(224,47%,9%)] border-[hsl(217,33%,17%)]">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-[hsl(210,40%,98%)]">حذف الخطة؟</AlertDialogTitle>
                        <AlertDialogDescription className="text-[hsl(215,20%,65%)]">
                          سيتم حذف الخطة وجميع التقدم المرتبط بها. هذا الإجراء لا يمكن التراجع عنه.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(217,33%,17%)]">إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteGoal} className="bg-destructive hover:bg-destructive/90">
                          حذف الخطة
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  {showDetails ? (
                    <ChevronUp className="h-5 w-5 text-[hsl(215,20%,50%)] group-hover:text-primary transition-colors" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-[hsl(215,20%,50%)] group-hover:text-primary transition-colors" />
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 bg-[hsl(222,47%,8%)] rounded-lg">
                  <p className="text-xs text-[hsl(215,20%,50%)] mb-1">رأس المال</p>
                  <p className="text-lg font-bold text-[hsl(210,40%,98%)]">{activeGoal.initial_capital.toLocaleString()}</p>
                  <p className="text-xs text-[hsl(215,20%,50%)]">ريال</p>
                </div>
                <div className="text-center p-3 bg-[hsl(222,47%,8%)] rounded-lg">
                  <p className="text-xs text-[hsl(215,20%,50%)] mb-1">الهدف</p>
                  <p className="text-lg font-bold text-emerald-400">{activeGoal.target_amount.toLocaleString()}</p>
                  <p className="text-xs text-[hsl(215,20%,50%)]">ريال</p>
                </div>
                <div className="text-center p-3 bg-[hsl(222,47%,8%)] rounded-lg">
                  <p className="text-xs text-[hsl(215,20%,50%)] mb-1">المدة</p>
                  <p className="text-lg font-bold text-primary">{activeGoal.duration_days}</p>
                  <p className="text-xs text-[hsl(215,20%,50%)]">يوم</p>
                </div>
                <div className="text-center p-3 bg-[hsl(222,47%,8%)] rounded-lg">
                  <p className="text-xs text-[hsl(215,20%,50%)] mb-1">السوق</p>
                  <p className="text-lg font-bold text-[hsl(210,40%,98%)]">{getMarketTypeLabel(activeGoal.market_type)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Expandable Details Section */}
      {activeGoal && showDetails && (
        <>
          {/* Current Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center border-[hsl(217,33%,17%)] bg-[hsl(224,47%,9%)]">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
              <p className="text-xs text-[hsl(215,20%,65%)] mb-1">نسبة النجاح</p>
              <p className="text-2xl font-bold text-emerald-400">{stats.winRate}%</p>
            </Card>
            <Card className="p-4 text-center border-[hsl(217,33%,17%)] bg-[hsl(224,47%,9%)]">
              <p className="text-xs text-[hsl(215,20%,65%)] mb-1">إجمالي الصفقات</p>
              <p className="text-2xl font-bold text-[hsl(210,40%,98%)]">{stats.total}</p>
            </Card>
            <Card className="p-4 text-center border-[hsl(217,33%,17%)] bg-[hsl(224,47%,9%)]">
              <p className="text-xs text-[hsl(215,20%,65%)] mb-1">صفقات رابحة</p>
              <p className="text-2xl font-bold text-emerald-400">{stats.wins}</p>
            </Card>
            <Card className="p-4 text-center border-[hsl(217,33%,17%)] bg-[hsl(224,47%,9%)]">
              <p className="text-xs text-[hsl(215,20%,65%)] mb-1">صفقات خاسرة</p>
              <p className="text-2xl font-bold text-red-400">{stats.losses}</p>
            </Card>
          </div>

          {/* Progress Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 border-[hsl(217,33%,17%)] bg-[hsl(224,47%,9%)]">
              <p className="text-sm text-[hsl(215,20%,65%)] mb-1">إجمالي المحقق</p>
              <p className="text-2xl font-bold text-emerald-400">
                {getTotalAchieved().toFixed(2)} ريال
              </p>
            </Card>
            <Card className="p-4 border-[hsl(217,33%,17%)] bg-[hsl(224,47%,9%)]">
              <p className="text-sm text-[hsl(215,20%,65%)] mb-1">الأيام المكتملة</p>
              <p className="text-2xl font-bold text-primary">
                {getCompletedDays()} / {activeGoal.duration_days}
              </p>
            </Card>
            <Card className="p-4 border-[hsl(217,33%,17%)] bg-[hsl(224,47%,9%)]">
              <p className="text-sm text-[hsl(215,20%,65%)] mb-1">المتبقي للهدف</p>
              <p className="text-2xl font-bold text-[hsl(210,40%,98%)]">
                {(activeGoal.target_amount - activeGoal.initial_capital - getTotalAchieved()).toFixed(2)} ريال
              </p>
            </Card>
          </div>

          {/* Daily Plan Table */}
          {dailyPlan.length > 0 && (
            <Card className="p-6 border-[hsl(217,33%,17%)] bg-[hsl(224,47%,9%)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-bold text-[hsl(210,40%,98%)]">الجدول اليومي للوصول للهدف</h3>
                </div>
                <div className="flex gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="gap-2 text-red-400 hover:text-red-400 border-[hsl(217,33%,17%)] hover:bg-red-500/10">
                        <Trash2 className="h-4 w-4" />
                        مسح الكل
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[hsl(224,47%,9%)] border-[hsl(217,33%,17%)]">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-[hsl(210,40%,98%)]">هل أنت متأكد؟</AlertDialogTitle>
                        <AlertDialogDescription className="text-[hsl(215,20%,65%)]">
                          سيتم حذف جميع التقدم المسجل. هذا الإجراء لا يمكن التراجع عنه.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(217,33%,17%)]">إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearAll} className="bg-destructive hover:bg-destructive/90">
                          مسح الكل
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button variant="outline" className="gap-2 border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(217,33%,17%)]" onClick={exportToExcel}>
                    <Download className="h-4 w-4" />
                    تحميل Excel
                  </Button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[hsl(217,33%,17%)]">
                      <TableHead className="text-right text-[hsl(215,20%,65%)]">اليوم</TableHead>
                      <TableHead className="text-right text-[hsl(215,20%,65%)]">رأس المال (بداية)</TableHead>
                      <TableHead className="text-right text-[hsl(215,20%,65%)]">الهدف اليومي</TableHead>
                      <TableHead className="text-right text-[hsl(215,20%,65%)]">ما تم تحقيقه</TableHead>
                      <TableHead className="text-right text-[hsl(215,20%,65%)]">رأس المال (نهاية)</TableHead>
                      <TableHead className="text-right text-[hsl(215,20%,65%)]">تعويض الخسارة</TableHead>
                      <TableHead className="text-right text-[hsl(215,20%,65%)]">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyPlan.slice(0, 30).map((day) => {
                      const dayProgress = getProgressForDay(day.day);
                      const isEditing = editingDay === day.day;
                      
                      return (
                        <TableRow key={day.day} className={`border-[hsl(217,33%,17%)] ${dayProgress ? 'bg-emerald-500/5' : ''}`}>
                          <TableCell className="font-medium text-[hsl(210,40%,98%)]">{day.day}</TableCell>
                          <TableCell className="text-[hsl(215,20%,65%)]">{day.startCapital.toFixed(2)}</TableCell>
                          <TableCell className="text-primary font-bold">+{day.dailyTarget.toFixed(2)}</TableCell>
                          <TableCell>
                            {isEditing ? (
                              <div className="space-y-1">
                                <Input
                                  type="number"
                                  value={editAmount}
                                  onChange={(e) => setEditAmount(e.target.value)}
                                  placeholder="المبلغ"
                                  className="w-24 bg-[hsl(217,33%,12%)] border-[hsl(217,33%,17%)] text-[hsl(210,40%,98%)]"
                                  step="0.01"
                                />
                                <Input
                                  type="text"
                                  value={editNotes}
                                  onChange={(e) => setEditNotes(e.target.value)}
                                  placeholder="ملاحظات"
                                  className="w-full text-xs bg-[hsl(217,33%,12%)] border-[hsl(217,33%,17%)] text-[hsl(210,40%,98%)]"
                                />
                              </div>
                            ) : dayProgress ? (
                              <div>
                                <span className="text-emerald-400 font-bold">
                                  +{dayProgress.achieved_amount.toFixed(2)}
                                </span>
                                {dayProgress.notes && (
                                  <p className="text-xs text-[hsl(215,20%,50%)] mt-1">{dayProgress.notes}</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-[hsl(215,20%,50%)]">-</span>
                            )}
                          </TableCell>
                          <TableCell className="font-bold text-[hsl(210,40%,98%)]">{day.endCapital.toFixed(2)}</TableCell>
                          <TableCell className="text-amber-400">{day.lossCompensation.toFixed(2)}</TableCell>
                          <TableCell>
                            {isEditing ? (
                              <div className="flex gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-emerald-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                                  onClick={handleSaveProgress}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-red-400 hover:text-red-400 hover:bg-red-500/10"
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
                                  className="h-8 w-8 text-[hsl(215,20%,65%)] hover:bg-primary/10 hover:text-primary"
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
                                        className="h-8 w-8 text-red-400/60 hover:text-red-400 hover:bg-red-500/10"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-[hsl(224,47%,9%)] border-[hsl(217,33%,17%)]">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="text-[hsl(210,40%,98%)]">حذف التقدم</AlertDialogTitle>
                                        <AlertDialogDescription className="text-[hsl(215,20%,65%)]">
                                          هل تريد حذف التقدم المسجل لليوم {day.day}؟
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(217,33%,17%)]">إلغاء</AlertDialogCancel>
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
                <p className="text-center text-sm text-[hsl(215,20%,50%)] mt-4">
                  عرض أول 30 يوم. حمل الملف الكامل بصيغة Excel
                </p>
              )}
            </Card>
          )}
        </>
      )}

      {/* Market Sessions - Always visible */}
      <Card className="p-6 border-[hsl(217,33%,17%)] bg-[hsl(224,47%,9%)]">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold text-[hsl(210,40%,98%)]">أفضل أوقات التداول</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {marketSessions.map((session) => (
            <div
              key={session.name}
              className={`p-5 ${session.bgColor} rounded-lg border border-[hsl(217,33%,17%)] hover:border-primary/30 transition-all`}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{session.icon}</span>
                <div>
                  <p className={`font-bold text-lg ${session.color}`}>{session.name}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[hsl(215,20%,65%)]">يفتح:</span>
                  <span className="font-semibold text-[hsl(210,40%,98%)]">{session.openTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[hsl(215,20%,65%)]">يغلق:</span>
                  <span className="font-semibold text-[hsl(210,40%,98%)]">{session.closeTime}</span>
                </div>
                <div className="pt-2 border-t border-[hsl(217,33%,17%)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[hsl(215,20%,50%)] text-xs">أيام العمل:</span>
                    <span className="font-medium text-[hsl(210,40%,98%)] text-xs">{session.days}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {!activeGoal && !goalsLoading && (
        <Card className="p-12 text-center border-[hsl(217,33%,17%)] bg-[hsl(224,47%,9%)]">
          <Target className="h-16 w-16 mx-auto mb-4 text-[hsl(215,20%,50%)] opacity-30" />
          <h3 className="text-xl font-bold text-[hsl(210,40%,98%)] mb-2">لم تقم بإنشاء خطة تداول بعد</h3>
          <p className="text-[hsl(215,20%,65%)] mb-6">
            ابدأ بإنشاء خطة تداول احترافية لتحقيق أهدافك المالية
          </p>
          <Button onClick={() => setDialogOpen(true)} className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            إنشاء خطة جديدة
          </Button>
        </Card>
      )}
    </div>
  );
};
