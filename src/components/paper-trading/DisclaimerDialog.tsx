import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface DisclaimerDialogProps {
  onAccept: () => void;
}

export const DisclaimerDialog = ({ onAccept }: DisclaimerDialogProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if user has already seen the disclaimer
    const hasSeenDisclaimer = localStorage.getItem("paperTradingDisclaimerSeen");
    if (!hasSeenDisclaimer) {
      setOpen(true);
    } else {
      onAccept();
    }
  }, [onAccept]);

  const handleAccept = () => {
    localStorage.setItem("paperTradingDisclaimerSeen", "true");
    setOpen(false);
    onAccept();
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-amber-500/20 rounded-full">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-xl">
            تنبيه مهم
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-base leading-relaxed">
            <span className="font-bold text-foreground block mb-3">
              منصة تيفو تريد ليست منصة تداول حقيقية
            </span>
            <span className="text-muted-foreground">
              هذا القسم مخصص لتعليمك التداول على السوق الحقيقي باستخدام أموال وهمية فقط.
              <br /><br />
              يمكنك التدرب على استراتيجيات التداول دون أي مخاطر مالية حقيقية.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogAction 
            onClick={handleAccept}
            className="w-full bg-primary hover:bg-primary/90"
          >
            فهمت، المتابعة
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
