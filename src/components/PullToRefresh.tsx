import { ReactNode, useCallback } from 'react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { Loader2, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const { containerRef, isRefreshing, pullDistance } = usePullToRefresh({
    onRefresh,
    threshold: 80,
    disabled,
  });

  const showIndicator = pullDistance > 10 || isRefreshing;
  const progress = Math.min(pullDistance / 80, 1);
  const rotation = progress * 180;

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-auto h-full", className)}
      style={{
        transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
        transition: pullDistance === 0 ? 'transform 0.2s ease-out' : undefined,
      }}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 z-50 flex items-center justify-center",
          "w-10 h-10 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30",
          "transition-all duration-200",
          showIndicator ? "opacity-100" : "opacity-0"
        )}
        style={{
          top: -50 + pullDistance,
          transform: `translateX(-50%) rotate(${rotation}deg)`,
        }}
      >
        {isRefreshing ? (
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
        ) : (
          <ArrowDown 
            className={cn(
              "h-5 w-5 text-primary transition-transform",
              progress >= 1 && "rotate-180"
            )} 
          />
        )}
      </div>

      {children}
    </div>
  );
};
