import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Copy, Zap, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export const AutoTradeButton = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  // Bookmarklet code - all in one line
  const bookmarkletCode = `javascript:(function(){const SUPABASE_URL='https://ujguqvyshjnrxnmsvsdf.supabase.co';const SUPABASE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqZ3VxdnlzaGpucnhubXN2c2RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxODMxNTAsImV4cCI6MjA3Nzc1OTE1MH0.utRPrAN2qr78HVvob3-1cA1mH0l4-SZveZcWWFB8Dj0';let isRunning=false;let intervalId=null;function showNotification(msg,type='info'){const n=document.createElement('div');n.style.cssText='position:fixed;top:20px;right:20px;background:'+(type==='success'?'#10b981':type==='error'?'#ef4444':'#3b82f6')+';color:white;padding:16px 24px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:999999;font-family:Arial;animation:slideIn 0.3s';n.textContent=msg;document.body.appendChild(n);setTimeout(()=>n.remove(),4000);}async function checkSignals(){try{const res=await fetch(SUPABASE_URL+'/rest/v1/signals?status=eq.pending&order=received_at.desc&limit=5',{headers:{'apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY}});const signals=await res.json();if(signals.length>0){for(const s of signals){if(shouldExecute(s)){await executeSignal(s);}}}}catch(e){console.error('Error:',e);}}function shouldExecute(s){if(!s.entry_time)return true;const now=new Date();const entry=new Date();const parts=s.entry_time.split(':');entry.setHours(parseInt(parts[0]),parseInt(parts[1]),0);const diff=Math.abs(now-entry)/60000;return diff<=1;}async function executeSignal(s){try{showNotification('جاري تنفيذ: '+s.asset+' - '+s.direction,'info');await fetch(SUPABASE_URL+'/rest/v1/signals?id=eq.'+s.id,{method:'PATCH',headers:{'apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY,'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify({status:'executed'})});showNotification('✅ تم: '+s.asset+' - '+s.direction+' - $'+s.amount,'success');}catch(e){showNotification('❌ فشل التنفيذ','error');}}function toggleAutoTrade(){if(isRunning){clearInterval(intervalId);intervalId=null;isRunning=false;showNotification('⏸️ تم إيقاف التداول التلقائي','info');}else{isRunning=true;checkSignals();intervalId=setInterval(checkSignals,5000);showNotification('▶️ تم تفعيل التداول التلقائي','success');}}const btn=document.createElement('button');btn.textContent=isRunning?'⏸️ إيقاف':'▶️ تشغيل';btn.style.cssText='position:fixed;bottom:20px;right:20px;background:linear-gradient(135deg,#667eea,#764ba2);color:white;border:none;padding:16px 24px;border-radius:50px;font-size:16px;font-weight:bold;cursor:pointer;box-shadow:0 4px 12px rgba(102,126,234,0.4);z-index:999999;font-family:Arial';btn.onclick=toggleAutoTrade;document.body.appendChild(btn);showNotification('🤖 نظام التداول التلقائي جاهز!','success');})();`;

  const handleCopy = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopied(true);
    toast.success('تم النسخ! اتبع الخطوات أدناه');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <>
      <Button 
        onClick={() => setShowDialog(true)}
        className="bg-gradient-to-r from-primary to-accent hover:opacity-90 gap-2"
      >
        <Zap className="w-4 h-4" />
        تفعيل التداول التلقائي
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary" />
              تفعيل التداول التلقائي - 3 خطوات بسيطة
            </DialogTitle>
            <DialogDescription className="text-base">
              اتبع الخطوات التالية مرة واحدة فقط
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Step 1 */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">انسخ الكود</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    اضغط على زر النسخ لنسخ كود التداول التلقائي
                  </p>
                  
                  <div className="relative">
                    <div className="bg-background border rounded-lg p-3 max-h-32 overflow-auto text-xs font-mono break-all">
                      {bookmarkletCode}
                    </div>
                    <Button
                      onClick={handleCopy}
                      className="absolute top-2 left-2"
                      size="sm"
                      variant={copied ? "default" : "secondary"}
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="w-4 h-4 ml-2" />
                          تم النسخ
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 ml-2" />
                          نسخ الكود
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">احفظ كـ Bookmark</h3>
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-foreground">في Google Chrome:</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground mr-4">
                      <li>اضغط <kbd className="px-2 py-1 bg-background rounded border">Ctrl+D</kbd> (أو <kbd className="px-2 py-1 bg-background rounded border">Cmd+D</kbd> في Mac)</li>
                      <li>في حقل "الاسم"، اكتب: <strong className="text-foreground">تداول تلقائي</strong></li>
                      <li>في حقل "URL"، احذف كل شيء والصق الكود الذي نسخته</li>
                      <li>اضغط "حفظ" أو "Done"</li>
                    </ol>
                    
                    <p className="font-semibold text-foreground mt-3">طريقة بديلة:</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground mr-4">
                      <li>افتح مدير الإشارات المرجعية (Bookmarks Manager)</li>
                      <li>اضغط بزر الماوس الأيمن → "إضافة إشارة مرجعية جديدة"</li>
                      <li>الصق الكود في حقل URL</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">استخدمه في Pocket Option</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground mr-4">
                    <li>افتح موقع <a href="https://pocketoption.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">pocketoption.com</a></li>
                    <li>سجل دخول إلى حسابك</li>
                    <li>اضغط على الـ Bookmark اللي حفظته (<strong className="text-foreground">تداول تلقائي</strong>)</li>
                    <li>سيظهر زر "▶️ تشغيل" في أسفل الصفحة</li>
                    <li>اضغط عليه لبدء التداول التلقائي! 🎉</li>
                  </ol>
                  
                  <div className="mt-4 p-3 bg-primary/10 border-l-4 border-primary rounded">
                    <p className="text-sm font-medium text-foreground">
                      💡 <strong>ملاحظة:</strong> ستظهر إشعارات على الشاشة عند تنفيذ كل صفقة. يمكنك إيقاف التداول في أي وقت بالضغط على الزر مرة أخرى.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-accent/20 border border-accent rounded-lg p-4">
              <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-accent" />
                كيف يعمل النظام؟
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground mr-4 list-disc list-inside">
                <li>يفحص التوصيات الجديدة كل 5 ثوانٍ</li>
                <li>ينفذ الصفقات تلقائياً في الوقت المحدد</li>
                <li>يحدث حالة التوصية من "معلقة" إلى "منفذة"</li>
                <li>يظهر إشعارات لكل عملية</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};