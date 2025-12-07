import { useState, useEffect, useCallback, useRef } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  disabled?: boolean;
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  disabled = false,
}: UsePullToRefreshOptions) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startYRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    // Check if we're at the very top of the page (window scroll)
    const isAtTop = window.scrollY <= 0;
    
    if (isAtTop) {
      startYRef.current = e.touches[0].clientY;
    } else {
      startYRef.current = 0;
    }
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing || startYRef.current === 0) return;
    
    // Only allow pull if at the very top
    if (window.scrollY > 0) {
      startYRef.current = 0;
      setPullDistance(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const distance = currentY - startYRef.current;

    if (distance > 0) {
      // Reduce the pull effect with resistance
      const resistance = 0.5;
      setPullDistance(Math.min(distance * resistance, threshold * 1.5));
      
      if (distance > 10) {
        e.preventDefault();
      }
    } else {
      // User is scrolling up, reset
      startYRef.current = 0;
      setPullDistance(0);
    }
  }, [disabled, isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing) return;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
    startYRef.current = 0;
  }, [disabled, isRefreshing, pullDistance, threshold, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    containerRef,
    isRefreshing,
    pullDistance,
  };
};
