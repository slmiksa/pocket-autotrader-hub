import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  variant?: 'back' | 'close';
  className?: string;
  onClose?: () => void;
  fallbackPath?: string;
}

// Pages where back button should be hidden
const hiddenOnPages = ['/', '/auth', '/admin-login', '/admin', '/subscription'];

export const BackButton = ({
  variant = 'back',
  className,
  onClose,
  fallbackPath = '/',
}: BackButtonProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    if (onClose) {
      onClose();
      return;
    }

    // Check if there's history to go back to
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  // Don't show on hidden pages
  if (hiddenOnPages.includes(location.pathname)) return null;

  const Icon = variant === 'close' ? X : ArrowRight;
  const label = variant === 'close' ? 'إغلاق' : 'رجوع';

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={cn(
        "fixed top-14 right-3 z-40 gap-1.5 bg-background/90 backdrop-blur-sm border border-border/50 shadow-lg",
        "text-foreground hover:bg-accent hover:text-accent-foreground",
        "rounded-full px-3 h-9 animate-fade-in",
        className
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="text-sm font-medium">{label}</span>
    </Button>
  );
};
