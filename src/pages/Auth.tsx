import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { PasswordStrength, isPasswordStrong } from "@/components/ui/password-strength";
import { TrendingUp, Mail, Lock, User, Shield, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { InstallAppButton } from "@/components/InstallAppButton";
import { useEmail } from "@/hooks/useEmail";
import authBackground from "@/assets/auth-background.jpg";

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const { sendRegistrationEmail } = useEmail();

  // 2FA States
  const [show2FA, setShow2FA] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [pendingSession, setPendingSession] = useState<any>(null);
  const [resendTimer, setResendTimer] = useState(0);

  // Forgot Password States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  // Password Recovery States
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false);
  const showPasswordRecoveryRef = useRef(false);
  const isRecoveryFlowRef = useRef(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  useEffect(() => {
    // Decide recovery intent synchronously (before any redirects)
    const urlParams = new URLSearchParams(window.location.search);
    const typeFromSearch = urlParams.get("type");

    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const tokenType = hashParams.get("type");
    const errorDescription = hashParams.get("error_description");

    const isRecoveryIntent = typeFromSearch === "recovery" || (accessToken && tokenType === "recovery");
    isRecoveryFlowRef.current = Boolean(isRecoveryIntent);

    if (errorDescription) {
      toast.error("الرابط منتهي الصلاحية أو غير صالح. يرجى طلب رابط جديد.");
      window.history.replaceState({}, document.title, "/auth");
      return;
    }

    // Listen for auth state changes including PASSWORD_RECOVERY
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth event:", event);

      if (event === "PASSWORD_RECOVERY") {
        showPasswordRecoveryRef.current = true;
        setShowPasswordRecovery(true);
        return;
      }

      // IMPORTANT: During recovery flow, do NOT redirect to home on SIGNED_IN
      if (event === "SIGNED_IN" && !isRecoveryFlowRef.current && !showPasswordRecoveryRef.current) {
        navigate("/");
      }

      // If user signs out during recovery, reset flags
      if (event === "SIGNED_OUT") {
        showPasswordRecoveryRef.current = false;
        isRecoveryFlowRef.current = false;
      }
    });

    // If Supabase sent tokens in hash, establish session and show recovery UI
    if (accessToken && tokenType === "recovery") {
      const refreshToken = hashParams.get("refresh_token");

      if (refreshToken) {
        // Mark recovery *before* setting session to prevent redirects
        isRecoveryFlowRef.current = true;
        showPasswordRecoveryRef.current = true;

        supabase.auth
          .setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          .then(({ error }) => {
            if (!error) {
              setShowPasswordRecovery(true);
              window.history.replaceState({}, document.title, "/auth?type=recovery");
            } else {
              toast.error("فشل في تحميل جلسة الاستعادة");
            }
          });
      }
    } else if (typeFromSearch === "recovery") {
      isRecoveryFlowRef.current = true;
      // Check if we already have a session for recovery
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          showPasswordRecoveryRef.current = true;
          setShowPasswordRecovery(true);
        } else {
          toast.error("الجلسة منتهية. يرجى طلب رابط استعادة جديد.");
          setShowForgotPassword(true);
        }
      });
    } else {
      // Normal auth check
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          navigate("/");
        }
      });
    }

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

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
        
        sendRegistrationEmail(email, nickname.trim());
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

  const send2FACode = async (userId: string) => {
    try {
      const response = await supabase.functions.invoke('send-2fa-code', {
        body: { email, userId }
      });
      
      if (response.error) {
        throw new Error(response.error.message || "فشل في إرسال رمز التحقق");
      }
      
      toast.success("تم إرسال رمز التحقق إلى بريدك الإلكتروني");
      setResendTimer(60);
    } catch (error: any) {
      console.error("Error sending 2FA code:", error);
      toast.error(error.message || "فشل في إرسال رمز التحقق");
      throw error;
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
        // Check if user is banned
        const { data: banData } = await supabase
          .from("banned_users")
          .select("reason")
          .eq("user_id", data.user.id)
          .single();
        
        if (banData) {
          // User is banned - sign them out and show message
          await supabase.auth.signOut();
          toast.error(
            <div className="text-right">
              <p className="font-bold text-red-500 mb-2">تم حظر حسابك</p>
              <p className="text-sm mb-2">السبب: {banData.reason}</p>
              <a 
                href="https://wa.me/00966575594911?text=السلام%20عليكم،%20أحتاج%20مساعدة%20بخصوص%20حظر%20حسابي" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-green-500 underline text-sm"
              >
                تواصل مع الدعم الفني
              </a>
            </div>,
            { duration: 10000 }
          );
          setLoading(false);
          return;
        }
        
        // 2FA temporarily disabled - direct login
        toast.success("تم تسجيل الدخول بنجاح!");
        navigate("/");
        
        /* 2FA CODE - TEMPORARILY DISABLED
        // Store session and send 2FA code
        setPendingSession(data.session);
        await send2FACode(data.user.id);
        
        // Sign out immediately - user needs to verify 2FA first
        await supabase.auth.signOut();
        
        setShow2FA(true);
        */
      }
    } catch (error: any) {
      console.error("Error signing in:", error);
      toast.error(error.message || "فشل تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (otpCode.length !== 6) {
      toast.error("يرجى إدخال رمز التحقق المكون من 6 أرقام");
      return;
    }
    
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('verify-2fa-code', {
        body: { email, code: otpCode }
      });
      
      if (response.error || !response.data?.valid) {
        toast.error(response.data?.error || "رمز التحقق غير صحيح");
        setLoading(false);
        return;
      }
      
      // Re-authenticate and complete login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      toast.success("تم تسجيل الدخول بنجاح!");
      navigate("/");
    } catch (error: any) {
      console.error("Error verifying 2FA:", error);
      toast.error(error.message || "فشل التحقق");
    } finally {
      setLoading(false);
    }
  };

  const handleResend2FA = async () => {
    if (resendTimer > 0) return;
    
    setLoading(true);
    try {
      // Need to re-authenticate to get user ID
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      await send2FACode(data.user.id);
      await supabase.auth.signOut();
      setOtpCode("");
    } catch (error: any) {
      console.error("Error resending 2FA:", error);
      toast.error(error.message || "فشل في إعادة إرسال الرمز");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setShow2FA(false);
    setOtpCode("");
    setPendingSession(null);
    setResendTimer(0);
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      toast.error("يرجى إدخال البريد الإلكتروني");
      return;
    }

    setForgotLoading(true);
    try {
      // Use custom edge function for better email template
      const { data, error } = await supabase.functions.invoke('request-password-reset', {
        body: { email: forgotEmail }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(data?.message || "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني");
      setShowForgotPassword(false);
      setForgotEmail("");
    } catch (error: any) {
      console.error("Error sending reset email:", error);
      toast.error(error.message || "فشل إرسال رابط إعادة تعيين كلمة المرور");
    } finally {
      setForgotLoading(false);
    }
  };

  const handlePasswordRecovery = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("يرجى إدخال كلمة المرور وتأكيدها");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("كلمات المرور غير متطابقة");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    setRecoveryLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success("تم تغيير كلمة المرور بنجاح! جاري تحويلك...");
      
      // Clear URL params
      window.history.replaceState({}, document.title, '/auth');
      
      setTimeout(() => {
        setShowPasswordRecovery(false);
        setNewPassword("");
        setConfirmPassword("");
        navigate("/");
      }, 1500);
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast.error(error.message || "فشل تغيير كلمة المرور");
    } finally {
      setRecoveryLoading(false);
    }
  };

  // Password Recovery Screen (coming from email link)
  if (showPasswordRecovery) {
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
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]" />
        
        <div className="relative z-10">
          <AnnouncementBanner />
          <div className="flex flex-col items-center justify-center p-4 min-h-[calc(100vh-56px)]">
            <Card className="w-full max-w-md bg-slate-900/80 border-slate-800 backdrop-blur-xl">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-lg shadow-emerald-400/20">
                  <Lock className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-white">إنشاء كلمة مرور جديدة</CardTitle>
                <CardDescription className="text-slate-400">
                  أدخل كلمة المرور الجديدة لحسابك
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="flex items-center gap-2 text-slate-300">
                    <Lock className="h-4 w-4" />
                    كلمة المرور الجديدة
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>

                <PasswordStrength password={newPassword} />

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="flex items-center gap-2 text-slate-300">
                    <Lock className="h-4 w-4" />
                    تأكيد كلمة المرور
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    onKeyPress={(e) => e.key === "Enter" && handlePasswordRecovery()}
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>

                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-sm text-red-400">كلمات المرور غير متطابقة</p>
                )}

                <Button
                  onClick={handlePasswordRecovery}
                  disabled={recoveryLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword || !isPasswordStrong(newPassword)}
                  className="w-full bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white"
                  size="lg"
                >
                  {recoveryLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "تغيير كلمة المرور"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Forgot Password Screen
  if (showForgotPassword) {
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
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]" />
        
        <div className="relative z-10">
          <AnnouncementBanner />
          <div className="flex flex-col items-center justify-center p-4 min-h-[calc(100vh-56px)]">
            <Card className="w-full max-w-md bg-slate-900/80 border-slate-800 backdrop-blur-xl">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg shadow-amber-400/20">
                  <Lock className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-white">نسيت كلمة المرور؟</CardTitle>
                <CardDescription className="text-slate-400">
                  أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="flex items-center gap-2 text-slate-300">
                    <Mail className="h-4 w-4" />
                    البريد الإلكتروني
                  </Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="your@email.com"
                    onKeyPress={(e) => e.key === "Enter" && handleForgotPassword()}
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>

                <Button
                  onClick={handleForgotPassword}
                  disabled={forgotLoading || !forgotEmail}
                  className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white"
                  size="lg"
                >
                  {forgotLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "إرسال رابط إعادة التعيين"
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotEmail("");
                  }}
                  disabled={forgotLoading}
                  className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  العودة لتسجيل الدخول
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // 2FA Verification Screen
  if (show2FA) {
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
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]" />
        
        <div className="relative z-10">
          <AnnouncementBanner />
          <div className="flex flex-col items-center justify-center p-4 min-h-[calc(100vh-56px)]">
            <Card className="w-full max-w-md bg-slate-900/80 border-slate-800 backdrop-blur-xl">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-lg shadow-emerald-400/20">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-white">التحقق بخطوتين</CardTitle>
                <CardDescription className="text-slate-400">
                  تم إرسال رمز التحقق إلى بريدك الإلكتروني
                </CardDescription>
                <p className="text-sky-400 text-sm mt-2 font-medium">{email}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <Label className="text-slate-300 text-center">أدخل رمز التحقق المكون من 6 أرقام</Label>
                  <InputOTP
                    value={otpCode}
                    onChange={setOtpCode}
                    maxLength={6}
                    disabled={loading}
                  >
                    <InputOTPGroup className="gap-2">
                      <InputOTPSlot index={0} className="bg-slate-800 border-slate-700 text-white text-xl h-14 w-12" />
                      <InputOTPSlot index={1} className="bg-slate-800 border-slate-700 text-white text-xl h-14 w-12" />
                      <InputOTPSlot index={2} className="bg-slate-800 border-slate-700 text-white text-xl h-14 w-12" />
                      <InputOTPSlot index={3} className="bg-slate-800 border-slate-700 text-white text-xl h-14 w-12" />
                      <InputOTPSlot index={4} className="bg-slate-800 border-slate-700 text-white text-xl h-14 w-12" />
                      <InputOTPSlot index={5} className="bg-slate-800 border-slate-700 text-white text-xl h-14 w-12" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  onClick={handleVerify2FA}
                  disabled={loading || otpCode.length !== 6}
                  className="w-full bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white"
                  size="lg"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      تأكيد الدخول
                      <ArrowRight className="mr-2 h-5 w-5" />
                    </>
                  )}
                </Button>

                <div className="flex flex-col gap-3 pt-4 border-t border-slate-800">
                  <Button
                    variant="ghost"
                    onClick={handleResend2FA}
                    disabled={loading || resendTimer > 0}
                    className="text-slate-400 hover:text-white"
                  >
                    {resendTimer > 0 
                      ? `إعادة الإرسال بعد ${resendTimer} ثانية`
                      : "إعادة إرسال الرمز"
                    }
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={loading}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    العودة لتسجيل الدخول
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

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
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]" />
      
      <div className="relative z-10">
        <AnnouncementBanner />
      <div className="flex flex-col items-center justify-center p-4 min-h-[calc(100vh-56px)]">
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

                <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-800/30 p-3 rounded-lg">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  <span>محمي بالتحقق بخطوتين عبر البريد الإلكتروني</span>
                </div>

                <Button
                  onClick={handleSignIn}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 text-white"
                  size="lg"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "تسجيل الدخول"}
                </Button>

                {/* نسيت كلمة المرور - معطل مؤقتاً
                <Button
                  variant="link"
                  onClick={() => setShowForgotPassword(true)}
                  className="w-full text-slate-400 hover:text-sky-400"
                >
                  نسيت كلمة المرور؟
                </Button>
                */}
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

                <PasswordStrength password={password} />

                <Button
                  onClick={handleSignUp}
                  disabled={loading || !isPasswordStrong(password)}
                  className="w-full bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 text-white"
                  size="lg"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "إنشاء حساب"}
                </Button>
              </TabsContent>
            </Tabs>

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
