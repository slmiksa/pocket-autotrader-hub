import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, Share, Plus } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface InstallAppButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
  fullWidth?: boolean;
}

export const InstallAppButton = ({
  variant = 'default',
  size = 'default',
  className = '',
  showIcon = true,
  fullWidth = false
}: InstallAppButtonProps) => {
  const { canInstall, isIOS, isInstalled, isStandalone, promptInstall } = usePWAInstall();
  const [showIOSDialog, setShowIOSDialog] = useState(false);

  const handleInstall = async () => {
    if (isInstalled || isStandalone) {
      toast.info('التطبيق مثبت بالفعل!');
      return;
    }

    if (isIOS) {
      setShowIOSDialog(true);
      return;
    }

    const installed = await promptInstall();
    if (installed) {
      toast.success('تم تثبيت التطبيق بنجاح!');
    }
  };

  // Don't show if already installed
  if (isInstalled || isStandalone) {
    return null;
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleInstall}
        className={`${fullWidth ? 'w-full' : ''} ${className}`}
      >
        {showIcon && <Download className="h-4 w-4 ml-2" />}
        تحميل كتطبيق
      </Button>

      {/* iOS Installation Instructions Dialog */}
      <Dialog open={showIOSDialog} onOpenChange={setShowIOSDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Smartphone className="h-5 w-5 text-amber-500" />
              تثبيت التطبيق على iPhone
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              اتبع الخطوات التالية لتثبيت التطبيق
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
              <div className="rounded-full bg-amber-500 text-white w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </div>
              <div className="space-y-1">
                <p className="text-white font-medium">اضغط على زر المشاركة</p>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Share className="h-4 w-4" />
                  <span>في أسفل الشاشة</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
              <div className="rounded-full bg-amber-500 text-white w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </div>
              <div className="space-y-1">
                <p className="text-white font-medium">اضغط "إضافة إلى الشاشة الرئيسية"</p>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Plus className="h-4 w-4" />
                  <span>Add to Home Screen</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
              <div className="rounded-full bg-amber-500 text-white w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </div>
              <div className="space-y-1">
                <p className="text-white font-medium">اضغط "إضافة"</p>
                <p className="text-slate-400 text-sm">سيظهر التطبيق على شاشتك الرئيسية</p>
              </div>
            </div>
          </div>

          <Button 
            onClick={() => setShowIOSDialog(false)} 
            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
          >
            فهمت
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InstallAppButton;