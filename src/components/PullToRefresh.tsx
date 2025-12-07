import { ReactNode } from 'react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playRefreshSound } from '@/utils/soundNotification';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
  className?: string;
  disabled?: boolean;
}

export const PullToRefresh = ({
  children,
  onRefresh,
  className,
  disabled = false,
}: PullToRefreshProps) => {
  const handleRefresh = async () => {
    playRefreshSound();
    await onRefresh();
  };

  const { containerRef, isRefreshing, pullDistance } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
    disabled,
  });

  const showIndicator = pullDistance > 10 || isRefreshing;
  const progress = Math.min(pullDistance / 80, 1);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-auto h-full", className)}
      style={{
        transform: pullDistance > 0 ? `translateY(${pullDistance * 0.5}px)` : undefined,
        transition: pullDistance === 0 ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : undefined,
      }}
    >
      {/* Beautiful Pull Indicator */}
      <div
        className={cn(
          "fixed left-1/2 -translate-x-1/2 z-[100] flex items-center justify-center",
          "transition-all duration-300 ease-out",
          showIndicator ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        style={{
          top: Math.max(60, 60 + pullDistance * 0.5),
        }}
      >
        {/* Outer glow ring */}
        <div 
          className={cn(
            "absolute rounded-full transition-all duration-300",
            isRefreshing ? "animate-ping" : ""
          )}
          style={{
            width: 48 + progress * 16,
            height: 48 + progress * 16,
            background: `radial-gradient(circle, rgba(59, 130, 246, ${0.2 * progress}) 0%, transparent 70%)`,
          }}
        />
        
        {/* Main indicator container */}
        <div 
          className={cn(
            "relative flex items-center justify-center rounded-full",
            "bg-gradient-to-br from-blue-500/20 to-cyan-500/20",
            "backdrop-blur-md border border-blue-400/30",
            "shadow-[0_0_20px_rgba(59,130,246,0.3)]",
            "transition-all duration-300"
          )}
          style={{
            width: 44 + progress * 8,
            height: 44 + progress * 8,
          }}
        >
          {isRefreshing ? (
            // Spinning loader with gradient
            <div className="relative">
              <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/0 via-blue-500/30 to-blue-500/0 animate-pulse" />
            </div>
          ) : (
            // Pull progress indicator
            <div className="relative flex items-center justify-center">
              {/* Circular progress */}
              <svg 
                className="w-8 h-8 -rotate-90"
                viewBox="0 0 36 36"
              >
                {/* Background circle */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-blue-500/20"
                />
                {/* Progress circle */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={88}
                  strokeDashoffset={88 - (88 * progress)}
                  className="transition-all duration-100"
                />
                {/* Gradient definition */}
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="50%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Arrow icon in center */}
              <div 
                className="absolute inset-0 flex items-center justify-center transition-transform duration-200"
                style={{
                  transform: `rotate(${progress >= 1 ? 180 : 0}deg)`,
                }}
              >
                <svg 
                  className="w-4 h-4 text-blue-400"
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5"
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14M5 12l7-7 7 7" />
                </svg>
              </div>
            </div>
          )}
        </div>
        
        {/* Text indicator */}
        <div 
          className={cn(
            "absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap",
            "text-xs font-medium text-blue-300/80",
            "transition-opacity duration-200",
            progress > 0.3 ? "opacity-100" : "opacity-0"
          )}
        >
          {isRefreshing ? 'جاري التحديث...' : progress >= 1 ? 'اترك للتحديث' : 'اسحب للتحديث'}
        </div>
      </div>

      {children}
    </div>
  );
};
