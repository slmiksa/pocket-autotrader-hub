import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Star, TrendingUp, TrendingDown, Plus, Trash2, Calendar, Target, BookOpen, User, Loader2, Image as ImageIcon, Users, Sparkles, ChevronRight, Edit2, Camera } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { useDailyJournal, NewJournalEntry } from '@/hooks/useDailyJournal';
import { useSavedAnalyses } from '@/hooks/useSavedAnalyses';
import { ProfessionalTradingJournal } from '@/components/trading/ProfessionalTradingJournal';
import { ProfileEditDialog } from '@/components/profile/ProfileEditDialog';
import { toast } from 'sonner';

interface CommunityPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
}

interface UserProfile {
  nickname: string | null;
  avatar_url: string | null;
}

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const {
    favorites,
    loading: favLoading,
    removeFavorite
  } = useFavorites();
  const {
    entries,
    loading: journalLoading,
    addEntry,
    deleteEntry,
    getStats,
    getTodayEntries
  } = useDailyJournal();
  const {
    analyses,
    loading: analysesLoading,
    deleteAnalysis
  } = useSavedAnalyses();
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
  const [myPosts, setMyPosts] = useState<CommunityPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
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
      await fetchProfile(user.id);
      setLoading(false);
      fetchMyPosts(user.id);
    };
    checkUser();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('nickname, avatar_url')
        .eq('user_id', userId)
        .single();
      
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchMyPosts = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const post = myPosts.find(p => p.id === postId);
      if (post?.image_url) {
        const imagePath = post.image_url.split('/community-images/')[1];
        if (imagePath) {
          await supabase.storage.from('community-images').remove([imagePath]);
        }
      }

      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      setMyPosts(myPosts.filter(p => p.id !== postId));
      toast.success('تم حذف المشاركة');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('حدث خطأ في حذف المشاركة');
    }
  };

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
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
          <Loader2 className="h-12 w-12 animate-spin text-primary relative" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5" dir="rtl">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/3 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/')} 
              className="text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-all duration-300"
            >
              <ArrowLeft className="h-5 w-5 rotate-180" />
            </Button>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              الملف الشخصي
            </h1>
            <div className="w-10" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 relative">
        {/* User Info Card */}
        <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card via-card to-primary/5 backdrop-blur-sm">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative p-6">
            <div className="flex items-center gap-5">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-blue-500 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/50 flex items-center justify-center backdrop-blur-sm">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-10 w-10 text-primary" />
                  )}
                </div>
                <button 
                  onClick={() => setShowEditDialog(true)}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center border-2 border-background shadow-lg hover:bg-primary/80 transition-colors"
                >
                  <Camera className="h-3.5 w-3.5 text-primary-foreground" />
                </button>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">
                    {profile?.nickname || user?.email?.split('@')[0]}
                  </h2>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                    onClick={() => setShowEditDialog(true)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-muted-foreground text-sm">{user?.email}</p>
                <p className="text-muted-foreground text-xs flex items-center gap-2 mt-1">
                  <TrendingUp className="h-3 w-3 text-primary" />
                  متداول محترف
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all"
                onClick={() => navigate('/community')}
              >
                <Users className="h-4 w-4 ml-2" />
                المجتمع
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center p-3 rounded-xl bg-background/50 border border-border/50 hover:border-primary/30 transition-colors">
                <p className="text-2xl font-bold text-primary">{favorites.length}</p>
                <p className="text-xs text-muted-foreground">المفضلة</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-background/50 border border-border/50 hover:border-emerald-500/30 transition-colors">
                <p className="text-2xl font-bold text-emerald-400">{analyses.length}</p>
                <p className="text-xs text-muted-foreground">التحليلات</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-background/50 border border-border/50 hover:border-blue-500/30 transition-colors">
                <p className="text-2xl font-bold text-blue-400">{myPosts.length}</p>
                <p className="text-xs text-muted-foreground">المنشورات</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="favorites" className="w-full">
          <TabsList className="w-full grid grid-cols-4 bg-card/50 border border-border/50 backdrop-blur-sm p-1 rounded-xl">
            <TabsTrigger 
              value="favorites" 
              className="flex-1 data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg transition-all"
            >
              <Star className="h-4 w-4 ml-1" />
              <span className="hidden sm:inline">المفضلة</span>
            </TabsTrigger>
            <TabsTrigger 
              value="posts" 
              className="flex-1 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 rounded-lg transition-all"
            >
              <Users className="h-4 w-4 ml-1" />
              <span className="hidden sm:inline">منشوراتي</span>
            </TabsTrigger>
            <TabsTrigger 
              value="analyses" 
              className="flex-1 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 rounded-lg transition-all"
            >
              <ImageIcon className="h-4 w-4 ml-1" />
              <span className="hidden sm:inline">تحليلاتي</span>
            </TabsTrigger>
            <TabsTrigger 
              value="journal" 
              className="flex-1 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 rounded-lg transition-all"
            >
              <BookOpen className="h-4 w-4 ml-1" />
              <span className="hidden sm:inline">أهدافي</span>
            </TabsTrigger>
          </TabsList>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="mt-4">
            <Card className="p-5 border-border/50 bg-card/50 backdrop-blur-sm">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Star className="h-5 w-5 text-amber-400" />
                </div>
                الأسواق المفضلة ({favorites.length})
              </h3>
              
              {favLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : favorites.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Star className="h-10 w-10 text-amber-500/40" />
                  </div>
                  <p className="text-lg font-medium">لا توجد أسواق في المفضلة</p>
                  <p className="text-sm mt-1">أضف أسواقك المفضلة للوصول السريع</p>
                  <Button variant="outline" className="mt-4 border-amber-500/30 hover:bg-amber-500/10" onClick={() => navigate('/markets')}>
                    <TrendingUp className="h-4 w-4 ml-2" />
                    تصفح الأسواق
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {favorites.map(fav => (
                    <div 
                      key={fav.id} 
                      className="group p-4 bg-gradient-to-br from-background/80 to-background/40 rounded-xl border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
                      onClick={() => navigate(`/live-chart?symbol=${fav.symbol}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{fav.symbol_name_ar}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{fav.symbol_name_en}</p>
                          <span className="inline-block text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-2">{fav.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive/60 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all" 
                            onClick={(e) => { e.stopPropagation(); removeFavorite(fav.symbol); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts" className="mt-4">
            <Card className="p-5 border-border/50 bg-card/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Users className="h-5 w-5 text-blue-400" />
                  </div>
                  منشوراتي ({myPosts.length})
                </h3>
                <Button onClick={() => navigate('/community')} variant="outline" size="sm" className="border-blue-500/30 hover:bg-blue-500/10">
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة منشور
                </Button>
              </div>
              
              {postsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : myPosts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Users className="h-10 w-10 text-blue-500/40" />
                  </div>
                  <p className="text-lg font-medium">لم تقم بنشر أي منشورات بعد</p>
                  <p className="text-sm mt-1">شارك تحليلاتك مع المجتمع</p>
                  <Button variant="outline" className="mt-4 border-blue-500/30 hover:bg-blue-500/10" onClick={() => navigate('/community')}>
                    <Plus className="h-4 w-4 ml-2" />
                    انشر أول منشور
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {myPosts.map(post => (
                    <Card 
                      key={post.id} 
                      className="overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500/50 transition-all group border-border/50"
                      onClick={() => navigate('/community')}
                    >
                      <div className="aspect-square relative bg-muted">
                        {post.image_url ? (
                          <img
                            src={post.image_url}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                            <ImageIcon className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4">
                          <h4 className="text-white font-semibold text-sm line-clamp-1">{post.title}</h4>
                          <p className="text-white/60 text-xs mt-1">
                            {new Date(post.created_at).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 left-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Analyses Tab */}
          <TabsContent value="analyses" className="mt-4">
            <Card className="p-5 border-border/50 bg-card/50 backdrop-blur-sm">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <ImageIcon className="h-5 w-5 text-emerald-400" />
                </div>
                تحليلاتي المحفوظة ({analyses.length})
              </h3>
              
              {analysesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : analyses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <ImageIcon className="h-10 w-10 text-emerald-500/40" />
                  </div>
                  <p className="text-lg font-medium">لا توجد تحليلات محفوظة</p>
                  <p className="text-sm mt-1">احفظ تحليلاتك للرجوع إليها لاحقاً</p>
                  <Button variant="outline" className="mt-4 border-emerald-500/30 hover:bg-emerald-500/10" onClick={() => navigate('/markets')}>
                    <TrendingUp className="h-4 w-4 ml-2" />
                    ابدأ التحليل
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analyses.map(analysis => {
                    const analysisData = JSON.parse(analysis.analysis_text);
                    return (
                      <Card 
                        key={analysis.id} 
                        className="p-4 bg-gradient-to-br from-background/80 to-background/40 border-border/50 hover:border-emerald-500/30 transition-all cursor-pointer group" 
                        onClick={() => setSelectedAnalysis(analysis)}
                      >
                        {analysis.annotated_image_url && (
                          <div className="mb-3 rounded-lg overflow-hidden border border-border/50 group-hover:border-emerald-500/30 transition-colors">
                            <img src={analysis.annotated_image_url} alt={analysis.symbol} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-foreground group-hover:text-emerald-400 transition-colors">{analysis.symbol}</h4>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive/60 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all" 
                              onClick={e => { e.stopPropagation(); deleteAnalysis(analysis.id); }}
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
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          
                          {analysisData.recommendation && (
                            <div className="flex items-center gap-2 text-sm bg-emerald-500/10 px-3 py-1.5 rounded-lg">
                              <span className="font-medium text-emerald-400">
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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-xl border-border/50">
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-emerald-400" />
                  {selectedAnalysis?.symbol}
                </DialogTitle>
              </DialogHeader>
              
              {selectedAnalysis && (
                <div className="space-y-4">
                  {selectedAnalysis.annotated_image_url && (
                    <div className="rounded-xl overflow-hidden border border-border/50">
                      <img src={selectedAnalysis.annotated_image_url} alt={selectedAnalysis.symbol} className="w-full h-auto" />
                    </div>
                  )}
                  
                  {(() => {
                    const data = JSON.parse(selectedAnalysis.analysis_text);
                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Card className="p-4 bg-background/50 border-border/50">
                            <p className="text-sm text-muted-foreground mb-1">السعر الحالي</p>
                            <p className="text-xl font-bold text-foreground">{data.currentPrice}</p>
                          </Card>
                          <Card className="p-4 bg-background/50 border-border/50">
                            <p className="text-sm text-muted-foreground mb-1">الاتجاه</p>
                            <p className="text-xl font-bold text-primary">{data.trend}</p>
                          </Card>
                        </div>
                        
                        {data.recommendation && (
                          <Card className="p-4 bg-emerald-500/10 border-emerald-500/30">
                            <h4 className="font-bold text-emerald-400 mb-3">التوصية</h4>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">الإجراء</p>
                                <p className="font-bold text-foreground">{data.recommendation.action}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">الدخول</p>
                                <p className="font-bold text-foreground">{data.recommendation.entry}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">الهدف</p>
                                <p className="font-bold text-emerald-400">{data.recommendation.takeProfit}</p>
                              </div>
                            </div>
                          </Card>
                        )}
                        
                        {data.analysis && (
                          <Card className="p-4 bg-background/50 border-border/50">
                            <h4 className="font-bold text-foreground mb-2">التحليل</h4>
                            <p className="text-muted-foreground text-sm leading-relaxed">{data.analysis}</p>
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
          <TabsContent value="journal" className="mt-4">
            <ProfessionalTradingJournal />
          </TabsContent>
        </Tabs>

        {/* Profile Edit Dialog */}
        <ProfileEditDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          userId={user?.id || ''}
          currentNickname={profile?.nickname || null}
          currentAvatarUrl={profile?.avatar_url || null}
          onProfileUpdated={() => fetchProfile(user?.id)}
        />
      </main>
    </div>
  );
};

export default Profile;
