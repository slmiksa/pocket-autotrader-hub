import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Mail, Lock, User } from "lucide-react";
import { toast } from "sonner";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { InstallAppButton } from "@/components/InstallAppButton";
import authBackground from "@/assets/auth-background.jpg";

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkUser();
  }, [navigate]);

  const handleSignUp = async () => {
    if (!email || !password) {
      toast.error("يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }
    if (!nickname.trim()) {
      toast.error("يرجى إدخال اسم المستخدم (النك نيم)");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      if (error) throw error;
      if (data.user) {
        await supabase.from('profiles').update({
          nickname: nickname.trim()
        }).eq('user_id', data.user.id);
      }
      if (data.session) {
        navigate("/");
      } else {
        setEmail("");
        setPassword("");
        setNickname("");
      }
    } catch (error: any) {
      console.error("Error signing up:", error);
      toast.error(error.message || "فشل إنشاء الحساب");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      toast.error("يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      if (data.session) {
        navigate("/");
      }
    } catch (error: any) {
      console.error("Error signing in:", error);
      toast.error(error.message || "فشل تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen relative"
      style={{
        backgroundImage: `url(${authBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]" />
      
      <div className="relative z-10">
        <AnnouncementBanner />
      <div className="flex flex-col items-center justify-center p-4 min-h-[calc(100vh-56px)]">
        {/* Welcome Message */}
        <div className="text-center mb-6 max-w-md animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-3 animate-scale-in" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
            مرحباً بك عميلنا الجديد
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed animate-fade-in" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
            نتشرف بانضمامك إلى أفضل منصة ذكاء اصطناعي في الشرق الأوسط متخصصة في الأسهم والتوصيات
          </p>
        </div>

        <Card className="w-full max-w-md bg-slate-900/80 border-slate-800 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-sky-500 shadow-lg shadow-sky-400/20">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-white">توصيات الهوامير</CardTitle>
            <CardDescription className="text-slate-400">
              {isLogin ? "تسجيل الدخول للوصول إلى حسابك" : "إنشاء حساب جديد"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={isLogin ? "login" : "signup"} onValueChange={v => setIsLogin(v === "login")}>
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-800">
                <TabsTrigger value="login" className="data-[state=active]:bg-sky-400 data-[state=active]:text-white">
                  تسجيل الدخول
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-sky-400 data-[state=active]:text-white">
                  إنشاء حساب
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-login" className="flex items-center gap-2 text-slate-300">
                    <Mail className="h-4 w-4" />
                    البريد الإلكتروني
                  </Label>
                  <Input
                    id="email-login"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    onKeyPress={e => e.key === "Enter" && handleSignIn()}
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password-login" className="flex items-center gap-2 text-slate-300">
                    <Lock className="h-4 w-4" />
                    كلمة المرور
                  </Label>
                  <Input
                    id="password-login"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    onKeyPress={e => e.key === "Enter" && handleSignIn()}
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>

                <Button
                  onClick={handleSignIn}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 text-white"
                  size="lg"
                >
                  تسجيل الدخول
                </Button>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nickname-signup" className="flex items-center gap-2 text-slate-300">
                    <User className="h-4 w-4" />
                    اسم المستخدم (النك نيم)
                  </Label>
                  <Input
                    id="nickname-signup"
                    type="text"
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    placeholder="اسمك الذي سيظهر للآخرين"
                    maxLength={30}
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-signup" className="flex items-center gap-2 text-slate-300">
                    <Mail className="h-4 w-4" />
                    البريد الإلكتروني
                  </Label>
                  <Input
                    id="email-signup"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password-signup" className="flex items-center gap-2 text-slate-300">
                    <Lock className="h-4 w-4" />
                    كلمة المرور
                  </Label>
                  <Input
                    id="password-signup"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    onKeyPress={e => e.key === "Enter" && handleSignUp()}
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>

                <Button
                  onClick={handleSignUp}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 text-white"
                  size="lg"
                >
                  إنشاء حساب
                </Button>
              </TabsContent>
            </Tabs>

            {/* Install App Button */}
            <div className="mt-6 pt-4 border-t border-slate-800">
              <InstallAppButton
                variant="outline"
                fullWidth
                className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700"
              />
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
};

export default Auth;