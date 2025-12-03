import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowRight, Plus, Image as ImageIcon, Loader2, X, User, Trash2, Edit2, Heart, MessageCircle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface CommunityPost {
  id: string;
  user_id: string;
  user_email: string | null;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  user_email: string | null;
  content: string;
  created_at: string;
}

interface Like {
  id: string;
  post_id: string;
  user_id: string;
}

export default function Community() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  
  // Comments & Likes
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [postLikeCounts, setPostLikeCounts] = useState<Record<string, number>>({});
  const [postCommentCounts, setPostCommentCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchPosts();
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
      
      // Fetch likes and comments counts
      if (data && data.length > 0) {
        const postIds = data.map(p => p.id);
        
        // Get likes counts
        const { data: likesData } = await supabase
          .from('community_likes')
          .select('post_id')
          .in('post_id', postIds);
        
        const likeCounts: Record<string, number> = {};
        likesData?.forEach(l => {
          likeCounts[l.post_id] = (likeCounts[l.post_id] || 0) + 1;
        });
        setPostLikeCounts(likeCounts);
        
        // Get comments counts
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
  };

  const fetchPostDetails = async (postId: string) => {
    // Fetch comments
    const { data: commentsData } = await supabase
      .from('community_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    
    setComments(commentsData || []);
    
    // Fetch likes
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
      
      // Update local state
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
        // Unlike
        await supabase
          .from('community_likes')
          .delete()
          .eq('id', existingLike.id);
        
        setLikes(likes.filter(l => l.id !== existingLike.id));
      } else {
        // Like
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

  const getUserDisplayName = (email: string | null) => {
    if (!email) return 'مستخدم';
    return email.split('@')[0];
  };

  const isLiked = user && likes.some(l => l.user_id === user.id);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">المجتمع</h1>
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
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد مشاركات بعد</h3>
            <p className="text-muted-foreground mb-4">كن أول من يشارك في المجتمع</p>
            <Button
              onClick={() => {
                if (!user) {
                  toast.error('يجب تسجيل الدخول أولاً');
                  navigate('/auth');
                  return;
                }
                setShowCreateDialog(true);
              }}
              className="gap-2"
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
                className="overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all group"
                onClick={() => openPost(post)}
              >
                <div className="aspect-square relative bg-muted">
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <h3 className="text-white font-semibold text-sm line-clamp-1">{post.title}</h3>
                    <p className="text-white/70 text-xs">{getUserDisplayName(post.user_email)}</p>
                  </div>
                  {/* Stats overlay */}
                  <div className="absolute top-2 left-2 flex gap-2">
                    {(postLikeCounts[post.id] || 0) > 0 && (
                      <div className="bg-black/60 rounded-full px-2 py-1 flex items-center gap-1">
                        <Heart className="h-3 w-3 text-red-400" fill="currentColor" />
                        <span className="text-white text-xs">{postLikeCounts[post.id]}</span>
                      </div>
                    )}
                    {(postCommentCounts[post.id] || 0) > 0 && (
                      <div className="bg-black/60 rounded-full px-2 py-1 flex items-center gap-1">
                        <MessageCircle className="h-3 w-3 text-blue-400" />
                        <span className="text-white text-xs">{postCommentCounts[post.id]}</span>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>مشاركة جديدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="العنوان"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
            <Textarea
              placeholder="اكتب محتوى مشاركتك هنا..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              maxLength={2000}
            />
            <div>
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
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
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">اضغط لإضافة صورة</span>
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
              className="w-full"
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>تعديل المشاركة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="العنوان"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              maxLength={100}
            />
            <Textarea
              placeholder="اكتب محتوى مشاركتك هنا..."
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={5}
              maxLength={2000}
            />
            <Button
              onClick={handleUpdatePost}
              disabled={updating || !editTitle.trim() || !editContent.trim()}
              className="w-full"
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

      {/* View Post Dialog */}
      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedPost && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{getUserDisplayName(selectedPost.user_email)}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(selectedPost.created_at), 'dd MMMM yyyy - HH:mm', { locale: ar })}
                      </p>
                    </div>
                  </div>
                  {user && selectedPost.user_id === user.id && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={openEditDialog}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={handleDeletePost}
                        disabled={deleting}
                      >
                        {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  )}
                </div>
              </DialogHeader>
              
              <h2 className="text-xl font-bold text-foreground">{selectedPost.title}</h2>
              
              {selectedPost.image_url && (
                <img
                  src={selectedPost.image_url}
                  alt={selectedPost.title}
                  className="w-full max-h-96 object-contain rounded-lg bg-muted"
                />
              )}
              
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                {selectedPost.content}
              </p>

              {/* Like & Comment Actions */}
              <div className="flex items-center gap-4 pt-4 border-t border-border">
                <Button
                  variant={isLiked ? "default" : "outline"}
                  size="sm"
                  onClick={handleLike}
                  className="gap-2"
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{likes.length}</span>
                </Button>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MessageCircle className="h-4 w-4" />
                  <span>{comments.length} تعليق</span>
                </div>
              </div>

              {/* Comments Section */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h4 className="font-semibold text-foreground">التعليقات</h4>
                
                {/* Add Comment */}
                {user && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="اكتب تعليقاً..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      onClick={handleAddComment}
                      disabled={sendingComment || !newComment.trim()}
                    >
                      {sendingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                )}

                {/* Comments List */}
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {comments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">لا توجد تعليقات بعد</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-foreground">
                              {getUserDisplayName(comment.user_email)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(comment.created_at), 'dd/MM HH:mm', { locale: ar })}
                            </span>
                          </div>
                          {user && comment.user_id === user.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <p className="text-sm text-foreground">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
