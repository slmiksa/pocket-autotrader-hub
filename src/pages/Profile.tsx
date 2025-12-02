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
  Calendar, Target, BookOpen, User, Loader2, Image as ImageIcon
} from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { useDailyJournal, NewJournalEntry } from '@/hooks/useDailyJournal';
import { useSavedAnalyses } from '@/hooks/useSavedAnalyses';
import { ProfessionalTradingJournal } from '@/components/trading/ProfessionalTradingJournal';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { favorites, loading: favLoading, removeFavorite } = useFavorites();
  const { entries, loading: journalLoading, addEntry, deleteEntry, getStats, getTodayEntries } = useDailyJournal();
  const { analyses, loading: analysesLoading, deleteAnalysis } = useSavedAnalyses();
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
  
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <ArrowLeft className="h-5 w-5 rotate-180" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">الملف الشخصي</h1>
            <div className="w-10" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* User Info */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{user?.email}</h2>
              <p className="text-muted-foreground text-sm">متداول</p>
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <p className="text-muted-foreground text-sm mb-1">إجمالي الصفقات</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-muted-foreground text-sm mb-1">نسبة النجاح</p>
            <p className="text-2xl font-bold text-success">{stats.winRate}%</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-muted-foreground text-sm mb-1">صفقات رابحة</p>
            <p className="text-2xl font-bold text-success">{stats.wins}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-muted-foreground text-sm mb-1">صفقات خاسرة</p>
            <p className="text-2xl font-bold text-destructive">{stats.losses}</p>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="favorites" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="favorites" className="flex-1">
              <Star className="h-4 w-4 ml-2" />
              المفضلة
            </TabsTrigger>
            <TabsTrigger value="analyses" className="flex-1">
              <ImageIcon className="h-4 w-4 ml-2" />
              تحليلاتي
            </TabsTrigger>
            <TabsTrigger value="journal" className="flex-1">
              <BookOpen className="h-4 w-4 ml-2" />
              حلل أهدافك
            </TabsTrigger>
          </TabsList>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="mt-4">
            <Card className="p-4">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-warning" />
                الأسواق المفضلة ({favorites.length})
              </h3>
              
              {favLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : favorites.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>لا توجد أسواق في المفضلة</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
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
                      className="p-4 bg-secondary/50 rounded-lg group hover:bg-secondary transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => navigate(`/live-chart?symbol=${fav.symbol}`)}
                        >
                          <p className="font-medium text-foreground">{fav.symbol_name_ar}</p>
                          <p className="text-xs text-muted-foreground">{fav.symbol_name_en}</p>
                          <span className="text-xs text-primary">{fav.category}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
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

          {/* Analyses Tab */}
          <TabsContent value="analyses" className="mt-4">
            <Card className="p-4">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                تحليلاتي المحفوظة ({analyses.length})
              </h3>
              
              {analysesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : analyses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>لا توجد تحليلات محفوظة</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate('/markets')}
                  >
                    ابدأ التحليل
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analyses.map((analysis) => {
                    const analysisData = JSON.parse(analysis.analysis_text);
                    return (
                      <Card
                        key={analysis.id}
                        className="p-4 bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
                        onClick={() => setSelectedAnalysis(analysis)}
                      >
                        {/* Analysis Image */}
                        {analysis.annotated_image_url && (
                          <div className="mb-3 rounded-lg overflow-hidden border border-border">
                            <img 
                              src={analysis.annotated_image_url} 
                              alt={analysis.symbol}
                              className="w-full h-48 object-cover"
                            />
                          </div>
                        )}
                        
                        {/* Analysis Info */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-foreground">{analysis.symbol}</h4>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteAnalysis(analysis.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {new Date(analysis.created_at).toLocaleDateString('ar-SA', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          
                          {analysisData.recommendation && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium text-primary">
                                {analysisData.recommendation.action}
                              </span>
                              <span className="text-muted-foreground">
                                @ {analysisData.recommendation.entry}
                              </span>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Analysis Details Dialog */}
          <Dialog open={!!selectedAnalysis} onOpenChange={() => setSelectedAnalysis(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedAnalysis?.symbol}</DialogTitle>
              </DialogHeader>
              
              {selectedAnalysis && (
                <div className="space-y-4">
                  {/* Image */}
                  {selectedAnalysis.annotated_image_url && (
                    <div className="rounded-lg overflow-hidden border border-border">
                      <img 
                        src={selectedAnalysis.annotated_image_url} 
                        alt={selectedAnalysis.symbol}
                        className="w-full h-auto"
                      />
                    </div>
                  )}
                  
                  {/* Analysis Details */}
                  {(() => {
                    const data = JSON.parse(selectedAnalysis.analysis_text);
                    return (
                      <div className="space-y-4">
                        {/* Current Price & Trend */}
                        <div className="grid grid-cols-2 gap-4">
                          <Card className="p-4">
                            <p className="text-sm text-muted-foreground mb-1">السعر الحالي</p>
                            <p className="text-xl font-bold text-foreground">{data.currentPrice}</p>
                          </Card>
                          <Card className="p-4">
                            <p className="text-sm text-muted-foreground mb-1">الاتجاه</p>
                            <p className="text-xl font-bold text-primary">{data.trend}</p>
                          </Card>
                        </div>
                        
                        {/* Recommendation */}
                        {data.recommendation && (
                          <Card className="p-4 bg-primary/10">
                            <h4 className="font-bold text-foreground mb-3">التوصية</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">العملية</p>
                                <p className="font-bold text-primary">{data.recommendation.action}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">الدخول</p>
                                <p className="font-bold text-foreground">{data.recommendation.entry}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">وقف الخسارة</p>
                                <p className="font-bold text-destructive">{data.recommendation.stopLoss}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">الهدف</p>
                                <p className="font-bold text-success">{data.recommendation.target1}</p>
                              </div>
                            </div>
                          </Card>
                        )}
                        
                        {/* Analysis Text */}
                        {data.analysis && (
                          <Card className="p-4">
                            <h4 className="font-bold text-foreground mb-2">التحليل المفصل</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">{data.analysis}</p>
                          </Card>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Journal Tab */}
          <TabsContent value="journal" className="mt-4 space-y-4">
            <ProfessionalTradingJournal />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;
