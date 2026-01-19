import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Plus, Image as ImageIcon, Loader2, X, User, Trash2, Edit2, Heart, MessageCircle, Send, Flag, Sparkles, Users, Share2, Copy, Check, TrendingUp, Award, Flame, Clock, Star, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { UserProfileDialog } from "@/components/community/UserProfileDialog";
import { PullToRefresh } from "@/components/PullToRefresh";
interface CommunityPost {
  id: string;
  user_id: string;
  user_email: string | null;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
  user_nickname?: string | null;
}
interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  user_email: string | null;
  content: string;
  created_at: string;
  user_nickname?: string | null;
}
interface Like {
  id: string;
  post_id: string;
  user_id: string;
}
export default function Community() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // Report state
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  // Comments & Likes
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [postLikeCounts, setPostLikeCounts] = useState<Record<string, number>>({});
  const [postCommentCounts, setPostCommentCounts] = useState<Record<string, number>>({});

  // User profile dialog
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(null);

  // Nicknames & Avatars cache
  const [userNicknames, setUserNicknames] = useState<Record<string, string>>({});
  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({});

  // Handle direct post link
  useEffect(() => {
    const postId = searchParams.get('post');
    if (postId && posts.length > 0) {
      const post = posts.find(p => p.id === postId);
      if (post) {
        openPost(post);
      }
    }
  }, [searchParams, posts]);
  useEffect(() => {
    fetchPosts();
    checkUser();
  }, []);
  const checkUser = async () => {
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    setUser(user);
  };
  const fetchPosts = useCallback(async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('community_posts').select('*').order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setPosts(data || []);
      if (data && data.length > 0) {
        const postIds = data.map(p => p.id);
        const userIds = [...new Set(data.map(p => p.user_id))];

        // Fetch nicknames and avatars for all users
        const {
          data: profilesData
        } = await supabase.from('profiles').select('user_id, nickname, avatar_url').in('user_id', userIds);
        const nicknames: Record<string, string> = {};
        const avatars: Record<string, string> = {};
        profilesData?.forEach(p => {
          if (p.nickname) {
            nicknames[p.user_id] = p.nickname;
          }
          if (p.avatar_url) {
            avatars[p.user_id] = p.avatar_url;
          }
        });
        setUserNicknames(nicknames);
        setUserAvatars(avatars);
        const {
          data: likesData
        } = await supabase.from('community_likes').select('post_id').in('post_id', postIds);
        const likeCounts: Record<string, number> = {};
        likesData?.forEach(l => {
          likeCounts[l.post_id] = (likeCounts[l.post_id] || 0) + 1;
        });
        setPostLikeCounts(likeCounts);
        const {
          data: commentsData
        } = await supabase.from('community_comments').select('post_id').in('post_id', postIds);
        const commentCounts: Record<string, number> = {};
        commentsData?.forEach(c => {
          commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1;
        });
        setPostCommentCounts(commentCounts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('حدث خطأ في تحميل المنشورات');
    } finally {
      setLoading(false);
    }
  }, []);
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    await fetchPosts();
    toast.success('تم تحديث المنشورات');
  }, [fetchPosts]);
  const fetchPostDetails = async (postId: string) => {
    const {
      data: commentsData
    } = await supabase.from('community_comments').select('*').eq('post_id', postId).order('created_at', {
      ascending: true
    });
    setComments(commentsData || []);
    const {
      data: likesData
    } = await supabase.from('community_likes').select('*').eq('post_id', postId);
    setLikes(likesData || []);
  };
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };
  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) return null;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const {
        error: uploadError
      } = await supabase.storage.from('community-images').upload(fileName, file);
      if (uploadError) throw uploadError;
      const {
        data
      } = supabase.storage.from('community-images').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('حدث خطأ في رفع الصورة');
      return null;
    } finally {
      setUploading(false);
    }
  };
  const handleCreatePost = async () => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      navigate('/auth');
      return;
    }
    if (!title.trim() || !content.trim()) {
      toast.error('يرجى إدخال العنوان والمحتوى');
      return;
    }
    // Input length validation to prevent DoS/storage abuse
    if (title.trim().length > 200) {
      toast.error('العنوان طويل جداً (الحد الأقصى 200 حرف)');
      return;
    }
    if (content.trim().length > 5000) {
      toast.error('المحتوى طويل جداً (الحد الأقصى 5000 حرف)');
      return;
    }
    setCreating(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }
      const {
        error
      } = await supabase.from('community_posts').insert({
        user_id: user.id,
        user_email: user.email,
        title: title.trim(),
        content: content.trim(),
        image_url: imageUrl
      });
      if (error) throw error;
      toast.success('تم نشر المشاركة بنجاح');
      setShowCreateDialog(false);
      resetForm();
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('حدث خطأ في نشر المشاركة');
    } finally {
      setCreating(false);
    }
  };
  const resetForm = () => {
    setTitle("");
    setContent("");
    setImageFile(null);
    setImagePreview(null);
  };
  const openPost = async (post: CommunityPost) => {
    setSelectedPost(post);
    setShowPostDialog(true);
    await fetchPostDetails(post.id);
  };
  const handleDeletePost = async () => {
    if (!selectedPost || !user) return;
    if (selectedPost.user_id !== user.id) {
      toast.error('لا يمكنك حذف مشاركة غيرك');
      return;
    }
    setDeleting(true);
    try {
      if (selectedPost.image_url) {
        const imagePath = selectedPost.image_url.split('/community-images/')[1];
        if (imagePath) {
          await supabase.storage.from('community-images').remove([imagePath]);
        }
      }
      const {
        error
      } = await supabase.from('community_posts').delete().eq('id', selectedPost.id);
      if (error) throw error;
      toast.success('تم حذف المشاركة بنجاح');
      setShowPostDialog(false);
      setSelectedPost(null);
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('حدث خطأ في حذف المشاركة');
    } finally {
      setDeleting(false);
    }
  };
  const openEditDialog = () => {
    if (!selectedPost) return;
    setEditTitle(selectedPost.title);
    setEditContent(selectedPost.content);
    setShowEditDialog(true);
  };
  const handleUpdatePost = async () => {
    if (!selectedPost || !user) return;
    if (!editTitle.trim() || !editContent.trim()) {
      toast.error('يرجى إدخال العنوان والمحتوى');
      return;
    }
    setUpdating(true);
    try {
      const {
        error
      } = await supabase.from('community_posts').update({
        title: editTitle.trim(),
        content: editContent.trim(),
        updated_at: new Date().toISOString()
      }).eq('id', selectedPost.id);
      if (error) throw error;
      toast.success('تم تحديث المشاركة بنجاح');
      setShowEditDialog(false);
      setSelectedPost({
        ...selectedPost,
        title: editTitle.trim(),
        content: editContent.trim()
      });
      fetchPosts();
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('حدث خطأ في تحديث المشاركة');
    } finally {
      setUpdating(false);
    }
  };
  const handleLike = async () => {
    if (!user || !selectedPost) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }
    const existingLike = likes.find(l => l.user_id === user.id);
    try {
      if (existingLike) {
        await supabase.from('community_likes').delete().eq('id', existingLike.id);
        setLikes(likes.filter(l => l.id !== existingLike.id));
      } else {
        const {
          data,
          error
        } = await supabase.from('community_likes').insert({
          post_id: selectedPost.id,
          user_id: user.id
        }).select().single();
        if (error) throw error;
        setLikes([...likes, data]);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };
  const handleAddComment = async () => {
    if (!user || !selectedPost) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }
    if (!newComment.trim()) return;
    setSendingComment(true);
    try {
      const {
        data,
        error
      } = await supabase.from('community_comments').insert({
        post_id: selectedPost.id,
        user_id: user.id,
        user_email: user.email,
        content: newComment.trim()
      }).select().single();
      if (error) throw error;
      setComments([...comments, data]);
      setNewComment("");
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('حدث خطأ في إضافة التعليق');
    } finally {
      setSendingComment(false);
    }
  };
  const handleDeleteComment = async (commentId: string) => {
    try {
      await supabase.from('community_comments').delete().eq('id', commentId);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };
  const handleReportPost = async () => {
    if (!user || !selectedPost) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }
    if (!reportReason) {
      toast.error('يرجى اختيار سبب البلاغ');
      return;
    }
    setSubmittingReport(true);
    try {
      const {
        error
      } = await supabase.from('community_reports').insert({
        post_id: selectedPost.id,
        reporter_id: user.id,
        reason: reportReason,
        details: reportDetails.trim() || null
      });
      if (error) throw error;
      toast.success('تم إرسال البلاغ بنجاح');
      setShowReportDialog(false);
      setReportReason("");
      setReportDetails("");
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('حدث خطأ في إرسال البلاغ');
    } finally {
      setSubmittingReport(false);
    }
  };
  const handleSharePost = async () => {
    if (!selectedPost) return;
    const shareUrl = `${window.location.origin}/community?post=${selectedPost.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('تم نسخ رابط المشاركة');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error('فشل نسخ الرابط');
    }
  };
  const getUserDisplayName = (email: string | null, userId?: string) => {
    if (userId && userNicknames[userId]) return userNicknames[userId];
    if (!email) return 'مستخدم';
    return email.split('@')[0];
  };
  const openUserProfile = (userId: string, email: string | null) => {
    setSelectedUserId(userId);
    setSelectedUserEmail(email);
    setShowUserProfile(true);
  };
  const handlePostFromProfile = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      openPost(post);
    }
  };
  const isLiked = user && likes.some(l => l.user_id === user.id);

  // Stats
  const totalLikes = Object.values(postLikeCounts).reduce((sum, count) => sum + count, 0);
  const totalComments = Object.values(postCommentCounts).reduce((sum, count) => sum + count, 0);

  // Get trending post (most likes)
  const trendingPost = posts.length > 0 ? posts.reduce((max, post) => (postLikeCounts[post.id] || 0) > (postLikeCounts[max.id] || 0) ? post : max, posts[0]) : null;
  return <PullToRefresh onRefresh={handleRefresh} className="min-h-screen pt-[calc(env(safe-area-inset-top,0px)+88px)]">
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] animate-pulse" style={{
          animationDelay: '1s'
        }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-[120px] animate-pulse" style={{
          animationDelay: '2s'
        }} />
        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => <div key={i} className="absolute w-1 h-1 bg-purple-400/30 rounded-full animate-float" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${5 + Math.random() * 10}s`
          }} />)}
        </div>
      </div>

      {/* Hero Header */}
      <div className="relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-transparent" />
        <div className="container mx-auto px-4 py-8">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-slate-400 hover:text-white hover:bg-white/10 backdrop-blur-sm">
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button onClick={() => {
              if (!user) {
                toast.error('يجب تسجيل الدخول أولاً');
                navigate('/auth');
                return;
              }
              setShowCreateDialog(true);
            }} className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105">
              <Plus className="h-4 w-4" />
              مشاركة جديدة
            </Button>
          </div>

          {/* Hero Content */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 mb-6">
              <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
              <span className="text-sm text-purple-300">مجتمع نشط وحيوي</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                مجتمع المتداولين
              </span>
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              شارك أفكارك وتحليلاتك مع آلاف المتداولين وتعلم من تجاربهم
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            
            
            
            
          </div>

          {/* Trending Post Card */}
          {trendingPost && (postLikeCounts[trendingPost.id] || 0) > 0 && <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/30 p-4 mb-8 cursor-pointer group hover:border-amber-500/50 transition-all duration-300" onClick={() => openPost(trendingPost)}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl" />
              <div className="relative flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <Flame className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      الأكثر تفاعلاً
                    </Badge>
                  </div>
                  <h3 className="text-white font-semibold truncate group-hover:text-amber-200 transition-colors">{trendingPost.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3 text-pink-400" fill="currentColor" />
                      {postLikeCounts[trendingPost.id] || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3 text-blue-400" />
                      {postCommentCounts[trendingPost.id] || 0}
                    </span>
                  </div>
                </div>
                {trendingPost.image_url && <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={trendingPost.image_url} alt="" className="w-full h-full object-cover" />
                  </div>}
              </div>
            </div>}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 pb-8 relative z-10">
        {loading ? <div className="flex flex-col justify-center items-center py-20">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-purple-400 animate-pulse" />
              </div>
            </div>
            <p className="text-slate-400 mt-4 animate-pulse">جاري تحميل المشاركات...</p>
          </div> : posts.length === 0 ? <div className="text-center py-20">
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl rotate-6" />
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-3xl -rotate-6" />
              <div className="relative w-full h-full rounded-3xl bg-slate-800/50 border border-purple-500/30 flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="h-14 w-14 text-purple-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">لا توجد مشاركات بعد</h3>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">كن أول من يشارك تجربته وتحليلاته مع مجتمع المتداولين</p>
            <Button onClick={() => {
            if (!user) {
              toast.error('يجب تسجيل الدخول أولاً');
              navigate('/auth');
              return;
            }
            setShowCreateDialog(true);
          }} className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25 px-8 py-6 text-lg">
              <Zap className="h-5 w-5" />
              أنشئ أول مشاركة
            </Button>
          </div> : <>
            {/* Section Title */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Star className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">أحدث المشاركات</h2>
                <p className="text-sm text-slate-400">تصفح آخر مشاركات المجتمع</p>
              </div>
            </div>

            {/* Posts Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {posts.map((post, index) => <Card key={post.id} className="group overflow-hidden cursor-pointer bg-slate-900/50 border-slate-800/50 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-500 hover:-translate-y-1" onClick={() => openPost(post)} style={{
              animationDelay: `${index * 50}ms`
            }}>
                  <div className="aspect-square relative bg-slate-800 overflow-hidden">
                    {post.image_url ? <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /> : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/50 via-slate-800 to-blue-900/50">
                        <div className="text-center">
                          <ImageIcon className="h-10 w-10 text-slate-600 mx-auto mb-2" />
                          <span className="text-xs text-slate-500">بدون صورة</span>
                        </div>
                      </div>}
                    
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
                    
                    {/* Time Badge */}
                    <div className="absolute top-2 right-2">
                      <div className="bg-slate-950/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 border border-slate-700/50">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span className="text-slate-300 text-xs">
                          {formatDistanceToNow(new Date(post.created_at), {
                        locale: ar,
                        addSuffix: false
                      })}
                        </span>
                      </div>
                    </div>
                    
                    {/* Stats overlay */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {(postLikeCounts[post.id] || 0) > 0 && <div className="bg-pink-500/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 shadow-lg shadow-pink-500/30">
                          <Heart className="h-3 w-3 text-white" fill="currentColor" />
                          <span className="text-white text-xs font-bold">{postLikeCounts[post.id]}</span>
                        </div>}
                      {(postCommentCounts[post.id] || 0) > 0 && <div className="bg-blue-500/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 shadow-lg shadow-blue-500/30">
                          <MessageCircle className="h-3 w-3 text-white" />
                          <span className="text-white text-xs font-bold">{postCommentCounts[post.id]}</span>
                        </div>}
                    </div>
                    
                    {/* Bottom Info */}
                    <div className="absolute inset-x-0 bottom-0 p-3">
                      <h3 className="text-white font-bold text-sm line-clamp-2 mb-2 group-hover:text-purple-200 transition-colors">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={e => {
                    e.stopPropagation();
                    openUserProfile(post.user_id, post.user_email);
                  }}>
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center ring-2 ring-purple-500/30">
                          {userAvatars[post.user_id] ? <img src={userAvatars[post.user_id]} alt="" className="w-full h-full object-cover" /> : <User className="h-3 w-3 text-white" />}
                        </div>
                        <p className="text-slate-300 text-xs font-medium truncate flex-1">
                          {getUserDisplayName(post.user_email, post.user_id)}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>)}
            </div>
          </>}
      </div>

      {/* Create Post Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog} modal={true}>
        <DialogContent className="max-w-lg bg-slate-900 border-slate-800 z-[100]">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              مشاركة جديدة
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              شارك تحليلاتك وأفكارك مع مجتمع المتداولين
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input 
              placeholder="العنوان" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              maxLength={100} 
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500" 
            />
            <Textarea 
              placeholder="اكتب محتوى مشاركتك هنا..." 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              rows={5} 
              maxLength={2000} 
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500 resize-none" 
            />
            <div>
              {imagePreview ? (
                <div className="relative rounded-lg overflow-hidden">
                  <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                  <Button 
                    size="icon" 
                    variant="destructive" 
                    className="absolute top-2 left-2 h-8 w-8" 
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:bg-slate-800/50 hover:border-purple-500/50 transition-all">
                  <ImageIcon className="h-8 w-8 text-slate-500 mb-2" />
                  <span className="text-sm text-slate-500">اضغط لإضافة صورة</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              )}
            </div>
            <Button 
              onClick={handleCreatePost} 
              disabled={creating || uploading || !title.trim() || !content.trim()} 
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {creating || uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  {uploading ? 'جاري رفع الصورة...' : 'جاري النشر...'}
                </>
              ) : 'نشر المشاركة'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Post Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-blue-400" />
              تعديل المشاركة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="العنوان" value={editTitle} onChange={e => setEditTitle(e.target.value)} maxLength={100} className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500" />
            <Textarea placeholder="اكتب محتوى مشاركتك هنا..." value={editContent} onChange={e => setEditContent(e.target.value)} rows={5} maxLength={2000} className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500 resize-none" />
            <Button onClick={handleUpdatePost} disabled={updating || !editTitle.trim() || !editContent.trim()} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              {updating ? <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري التحديث...
                </> : 'تحديث المشاركة'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Flag className="h-5 w-5 text-red-400" />
              الإبلاغ عن المشاركة
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              سيتم مراجعة البلاغ من قبل الإدارة
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">سبب البلاغ</label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="اختر السبب" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="spam">محتوى مزعج (سبام)</SelectItem>
                  <SelectItem value="inappropriate">محتوى غير لائق</SelectItem>
                  <SelectItem value="harassment">تحرش أو إساءة</SelectItem>
                  <SelectItem value="misinformation">معلومات مضللة</SelectItem>
                  <SelectItem value="scam">احتيال أو نصب</SelectItem>
                  <SelectItem value="other">سبب آخر</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">تفاصيل إضافية (اختياري)</label>
              <Textarea placeholder="اكتب تفاصيل إضافية..." value={reportDetails} onChange={e => setReportDetails(e.target.value)} rows={3} maxLength={500} className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-red-500 resize-none" />
            </div>
            <Button onClick={handleReportPost} disabled={submittingReport || !reportReason} className="w-full bg-red-600 hover:bg-red-700">
              {submittingReport ? <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري الإرسال...
                </> : <>
                  <Flag className="h-4 w-4 ml-2" />
                  إرسال البلاغ
                </>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Post Dialog */}
      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-800">
          {selectedPost && <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => openUserProfile(selectedPost.user_id, selectedPost.user_email)}>
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      {userAvatars[selectedPost.user_id] ? <img src={userAvatars[selectedPost.user_id]} alt="" className="w-full h-full object-cover" /> : <User className="h-6 w-6 text-white" />}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{getUserDisplayName(selectedPost.user_email, selectedPost.user_id)}</p>
                      <p className="text-xs text-slate-400">
                        {format(new Date(selectedPost.created_at), 'dd MMMM yyyy - HH:mm', {
                        locale: ar
                      })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {user && selectedPost.user_id !== user.id && <Button variant="ghost" size="icon" onClick={() => setShowReportDialog(true)} className="text-slate-400 hover:text-red-400 hover:bg-red-500/10">
                        <Flag className="h-4 w-4" />
                      </Button>}
                    {user && selectedPost.user_id === user.id && <>
                        <Button variant="ghost" size="icon" onClick={openEditDialog} className="text-slate-400 hover:text-blue-400 hover:bg-blue-500/10">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleDeletePost} disabled={deleting} className="text-slate-400 hover:text-red-400 hover:bg-red-500/10">
                          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </>}
                  </div>
                </div>
              </DialogHeader>
              
              <h2 className="text-xl font-bold text-white">{selectedPost.title}</h2>
              
              {selectedPost.image_url && <div className="rounded-xl overflow-hidden">
                  <img src={selectedPost.image_url} alt={selectedPost.title} className="w-full max-h-96 object-contain bg-slate-800" />
                </div>}
              
              <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                {selectedPost.content}
              </p>

              {/* Like & Comment Actions */}
              <div className="flex items-center gap-4 pt-4 border-t border-slate-800">
                <Button variant={isLiked ? "default" : "outline"} size="sm" onClick={handleLike} className={`gap-2 ${isLiked ? 'bg-pink-600 hover:bg-pink-700 border-pink-600' : 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-pink-400'}`}>
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{likes.length}</span>
                </Button>
                <div className="flex items-center gap-2 text-slate-400">
                  <MessageCircle className="h-4 w-4" />
                  <span>{comments.length} تعليق</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleSharePost} className="gap-2 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-green-400 mr-auto">
                  {copied ? <Check className="h-4 w-4 text-green-400" /> : <Share2 className="h-4 w-4" />}
                  <span>{copied ? 'تم النسخ' : 'مشاركة'}</span>
                </Button>
              </div>

              {/* Comments Section */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-blue-400" />
                  التعليقات
                </h4>
                
                {/* Add Comment */}
                {user && <div className="flex gap-2">
                    <Input placeholder="اكتب تعليقاً..." value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAddComment()} className="flex-1 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500" />
                    <Button size="icon" onClick={handleAddComment} disabled={sendingComment || !newComment.trim()} className="bg-purple-600 hover:bg-purple-700">
                      {sendingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>}

                {/* Comments List */}
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {comments.length === 0 ? <p className="text-center text-slate-500 py-4">لا توجد تعليقات بعد</p> : comments.map(comment => <div key={comment.id} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => openUserProfile(comment.user_id, comment.user_email)}>
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                              {userAvatars[comment.user_id] ? <img src={userAvatars[comment.user_id]} alt="" className="w-full h-full object-cover" /> : <User className="h-3 w-3 text-white" />}
                            </div>
                            <span className="font-medium text-sm text-white">
                              {getUserDisplayName(comment.user_email, comment.user_id)}
                            </span>
                            <span className="text-xs text-slate-500">
                              {format(new Date(comment.created_at), 'dd/MM HH:mm', {
                          locale: ar
                        })}
                            </span>
                          </div>
                          {user && comment.user_id === user.id && <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:text-red-400" onClick={() => handleDeleteComment(comment.id)}>
                              <X className="h-3 w-3" />
                            </Button>}
                        </div>
                        <p className="text-sm text-slate-300">{comment.content}</p>
                      </div>)}
                </div>
              </div>
            </div>}
        </DialogContent>
      </Dialog>
      {/* User Profile Dialog */}
      <UserProfileDialog open={showUserProfile} onOpenChange={setShowUserProfile} userId={selectedUserId} userEmail={selectedUserEmail} onPostClick={handlePostFromProfile} />
    </div>
    </PullToRefresh>;
}