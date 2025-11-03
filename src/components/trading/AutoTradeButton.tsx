import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Copy, Zap, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export const AutoTradeButton = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const bookmarkletCode = `javascript:(function(){const SUPABASE_URL='https://ujguqvyshjnrxnmsvsdf.supabase.co';const SUPABASE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqZ3VxdnlzaGpucnhubXN2c2RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxODMxNTAsImV4cCI6MjA3Nzc1OTE1MH0.utRPrAN2qr78HVvob3-1cA1mH0l4-SZveZcWWFB8Dj0';let isRunning=false;let intervalId=null;let processedSignals=new Set();function showNotification(msg,type='info'){const n=document.createElement('div');n.style.cssText='position:fixed;top:20px;right:20px;background:'+(type==='success'?'#10b981':type==='error'?'#ef4444':type==='warning'?'#f59e0b':'#3b82f6')+';color:white;padding:16px 24px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:2147483647;font-family:Arial;animation:slideIn 0.3s;max-width:420px;font-size:14px;line-height:1.4';n.textContent=msg;document.body.appendChild(n);setTimeout(()=>n.remove(),6000);}function sleep(ms){return new Promise(r=>setTimeout(r,ms));}function findByText(tag,texts){const els=document.querySelectorAll(tag);for(const el of els){const t=(el.innerText||'').toLowerCase();if(texts.some(x=>t.includes(x)))return el;}return null;}async function findElement(sel,timeout=4000){const start=Date.now();while(Date.now()-start<timeout){const el=document.querySelector(sel);if(el)return el;await sleep(100);}return null;}function findAny(cands){for(const s of cands){const el=document.querySelector(s);if(el)return el;}return null;}async function setTradeAmount(amount){const candidates=['input[type="number"]','input[aria-label*="amount" i]','input[inputmode="decimal"]','input[class*="amount" i]','.amount-input input'];for(const sel of candidates){const el=document.querySelector(sel);if(el){el.focus();el.value='';el.value=amount;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));return true;}}return false;}async function executeTradeOnPocketOption(signal){console.log('🚀 Executing on page:',signal);showNotification('🚀 محاولة تنفيذ الصفقة...','info');try{await sleep(800);await setTradeAmount(signal.amount);const callSels=['[data-dir="call"]','.call-btn','.up-btn','[data-direction="higher"]','.higher','.buy'];const putSels=['[data-dir="put"]','.put-btn','.down-btn','[data-direction="lower"]','.lower','.sell'];let btn=signal.direction.toLowerCase()==='call'?findAny(callSels):findAny(putSels);if(!btn){btn=signal.direction.toLowerCase()==='call'?findByText('button',['call','higher','up','شراء','أعلى','▲','↑']):findByText('button',['put','lower','down','بيع','أسفل','▼','↓']);}if(!btn){showNotification('⚠️ لم يتم العثور على زر التداول. تأكد أنك داخل شاشة التداول الرئيسية','warning');return false;}btn.scrollIntoView({behavior:'smooth',block:'center'});await sleep(200);btn.click();await sleep(800);showNotification('✅ تم إرسال أمر '+signal.direction+' على '+signal.asset,'success');return true;}catch(e){console.error('❌ exec error',e);showNotification('❌ خطأ في تنفيذ الصفقة: '+e.message,'error');return false;}}async function updateSignalStatus(id,status){try{await fetch(SUPABASE_URL+'/rest/v1/signals?id=eq.'+id,{method:'PATCH',headers:{'apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY,'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify({status})});}catch(e){console.warn('status update failed',e);}}function shouldExecute(s){if(!s.entry_time)return true;const now=new Date();const [h,m]=s.entry_time.split(':').map(Number);const entry=new Date(now);entry.setHours(h,m,0,0);const diff=(entry-now)/60000;if(diff>10)return false;if(diff<-7)return true;return Math.abs(diff)<=2;}async function checkSignals(){try{const r=await fetch(SUPABASE_URL+'/rest/v1/signals?status=eq.pending&order=received_at.desc&limit=10',{headers:{'apikey':SUPABASE_KEY,'Authorization':'Bearer '+SUPABASE_KEY}});const signals=await r.json();console.log('📊 pending:',signals.length);let done=0;for(const s of signals){if(processedSignals.has(s.id))continue;if(!shouldExecute(s))continue;const ok=await executeTradeOnPocketOption(s);await updateSignalStatus(s.id,ok?'executed':'failed');processedSignals.add(s.id);done++;await sleep(1500);}if(done>0)showNotification('🎉 تم تنفيذ '+done+' صفقة','success');}catch(e){console.error('❌ check error',e);showNotification('❌ خطأ في فحص الإشارات','error');}}function toggleAutoTrade(){if(isRunning){clearInterval(intervalId);intervalId=null;isRunning=false;btn.textContent='▶️ تشغيل';btn.style.background='linear-gradient(135deg,#667eea,#764ba2)';showNotification('⏸️ تم الإيقاف','info');}else{isRunning=true;btn.textContent='⏸️ إيقاف';btn.style.background='linear-gradient(135deg,#10b981,#059669)';processedSignals.clear();checkSignals();intervalId=setInterval(checkSignals,4000);showNotification('🚀 التداول التلقائي نشط','success');}}const btn=document.createElement('button');btn.textContent='▶️ تشغيل';btn.style.cssText='position:fixed;bottom:20px;right:20px;background:linear-gradient(135deg,#667eea,#764ba2);color:white;border:none;padding:18px 36px;border-radius:50px;font-size:18px;font-weight:bold;cursor:pointer;box-shadow:0 8px 25px rgba(102,126,234,0.5);z-index:2147483647;font-family:Arial;transition:all .3s';btn.onclick=toggleAutoTrade;document.body.appendChild(btn);const style=document.createElement('style');style.textContent='@keyframes slideIn{from{transform:translateX(400px);opacity:0}to{transform:translateX(0);opacity:1}}';document.head.appendChild(style);showNotification('🤖 جاهز! افتح شاشة التداول ثم اضغط تشغيل','success');})();`;

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