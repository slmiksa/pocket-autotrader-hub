import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Plus, Image as ImageIcon, Loader2, X, User, Trash2, Edit2, Heart, MessageCircle, Send, Flag, Sparkles, Users, Share2, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
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
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchPosts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
      
      if (data && data.length > 0) {
        const postIds = data.map(p => p.id);
        const userIds = [...new Set(data.map(p => p.user_id))];
        
        // Fetch nicknames and avatars for all users
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, nickname, avatar_url')
          .in('user_id', userIds);
        
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
        
        const { data: likesData } = await supabase
          .from('community_likes')
          .select('post_id')
          .in('post_id', postIds);
        
        const likeCounts: Record<string, number> = {};
        likesData?.forEach(l => {
          likeCounts[l.post_id] = (likeCounts[l.post_id] || 0) + 1;
        });
        setPostLikeCounts(likeCounts);
        
        const { data: commentsData } = await supabase
          .from('community_comments')
          .select('post_id')
          .in('post_id', postIds);
        
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
    const { data: commentsData } = await supabase
      .from('community_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    
    setComments(commentsData || []);
    
    const { data: likesData } = await supabase
      .from('community_likes')
      .select('*')
      .eq('post_id', postId);
    
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
      
      const { error: uploadError } = await supabase.storage
        .from('community-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('community-images')
        .getPublicUrl(fileName);

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

    setCreating(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const { error } = await supabase
        .from('community_posts')
        .insert({
          user_id: user.id,
          user_email: user.email,
          title: title.trim(),
          content: content.trim(),
          image_url: imageUrl,
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

      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', selectedPost.id);

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
      const { error } = await supabase
        .from('community_posts')
        .update({
          title: editTitle.trim(),
          content: editContent.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedPost.id);

      if (error) throw error;

      toast.success('تم تحديث المشاركة بنجاح');
      setShowEditDialog(false);
      
      setSelectedPost({
        ...selectedPost,
        title: editTitle.trim(),
        content: editContent.trim(),
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
        await supabase
          .from('community_likes')
          .delete()
          .eq('id', existingLike.id);
        
        setLikes(likes.filter(l => l.id !== existingLike.id));
      } else {
        const { data, error } = await supabase
          .from('community_likes')
          .insert({
            post_id: selectedPost.id,
            user_id: user.id,
          })
          .select()
          .single();

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
      const { data, error } = await supabase
        .from('community_comments')
        .insert({
          post_id: selectedPost.id,
          user_id: user.id,
          user_email: user.email,
          content: newComment.trim(),
        })
        .select()
        .single();

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
      await supabase
        .from('community_comments')
        .delete()
        .eq('id', commentId);
      
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
      const { error } = await supabase
        .from('community_reports')
        .insert({
          post_id: selectedPost.id,
          reporter_id: user.id,
          reason: reportReason,
          details: reportDetails.trim() || null,
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

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen pt-[calc(env(safe-area-inset-top,0px)+48px)]">
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Page Header - Part of scrollable content */}
      <div className="bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50 relative z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-400" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                مجتمع المتداولين
              </h1>
            </div>
            <Button
              size="icon"
              onClick={() => {
                if (!user) {
                  toast.error('يجب تسجيل الدخول أولاً');
                  navigate('/auth');
                  return;
                }
                setShowCreateDialog(true);
              }}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/25"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 relative z-10">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="relative">
              <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
              <div className="absolute inset-0 h-10 w-10 rounded-full border-2 border-purple-500/20 animate-ping" />
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-purple-500/30">
              <Sparkles className="h-12 w-12 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">لا توجد مشاركات بعد</h3>
            <p className="text-slate-400 mb-6">كن أول من يشارك تجربته مع المجتمع</p>
            <Button
              onClick={() => {
                if (!user) {
                  toast.error('يجب تسجيل الدخول أولاً');
                  navigate('/auth');
                  return;
                }
                setShowCreateDialog(true);
              }}
              className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Plus className="h-4 w-4" />
              إضافة مشاركة
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {posts.map((post) => (
              <Card
                key={post.id}
                className="overflow-hidden cursor-pointer group bg-slate-900/50 border-slate-800/50 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300"
                onClick={() => openPost(post)}
              >
                <div className="aspect-square relative bg-slate-800">
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/50 to-blue-900/50">
                      <ImageIcon className="h-12 w-12 text-slate-600" />
                    </div>
                  )}
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {/* Bottom Info */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 via-slate-950/80 to-transparent p-3">
                    <h3 className="text-white font-semibold text-sm line-clamp-1 mb-1">{post.title}</h3>
                    <div 
                      className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        openUserProfile(post.user_id, post.user_email);
                      }}
                    >
                      <div className="w-5 h-5 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        {userAvatars[post.user_id] ? (
                          <img src={userAvatars[post.user_id]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <p className="text-slate-400 text-xs">{getUserDisplayName(post.user_email, post.user_id)}</p>
                    </div>
                  </div>
                  {/* Stats overlay */}
                  <div className="absolute top-2 left-2 flex gap-2">
                    {(postLikeCounts[post.id] || 0) > 0 && (
                      <div className="bg-slate-950/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 border border-slate-700/50">
                        <Heart className="h-3 w-3 text-pink-500" fill="currentColor" />
                        <span className="text-white text-xs font-medium">{postLikeCounts[post.id]}</span>
                      </div>
                    )}
                    {(postCommentCounts[post.id] || 0) > 0 && (
                      <div className="bg-slate-950/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 border border-slate-700/50">
                        <MessageCircle className="h-3 w-3 text-blue-400" />
                        <span className="text-white text-xs font-medium">{postCommentCounts[post.id]}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Post Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              مشاركة جديدة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="العنوان"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500"
            />
            <Textarea
              placeholder="اكتب محتوى مشاركتك هنا..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              maxLength={2000}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500 resize-none"
            />
            <div>
              {imagePreview ? (
                <div className="relative rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
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
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
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
              ) : (
                'نشر المشاركة'
              )}
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
            <Input
              placeholder="العنوان"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              maxLength={100}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500"
            />
            <Textarea
              placeholder="اكتب محتوى مشاركتك هنا..."
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={5}
              maxLength={2000}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500 resize-none"
            />
            <Button
              onClick={handleUpdatePost}
              disabled={updating || !editTitle.trim() || !editContent.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري التحديث...
                </>
              ) : (
                'تحديث المشاركة'
              )}
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
              <Textarea
                placeholder="اكتب تفاصيل إضافية..."
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                rows={3}
                maxLength={500}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-red-500 resize-none"
              />
            </div>
            <Button
              onClick={handleReportPost}
              disabled={submittingReport || !reportReason}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {submittingReport ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Flag className="h-4 w-4 ml-2" />
                  إرسال البلاغ
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Post Dialog */}
      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-800">
          {selectedPost && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => openUserProfile(selectedPost.user_id, selectedPost.user_email)}
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      {userAvatars[selectedPost.user_id] ? (
                        <img src={userAvatars[selectedPost.user_id]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{getUserDisplayName(selectedPost.user_email, selectedPost.user_id)}</p>
                      <p className="text-xs text-slate-400">
                        {format(new Date(selectedPost.created_at), 'dd MMMM yyyy - HH:mm', { locale: ar })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {user && selectedPost.user_id !== user.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowReportDialog(true)}
                        className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Flag className="h-4 w-4" />
                      </Button>
                    )}
                    {user && selectedPost.user_id === user.id && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={openEditDialog}
                          className="text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleDeletePost}
                          disabled={deleting}
                          className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                        >
                          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </DialogHeader>
              
              <h2 className="text-xl font-bold text-white">{selectedPost.title}</h2>
              
              {selectedPost.image_url && (
                <div className="rounded-xl overflow-hidden">
                  <img
                    src={selectedPost.image_url}
                    alt={selectedPost.title}
                    className="w-full max-h-96 object-contain bg-slate-800"
                  />
                </div>
              )}
              
              <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                {selectedPost.content}
              </p>

              {/* Like & Comment Actions */}
              <div className="flex items-center gap-4 pt-4 border-t border-slate-800">
                <Button
                  variant={isLiked ? "default" : "outline"}
                  size="sm"
                  onClick={handleLike}
                  className={`gap-2 ${isLiked ? 'bg-pink-600 hover:bg-pink-700 border-pink-600' : 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-pink-400'}`}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{likes.length}</span>
                </Button>
                <div className="flex items-center gap-2 text-slate-400">
                  <MessageCircle className="h-4 w-4" />
                  <span>{comments.length} تعليق</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSharePost}
                  className="gap-2 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-green-400 mr-auto"
                >
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
                {user && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="اكتب تعليقاً..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
                      className="flex-1 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500"
                    />
                    <Button
                      size="icon"
                      onClick={handleAddComment}
                      disabled={sendingComment || !newComment.trim()}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {sendingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                )}

                {/* Comments List */}
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {comments.length === 0 ? (
                    <p className="text-center text-slate-500 py-4">لا توجد تعليقات بعد</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                          <div 
                            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => openUserProfile(comment.user_id, comment.user_email)}
                          >
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                              {userAvatars[comment.user_id] ? (
                                <img src={userAvatars[comment.user_id]} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User className="h-3 w-3 text-white" />
                              )}
                            </div>
                            <span className="font-medium text-sm text-white">
                              {getUserDisplayName(comment.user_email, comment.user_id)}
                            </span>
                            <span className="text-xs text-slate-500">
                              {format(new Date(comment.created_at), 'dd/MM HH:mm', { locale: ar })}
                            </span>
                          </div>
                          {user && comment.user_id === user.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-slate-500 hover:text-red-400"
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <p className="text-sm text-slate-300">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* User Profile Dialog */}
      <UserProfileDialog
        open={showUserProfile}
        onOpenChange={setShowUserProfile}
        userId={selectedUserId}
        userEmail={selectedUserEmail}
        onPostClick={handlePostFromProfile}
      />
    </div>
    </PullToRefresh>
  );
}
