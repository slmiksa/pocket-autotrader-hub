import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Download, 
  Smartphone, 
  Share, 
  Plus, 
  MoreVertical,
  ArrowLeft,
  Check,
  Zap,
  Bell,
  Wifi,
  Shield
} from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Install() {
  const navigate = useNavigate();
  const { canInstall, isIOS, isInstalled, isStandalone, promptInstall } = usePWAInstall();
  const [isAndroid] = useState(() => /android/i.test(navigator.userAgent));

  const handleInstall = async () => {
    if (isInstalled || isStandalone) {
      toast.info('التطبيق مثبت بالفعل!');
      return;
    }

    const installed = await promptInstall();
    if (installed) {
      toast.success('تم تثبيت التطبيق بنجاح!');
    }
  };

  const features = [
    {
      icon: Zap,
      title: "سرعة فائقة",
      description: "تحميل فوري بدون انتظار"
    },
    {
      icon: Bell,
      title: "إشعارات فورية",
      description: "تنبيهات للإشارات والفرص"
    },
    {
      icon: Wifi,
      title: "يعمل بدون إنترنت",
      description: "بعض الميزات متاحة أوفلاين"
    },
    {
      icon: Shield,
      title: "آمن ومحمي",
      description: "بياناتك مشفرة ومحمية"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" dir="rtl">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate(-1)}
              variant="ghost"
              size="sm"
              className="gap-2 text-white/70 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              رجوع
            </Button>
            <h1 className="text-xl font-bold text-white">تثبيت التطبيق</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-2xl shadow-amber-500/30">
            <Smartphone className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">
            حمّل التطبيق الآن
          </h2>
          <p className="text-slate-400 text-lg">
            احصل على تجربة أفضل مع تطبيقنا على هاتفك
          </p>
        </div>

        {/* Status Card */}
        {(isInstalled || isStandalone) && (
          <Card className="bg-green-500/10 border-green-500/30 mb-6">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-green-400 font-semibold">التطبيق مثبت بالفعل!</p>
                <p className="text-slate-400 text-sm">يمكنك فتحه من الشاشة الرئيسية</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {features.map((feature, index) => (
            <Card key={index} className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Installation Instructions */}
        <Card className="bg-slate-800/50 border-slate-700/50 mb-6">
          <CardContent className="p-6">
            {isIOS ? (
              <>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-amber-500" />
                  التثبيت على iPhone / iPad
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="text-white font-medium mb-2">اضغط على زر المشاركة</p>
                      <div className="flex items-center gap-2 p-3 bg-slate-800 rounded-lg">
                        <Share className="w-6 h-6 text-blue-400" />
                        <span className="text-slate-300">في أسفل الشاشة (Safari)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                      2
                    </div>
                    <div>
                      <p className="text-white font-medium mb-2">مرر للأسفل واختر</p>
                      <div className="flex items-center gap-2 p-3 bg-slate-800 rounded-lg">
                        <Plus className="w-6 h-6 text-slate-300" />
                        <span className="text-slate-300">إضافة إلى الشاشة الرئيسية</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                      3
                    </div>
                    <div>
                      <p className="text-white font-medium mb-2">اضغط "إضافة"</p>
                      <p className="text-slate-400">سيظهر التطبيق على شاشتك الرئيسية</p>
                    </div>
                  </div>
                </div>
              </>
            ) : isAndroid ? (
              <>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-amber-500" />
                  التثبيت على Android
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="text-white font-medium mb-2">اضغط على القائمة</p>
                      <div className="flex items-center gap-2 p-3 bg-slate-800 rounded-lg">
                        <MoreVertical className="w-6 h-6 text-slate-300" />
                        <span className="text-slate-300">ثلاث نقاط في أعلى Chrome</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                      2
                    </div>
                    <div>
                      <p className="text-white font-medium mb-2">اختر من القائمة</p>
                      <div className="flex items-center gap-2 p-3 bg-slate-800 rounded-lg">
                        <Download className="w-6 h-6 text-slate-300" />
                        <span className="text-slate-300">تثبيت التطبيق أو إضافة للشاشة الرئيسية</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                      3
                    </div>
                    <div>
                      <p className="text-white font-medium mb-2">اضغط "تثبيت"</p>
                      <p className="text-slate-400">سيتم تحميل التطبيق على جهازك</p>
                    </div>
                  </div>
                </div>

                {/* Direct Install Button for Android */}
                {canInstall && !isIOS && (
                  <Button
                    onClick={handleInstall}
                    className="w-full mt-6 h-14 text-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/30"
                  >
                    <Download className="w-5 h-5 ml-2" />
                    تثبيت مباشر
                  </Button>
                )}
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-amber-500" />
                  التثبيت على الكمبيوتر
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="text-white font-medium mb-2">ابحث عن أيقونة التثبيت</p>
                      <p className="text-slate-400">في شريط العنوان أعلى المتصفح</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                      2
                    </div>
                    <div>
                      <p className="text-white font-medium mb-2">اضغط "تثبيت"</p>
                      <p className="text-slate-400">سيفتح التطبيق في نافذة مستقلة</p>
                    </div>
                  </div>
                </div>

                {canInstall && (
                  <Button
                    onClick={handleInstall}
                    className="w-full mt-6 h-14 text-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/30"
                  >
                    <Download className="w-5 h-5 ml-2" />
                    تثبيت التطبيق
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Note */}
        <p className="text-center text-slate-500 text-sm">
          التطبيق مجاني ولا يحتاج متجر التطبيقات
        </p>
      </div>
    </div>
  );
}
