import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowRight, Loader2, ExternalLink, Calendar } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

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
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    checkAuthAndFetchNews();
  }, []);

  const checkAuthAndFetchNews = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
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

  const fetchNews = async () => {
    try {
      setLoading(true);
      console.log("Fetching financial news...");

      const { data, error } = await supabase.functions.invoke('fetch-financial-news');

      if (error) {
        console.error("Error fetching news:", error);
        toast.error("فشل في تحميل الأخبار");
        return;
      }

      console.log("News fetched:", data);
      setArticles(data.articles || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("حدث خطأ أثناء تحميل الأخبار");
    } finally {
      setLoading(false);
    }
  };

  const translateAndShowArticle = async (article: NewsArticle) => {
    // Articles are already in Arabic, just show them
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">جاري تحميل الأخبار...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">آخر أخبار الأسواق المالية</h1>
            <p className="text-muted-foreground">تابع أحدث الأخبار والتحديثات من عالم التداول والاستثمار</p>
          </div>
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة للرئيسية
          </Button>
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article, index) => (
            <Card 
              key={index} 
              className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group border-border/50 bg-card/50 backdrop-blur-sm"
            >
              {article.urlToImage && (
                <div className="relative h-56 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent z-10" />
                  <img 
                    src={article.urlToImage} 
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800';
                    }}
                  />
                </div>
              )}
              <CardHeader className="space-y-3">
                <CardTitle className="text-xl font-bold line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                  {article.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 text-xs">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  {formatDate(article.publishedAt)}
                  <span className="mx-1">•</span>
                  <span className="font-medium text-foreground/70">{article.source.name}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
                  {article.description}
                </p>
                <Button 
                  onClick={() => translateAndShowArticle(article)}
                  variant="default"
                  className="w-full group-hover:shadow-lg transition-shadow"
                >
                  عرض الخبر كاملاً
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {articles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">لا توجد أخبار متاحة حالياً</p>
            <Button onClick={fetchNews} className="mt-4">
              إعادة المحاولة
            </Button>
          </div>
        )}
      </div>

      {/* Article Details Dialog */}
      <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold leading-tight">
              {selectedArticle?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedArticle && (
            <div className="space-y-6">
              {selectedArticle.urlToImage && (
                <div className="relative h-80 overflow-hidden rounded-xl">
                  <img 
                    src={selectedArticle.urlToImage} 
                    alt={selectedArticle.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800';
                    }}
                  />
                </div>
              )}
              
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-primary" />
                  {formatDate(selectedArticle.publishedAt)}
                </div>
                <span className="text-muted-foreground">•</span>
                <span className="font-medium text-primary">{selectedArticle.source.name}</span>
              </div>

              <div className="prose prose-lg max-w-none dark:prose-invert leading-relaxed">
                <p className="text-lg text-foreground/90">
                  {selectedArticle.description}
                </p>
              </div>

              <div className="flex gap-3 pt-6 border-t">
                <Button
                  onClick={() => window.open(selectedArticle.url, '_blank')}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  المصدر الأصلي
                </Button>
                <Button
                  onClick={() => setSelectedArticle(null)}
                  className="flex-1"
                >
                  إغلاق
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default News;