import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowRight, ExternalLink, Calendar, Newspaper, TrendingUp, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PullToRefresh } from "@/components/PullToRefresh";
interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
  translatedTitle?: string;
  translatedDescription?: string;
  translatedContent?: string;
}
const News = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  useEffect(() => {
    checkAuthAndFetchNews();
  }, []);
  const checkAuthAndFetchNews = async () => {
    try {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      await fetchNews();
    } catch (error) {
      console.error("Error checking auth:", error);
      navigate("/auth");
    }
  };
  const translateArticle = async (article: NewsArticle): Promise<NewsArticle> => {
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('translate-news', {
        body: {
          title: article.title,
          description: article.description,
          content: article.description
        }
      });
      if (error || !data) {
        console.error("Translation error:", error);
        return article;
      }
      return {
        ...article,
        translatedTitle: data.translatedTitle,
        translatedDescription: data.translatedDescription,
        translatedContent: data.translatedContent
      };
    } catch (error) {
      console.error("Translation failed:", error);
      return article;
    }
  };

  // Translate articles one by one with delay to avoid rate limiting
  const translateArticlesSequentially = async (articles: NewsArticle[]): Promise<NewsArticle[]> => {
    const translated: NewsArticle[] = [];
    const articlesToTranslate = articles.slice(0, 6); // Limit to first 6 articles

    for (let i = 0; i < articlesToTranslate.length; i++) {
      const translatedArticle = await translateArticle(articlesToTranslate[i]);
      translated.push(translatedArticle);

      // Add delay between requests to avoid rate limiting (except for last one)
      if (i < articlesToTranslate.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    // Add remaining untranslated articles
    const remaining = articles.slice(6);
    return [...translated, ...remaining];
  };
  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching financial news...");
      const {
        data,
        error
      } = await supabase.functions.invoke('fetch-financial-news');
      if (error) {
        console.error("Error fetching news:", error);
        toast.error("فشل في تحميل الأخبار");
        return;
      }
      console.log("News fetched:", data);
      const fetchedArticles = data.articles || [];

      // First show articles without translation
      setArticles(fetchedArticles);
      setLoading(false);

      // Then translate in background
      toast.info("جاري ترجمة الأخبار...");
      const translatedArticles = await translateArticlesSequentially(fetchedArticles);
      setArticles(translatedArticles);
      toast.success("تمت ترجمة الأخبار");
    } catch (error) {
      console.error("Error:", error);
      toast.error("حدث خطأ أثناء تحميل الأخبار");
    } finally {
      setLoading(false);
    }
  }, []);
  const handleRefresh = useCallback(async () => {
    await fetchNews();
    toast.success('تم تحديث الأخبار');
  }, [fetchNews]);
  const translateAndShowArticle = async (article: NewsArticle) => {
    setSelectedArticle(article);
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden pt-[env(safe-area-inset-top)]">
        {/* Safe Area Background */}
        <div className="fixed top-0 left-0 right-0 h-[env(safe-area-inset-top)] bg-slate-950 z-[60]" />
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-8 relative z-10">
          {/* Header Skeleton */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
            <div className="flex-1">
              <div className="h-12 w-80 bg-slate-800/50 animate-pulse rounded-xl mb-3"></div>
              <div className="h-5 w-64 bg-slate-800/50 animate-pulse rounded-lg"></div>
            </div>
            <div className="h-12 w-36 bg-slate-800/50 animate-pulse rounded-xl"></div>
          </div>

          {/* News Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="bg-slate-800/30 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-700/50">
                <div className="h-52 bg-slate-700/50 animate-pulse"></div>
                <div className="p-5 space-y-4">
                  <div className="h-6 bg-slate-700/50 animate-pulse rounded-lg w-5/6"></div>
                  <div className="h-4 bg-slate-700/50 animate-pulse rounded w-1/2"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-700/50 animate-pulse rounded"></div>
                    <div className="h-4 bg-slate-700/50 animate-pulse rounded w-4/5"></div>
                  </div>
                  <div className="h-11 bg-slate-700/50 animate-pulse rounded-xl"></div>
                </div>
              </div>)}
          </div>
        </div>
      </div>;
  }
  return <PullToRefresh onRefresh={handleRefresh} className="min-h-screen pt-[calc(env(safe-area-inset-top,0px)+88px)]">
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30">
                <Newspaper className="h-8 w-8 text-emerald-400" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-emerald-100 to-cyan-100 bg-clip-text text-transparent mx-[29px] my-0 px-0 py-[8px]">
                آخر أخبار الأسواق
              </h1>
            </div>
            <p className="text-slate-400 text-lg flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              تابع أحدث الأخبار والتحديثات من عالم التداول والاستثمار
            </p>
          </div>
          <Button onClick={() => navigate("/")} variant="outline" className="bg-slate-800/50 border-slate-700 text-slate-200 hover:bg-slate-700/50 hover:text-white hover:border-slate-600 rounded-xl px-6 py-3 h-auto backdrop-blur-sm">
            <ArrowRight className="ml-2 h-5 w-5" />
            العودة للرئيسية
          </Button>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span className="text-slate-300 text-sm">{articles.length} خبر متاح</span>
          </div>
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article, index) => <div key={index} className="group bg-slate-800/30 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-700/50 hover:border-emerald-500/50 transition-all duration-500 hover:shadow-[0_0_40px_rgba(16,185,129,0.15)] hover:-translate-y-1">
              {article.urlToImage && <div className="relative h-52 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent z-10" />
                  <img src={article.urlToImage} alt={article.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" onError={e => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800';
              }} />
                  <div className="absolute bottom-3 right-3 z-20">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-sm">
                      {article.source.name}
                    </span>
                  </div>
                </div>}
              <div className="p-5 space-y-4">
                <h3 className="text-lg font-bold text-white line-clamp-2 leading-tight group-hover:text-emerald-300 transition-colors duration-300" dir="rtl">
                  {article.translatedTitle || article.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                  {formatDate(article.publishedAt)}
                </div>
                <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed" dir="rtl">
                  {article.translatedDescription || article.description}
                </p>
                <Button onClick={() => translateAndShowArticle(article)} className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-xl py-3 h-auto font-medium transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40">
                  عرض الخبر كاملاً
                </Button>
              </div>
            </div>)}
        </div>

        {articles.length === 0 && <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mx-auto mb-6">
              <Newspaper className="h-10 w-10 text-slate-500" />
            </div>
            <p className="text-slate-400 text-xl mb-4">لا توجد أخبار متاحة حالياً</p>
            <Button onClick={fetchNews} className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-xl px-8">
              إعادة المحاولة
            </Button>
          </div>}
      </div>

      {/* Article Details Dialog */}
      <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-slate-900 border-slate-700/50 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl md:text-3xl font-bold leading-tight text-white" dir="rtl">
              {selectedArticle?.translatedTitle || selectedArticle?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedArticle && <div className="space-y-6">
              {selectedArticle.urlToImage && <div className="relative h-64 md:h-80 overflow-hidden rounded-xl">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent z-10" />
                  <img src={selectedArticle.urlToImage} alt={selectedArticle.title} className="w-full h-full object-cover" onError={e => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800';
              }} />
                </div>}
              
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50">
                  <Calendar className="h-4 w-4 text-emerald-400" />
                  <span className="text-slate-300">{formatDate(selectedArticle.publishedAt)}</span>
                </div>
                <div className="px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                  <span className="font-medium text-emerald-300">{selectedArticle.source.name}</span>
                </div>
              </div>

              <div className="text-lg text-slate-300 leading-relaxed" dir="rtl">
                {selectedArticle.translatedDescription || selectedArticle.description}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-700/50">
                <Button onClick={() => window.open(selectedArticle.url, '_blank')} variant="outline" className="flex-1 gap-2 bg-slate-800/50 border-slate-700 text-slate-200 hover:bg-slate-700/50 hover:text-white rounded-xl py-3 h-auto">
                  <ExternalLink className="h-4 w-4" />
                  المصدر الأصلي
                </Button>
                <Button onClick={() => setSelectedArticle(null)} className="flex-1 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-xl py-3 h-auto">
                  إغلاق
                </Button>
              </div>
            </div>}
        </DialogContent>
      </Dialog>
    </div>
    </PullToRefresh>;
};
export default News;