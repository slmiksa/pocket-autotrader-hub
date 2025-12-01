import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Favorite {
  id: string;
  symbol: string;
  symbol_name_ar: string;
  symbol_name_en: string;
  category: string;
  created_at: string;
}

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const addFavorite = async (
    symbol: string,
    nameAr: string,
    nameEn: string,
    category: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('يجب تسجيل الدخول أولاً');
        return false;
      }

      const { error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: user.id,
          symbol,
          symbol_name_ar: nameAr,
          symbol_name_en: nameEn,
          category
        });

      if (error) {
        if (error.code === '23505') {
          toast.info('هذا السوق موجود بالفعل في المفضلة');
          return false;
        }
        throw error;
      }

      toast.success('تمت إضافته للمفضلة ⭐');
      await fetchFavorites();
      return true;
    } catch (error) {
      console.error('Error adding favorite:', error);
      toast.error('حدث خطأ أثناء الإضافة');
      return false;
    }
  };

  const removeFavorite = async (symbol: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('symbol', symbol);

      if (error) throw error;

      toast.success('تم إزالته من المفضلة');
      await fetchFavorites();
      return true;
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('حدث خطأ أثناء الإزالة');
      return false;
    }
  };

  const isFavorite = (symbol: string) => {
    return favorites.some(f => f.symbol === symbol);
  };

  useEffect(() => {
    fetchFavorites();

    const channel = supabase
      .channel('favorites_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_favorites' },
        () => fetchFavorites()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    isFavorite,
    refetch: fetchFavorites
  };
};
