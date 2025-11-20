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
    setSelectedArticle(article);
    
    // If already translated, don't translate again
    if (article.translatedTitle) {
      return;
    }

    try {
      setTranslating(true);
      console.log("Translating article...");

      const { data, error } = await supabase.functions.invoke('translate-news', {
        body: {
          title: article.title,
          description: article.description,
          content: article.description // Using description as content for now
        }
      });

      if (error) {
        console.error("Translation error:", error);
        toast.error("فشل في ترجمة الخبر");
        return;
      }

      // Update the article with translations
      const updatedArticle = {
        ...article,
        translatedTitle: data.translatedTitle,
        translatedDescription: data.translatedDescription,
        translatedContent: data.translatedContent,
      };

      setSelectedArticle(updatedArticle);
      
      // Update in the articles list too
      setArticles(prev => 
        prev.map(a => a.url === article.url ? updatedArticle : a)
      );

      console.log("Translation completed");
    } catch (error) {
      console.error("Error:", error);
      toast.error("حدث خطأ أثناء ترجمة الخبر");
    } finally {
      setTranslating(false);
    }
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
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group">
              {article.urlToImage && (
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={article.urlToImage} 
                    alt={article.translatedTitle || article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800';
                    }}
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg line-clamp-2">
                  {article.translatedTitle || article.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 text-sm">
                  <Calendar className="h-3 w-3" />
                  {formatDate(article.publishedAt)}
                  <span className="mx-2">•</span>
                  {article.source.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                  {article.translatedDescription || article.description}
                </p>
                <Button 
                  onClick={() => translateAndShowArticle(article)}
                  variant="outline"
                  className="w-full"
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
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {translating ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  جاري الترجمة...
                </div>
              ) : (
                selectedArticle?.translatedTitle || selectedArticle?.title
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedArticle && (
            <div className="space-y-4">
              {selectedArticle.urlToImage && (
                <img 
                  src={selectedArticle.urlToImage} 
                  alt={selectedArticle.translatedTitle || selectedArticle.title}
                  className="w-full h-64 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800';
                  }}
                />
              )}
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {formatDate(selectedArticle.publishedAt)}
                <span className="mx-2">•</span>
                {selectedArticle.source.name}
              </div>

              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>
                  {selectedArticle.translatedContent || 
                   selectedArticle.translatedDescription || 
                   selectedArticle.description}
                </ReactMarkdown>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => window.open(selectedArticle.url, '_blank')}
                  variant="outline"
                  className="flex-1"
                >
                  <ExternalLink className="ml-2 h-4 w-4" />
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