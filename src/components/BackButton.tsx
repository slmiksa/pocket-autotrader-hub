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
  fallbackPath = '/'
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
  return;
};