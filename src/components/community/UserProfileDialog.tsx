import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User, Calendar, MessageCircle, Heart, Image as ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface UserProfile {
  user_id: string;
  nickname: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface UserPost {
  id: string;
  title: string;
  image_url: string | null;
  created_at: string;
}

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userEmail: string | null;
  onPostClick?: (postId: string) => void;
}

export function UserProfileDialog({ open, onOpenChange, userId, userEmail, onPostClick }: UserProfileDialogProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [stats, setStats] = useState({ posts: 0, likes: 0, comments: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && userId) {
      fetchUserData();
    }
  }, [open, userId]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, nickname, email, avatar_url, created_at')
        .eq('user_id', userId)
        .single();

      setProfile(profileData || { user_id: userId, nickname: null, email: userEmail, avatar_url: null, created_at: new Date().toISOString() });

      // Fetch user posts
      const { data: postsData } = await supabase
        .from('community_posts')
        .select('id, title, image_url, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(6);

      setPosts(postsData || []);

      // Fetch stats
      const { count: postsCount } = await supabase
        .from('community_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const { count: likesCount } = await supabase
        .from('community_likes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const { count: commentsCount } = await supabase
        .from('community_comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      setStats({
        posts: postsCount || 0,
        likes: likesCount || 0,
        comments: commentsCount || 0
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = () => {
    if (profile?.nickname) return profile.nickname;
    if (profile?.email) return profile.email.split('@')[0];
    if (userEmail) return userEmail.split('@')[0];
    return 'مستخدم';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-slate-900 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <User className="h-5 w-5 text-purple-400" />
            الملف الشخصي
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-4">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-white" />
                )}
              </div>
              <h3 className="text-xl font-bold text-white">{getDisplayName()}</h3>
              {profile?.created_at && (
                <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3" />
                  عضو منذ {format(new Date(profile.created_at), 'MMMM yyyy', { locale: ar })}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="p-3 text-center bg-slate-800/50 border-slate-700">
                <p className="text-2xl font-bold text-purple-400">{stats.posts}</p>
                <p className="text-xs text-slate-400">منشور</p>
              </Card>
              <Card className="p-3 text-center bg-slate-800/50 border-slate-700">
                <p className="text-2xl font-bold text-pink-400">{stats.likes}</p>
                <p className="text-xs text-slate-400">إعجاب</p>
              </Card>
              <Card className="p-3 text-center bg-slate-800/50 border-slate-700">
                <p className="text-2xl font-bold text-blue-400">{stats.comments}</p>
                <p className="text-xs text-slate-400">تعليق</p>
              </Card>
            </div>

            {/* Recent Posts */}
            {posts.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-3">أحدث المنشورات</h4>
                <div className="grid grid-cols-3 gap-2">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity bg-slate-800"
                      onClick={() => {
                        onOpenChange(false);
                        onPostClick?.(post.id);
                      }}
                    >
                      {post.image_url ? (
                        <img
                          src={post.image_url}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/50 to-blue-900/50">
                          <ImageIcon className="h-6 w-6 text-slate-600" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
