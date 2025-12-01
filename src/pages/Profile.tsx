import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, Star, TrendingUp, TrendingDown, Plus, Trash2, 
  Calendar, Target, BookOpen, User, Loader2
} from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { useDailyJournal, NewJournalEntry } from '@/hooks/useDailyJournal';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { favorites, loading: favLoading, removeFavorite } = useFavorites();
  const { entries, loading: journalLoading, addEntry, deleteEntry, getStats, getTodayEntries } = useDailyJournal();
  
  const [newEntry, setNewEntry] = useState<NewJournalEntry>({
    trade_date: new Date().toISOString().split('T')[0],
    symbol: '',
    direction: undefined,
    entry_price: undefined,
    exit_price: undefined,
    result: undefined,
    notes: '',
    daily_goal: undefined,
    daily_achieved: undefined,
    lessons_learned: ''
  });
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setUser(user);
      setLoading(false);
    };
    checkUser();
  }, [navigate]);

  const handleAddEntry = async () => {
    const success = await addEntry(newEntry);
    if (success) {
      setDialogOpen(false);
      setNewEntry({
        trade_date: new Date().toISOString().split('T')[0],
        symbol: '',
        direction: undefined,
        entry_price: undefined,
        exit_price: undefined,
        result: undefined,
        notes: '',
        daily_goal: undefined,
        daily_achieved: undefined,
        lessons_learned: ''
      });
    }
  };

  const stats = getStats();
  const todayEntries = getTodayEntries();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur border-b border-white/5">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5 rotate-180" />
            </Button>
            <h1 className="text-xl font-bold text-white">الملف الشخصي</h1>
            <div className="w-10" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* User Info */}
        <Card className="p-6 bg-[#12121a] border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{user?.email}</h2>
              <p className="text-white/50 text-sm">متداول</p>
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-[#12121a] border-white/10 text-center">
            <p className="text-white/50 text-sm mb-1">إجمالي الصفقات</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </Card>
          <Card className="p-4 bg-[#12121a] border-white/10 text-center">
            <p className="text-white/50 text-sm mb-1">نسبة النجاح</p>
            <p className="text-2xl font-bold text-emerald-400">{stats.winRate}%</p>
          </Card>
          <Card className="p-4 bg-[#12121a] border-white/10 text-center">
            <p className="text-white/50 text-sm mb-1">صفقات رابحة</p>
            <p className="text-2xl font-bold text-emerald-400">{stats.wins}</p>
          </Card>
          <Card className="p-4 bg-[#12121a] border-white/10 text-center">
            <p className="text-white/50 text-sm mb-1">صفقات خاسرة</p>
            <p className="text-2xl font-bold text-red-400">{stats.losses}</p>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="favorites" className="w-full">
          <TabsList className="w-full bg-[#12121a] border border-white/10">
            <TabsTrigger value="favorites" className="flex-1 data-[state=active]:bg-primary">
              <Star className="h-4 w-4 ml-2" />
              المفضلة
            </TabsTrigger>
            <TabsTrigger value="journal" className="flex-1 data-[state=active]:bg-primary">
              <BookOpen className="h-4 w-4 ml-2" />
              دفتر التداول
            </TabsTrigger>
          </TabsList>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="mt-4">
            <Card className="p-4 bg-[#12121a] border-white/10">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                الأسواق المفضلة ({favorites.length})
              </h3>
              
              {favLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-white/50" />
                </div>
              ) : favorites.length === 0 ? (
                <div className="text-center py-8 text-white/50">
                  <Star className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>لا توجد أسواق في المفضلة</p>
                  <Button 
                    variant="outline" 
                    className="mt-4 border-white/20"
                    onClick={() => navigate('/markets')}
                  >
                    تصفح الأسواق
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {favorites.map((fav) => (
                    <div
                      key={fav.id}
                      className="p-4 bg-white/5 rounded-lg group hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => navigate(`/live-chart?symbol=${fav.symbol}`)}
                        >
                          <p className="font-medium text-white">{fav.symbol_name_ar}</p>
                          <p className="text-xs text-white/50">{fav.symbol_name_en}</p>
                          <span className="text-xs text-primary/70">{fav.category}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          onClick={() => removeFavorite(fav.symbol)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Journal Tab */}
          <TabsContent value="journal" className="mt-4 space-y-4">
            {/* Today's Summary */}
            <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  صفقات اليوم
                </h3>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      إضافة صفقة
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#12121a] border-white/10 text-white max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>إضافة صفقة جديدة</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-white/70 mb-1 block">التاريخ</label>
                          <Input
                            type="date"
                            value={newEntry.trade_date}
                            onChange={(e) => setNewEntry({ ...newEntry, trade_date: e.target.value })}
                            className="bg-white/5 border-white/10"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-white/70 mb-1 block">الرمز</label>
                          <Input
                            placeholder="BTCUSD"
                            value={newEntry.symbol || ''}
                            onChange={(e) => setNewEntry({ ...newEntry, symbol: e.target.value })}
                            className="bg-white/5 border-white/10"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-white/70 mb-1 block">الاتجاه</label>
                          <Select onValueChange={(v) => setNewEntry({ ...newEntry, direction: v as any })}>
                            <SelectTrigger className="bg-white/5 border-white/10">
                              <SelectValue placeholder="اختر الاتجاه" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="buy">شراء (Buy)</SelectItem>
                              <SelectItem value="sell">بيع (Sell)</SelectItem>
                              <SelectItem value="call">Call</SelectItem>
                              <SelectItem value="put">Put</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm text-white/70 mb-1 block">النتيجة</label>
                          <Select onValueChange={(v) => setNewEntry({ ...newEntry, result: v as any })}>
                            <SelectTrigger className="bg-white/5 border-white/10">
                              <SelectValue placeholder="اختر النتيجة" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="win">ربح ✅</SelectItem>
                              <SelectItem value="loss">خسارة ❌</SelectItem>
                              <SelectItem value="breakeven">تعادل ⚖️</SelectItem>
                              <SelectItem value="pending">قيد الانتظار ⏳</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-white/70 mb-1 block">سعر الدخول</label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            onChange={(e) => setNewEntry({ ...newEntry, entry_price: parseFloat(e.target.value) || undefined })}
                            className="bg-white/5 border-white/10"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-white/70 mb-1 block">سعر الخروج</label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            onChange={(e) => setNewEntry({ ...newEntry, exit_price: parseFloat(e.target.value) || undefined })}
                            className="bg-white/5 border-white/10"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-white/70 mb-1 block">الهدف اليومي ($)</label>
                          <Input
                            type="number"
                            placeholder="100"
                            onChange={(e) => setNewEntry({ ...newEntry, daily_goal: parseFloat(e.target.value) || undefined })}
                            className="bg-white/5 border-white/10"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-white/70 mb-1 block">المحقق ($)</label>
                          <Input
                            type="number"
                            placeholder="0"
                            onChange={(e) => setNewEntry({ ...newEntry, daily_achieved: parseFloat(e.target.value) || undefined })}
                            className="bg-white/5 border-white/10"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-white/70 mb-1 block">ملاحظات</label>
                        <Textarea
                          placeholder="ملاحظات عن الصفقة..."
                          value={newEntry.notes || ''}
                          onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                          className="bg-white/5 border-white/10"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-white/70 mb-1 block">الدروس المستفادة</label>
                        <Textarea
                          placeholder="ما تعلمته من هذه الصفقة..."
                          value={newEntry.lessons_learned || ''}
                          onChange={(e) => setNewEntry({ ...newEntry, lessons_learned: e.target.value })}
                          className="bg-white/5 border-white/10"
                        />
                      </div>
                      <Button onClick={handleAddEntry} className="w-full">
                        حفظ الصفقة
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <p className="text-white/70">{todayEntries.length} صفقة اليوم</p>
            </Card>

            {/* Journal Entries */}
            <Card className="p-4 bg-[#12121a] border-white/10">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                سجل الصفقات
              </h3>
              
              {journalLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-white/50" />
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-8 text-white/50">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>لا توجد صفقات مسجلة</p>
                  <p className="text-sm mt-2">ابدأ بتسجيل صفقاتك اليومية</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-4 bg-white/5 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            entry.result === 'win' ? 'bg-emerald-500/20 text-emerald-400' :
                            entry.result === 'loss' ? 'bg-red-500/20 text-red-400' :
                            entry.result === 'breakeven' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-white/10 text-white/70'
                          }`}>
                            {entry.result === 'win' ? 'ربح ✅' :
                             entry.result === 'loss' ? 'خسارة ❌' :
                             entry.result === 'breakeven' ? 'تعادل' : 'قيد الانتظار'}
                          </span>
                          <span className="text-white font-medium">{entry.symbol || 'غير محدد'}</span>
                          {entry.direction && (
                            <span className={`flex items-center gap-1 text-xs ${
                              entry.direction === 'buy' || entry.direction === 'call' 
                                ? 'text-emerald-400' 
                                : 'text-red-400'
                            }`}>
                              {entry.direction === 'buy' || entry.direction === 'call' 
                                ? <TrendingUp className="h-3 w-3" /> 
                                : <TrendingDown className="h-3 w-3" />}
                              {entry.direction}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-white/50 text-sm">{entry.trade_date}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            onClick={() => deleteEntry(entry.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {entry.notes && (
                        <p className="text-white/60 text-sm mt-2">{entry.notes}</p>
                      )}
                      {entry.lessons_learned && (
                        <p className="text-primary/70 text-sm mt-2 border-r-2 border-primary pr-2">
                          💡 {entry.lessons_learned}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;
