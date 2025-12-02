import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SavedAnalysis {
  id: string;
  user_id: string;
  symbol: string;
  analysis_text: string;
  annotated_image_url: string;
  created_at: string;
}

export const useSavedAnalyses = () => {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalyses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('saved_chart_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnalyses((data || []) as SavedAnalysis[]);
    } catch (error) {
      console.error('Error fetching saved analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveAnalysis = async (
    symbol: string, 
    analysisText: string, 
    annotatedImageUrl: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('يجب تسجيل الدخول أولاً');
        return false;
      }

      const { error } = await supabase
        .from('saved_chart_analyses')
        .insert({
          user_id: user.id,
          symbol,
          analysis_text: analysisText,
          annotated_image_url: annotatedImageUrl
        });

      if (error) throw error;

      toast.success('✅ تم حفظ التحليل بنجاح');
      await fetchAnalyses();
      return true;
    } catch (error) {
      console.error('Error saving analysis:', error);
      toast.error('حدث خطأ أثناء حفظ التحليل');
      return false;
    }
  };

  const deleteAnalysis = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_chart_analyses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('تم حذف التحليل');
      await fetchAnalyses();
      return true;
    } catch (error) {
      console.error('Error deleting analysis:', error);
      toast.error('حدث خطأ أثناء الحذف');
      return false;
    }
  };

  useEffect(() => {
    fetchAnalyses();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('saved_analyses_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'saved_chart_analyses'
        },
        () => {
          fetchAnalyses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    analyses,
    loading,
    saveAnalysis,
    deleteAnalysis,
    refetch: fetchAnalyses
  };
};
