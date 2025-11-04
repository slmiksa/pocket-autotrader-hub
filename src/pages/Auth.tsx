import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
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
    setLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      if (error) throw error;
      if (data.user) {
        // Create profile for the user
        const {
          error: profileError
        } = await supabase.from("profiles").insert({
          user_id: data.user.id,
          subscription_expires_at: null
        });
        if (profileError) {
          console.error("Error creating profile:", profileError);
        }
        toast.success("تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول");
        setIsLogin(true);
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
      const {
        data,
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      if (data.session) {
        toast.success("تم تسجيل الدخول بنجاح!");
        navigate("/");
      }
    } catch (error: any) {
      console.error("Error signing in:", error);
      toast.error(error.message || "فشل تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen bg-background dark flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">PocketOption توصيات الهوامير </CardTitle>
          <CardDescription>
            {isLogin ? "تسجيل الدخول للوصول إلى حسابك" : "إنشاء حساب جديد"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={isLogin ? "login" : "signup"} onValueChange={v => setIsLogin(v === "login")}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
              <TabsTrigger value="signup">إنشاء حساب</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-login" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  البريد الإلكتروني
                </Label>
                <Input id="email-login" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" onKeyPress={e => e.key === "Enter" && handleSignIn()} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password-login" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  كلمة المرور
                </Label>
                <Input id="password-login" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyPress={e => e.key === "Enter" && handleSignIn()} />
              </div>

              <Button onClick={handleSignIn} disabled={loading} className="w-full" size="lg">
                تسجيل الدخول
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-signup" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  البريد الإلكتروني
                </Label>
                <Input id="email-signup" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" onKeyPress={e => e.key === "Enter" && handleSignUp()} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password-signup" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  كلمة المرور
                </Label>
                <Input id="password-signup" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyPress={e => e.key === "Enter" && handleSignUp()} />
              </div>

              <Button onClick={handleSignUp} disabled={loading} className="w-full" size="lg">
                إنشاء حساب
              </Button>
            </TabsContent>
          </Tabs>

          <div className="mt-4 text-center">
            <Button onClick={() => navigate("/subscription")} variant="link" size="sm">
              لديك كود اشتراك؟ قم بتفعيله
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default Auth;