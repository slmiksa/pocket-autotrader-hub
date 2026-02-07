import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, CandlestickSeries } from 'lightweight-charts';
import { cn } from '@/lib/utils';

interface TradingLevel {
  price: number;
  type: 'resistance' | 'support' | 'call_entry' | 'put_entry' | 'target_up' | 'target_down' | 'pivot' | 'swing_high' | 'swing_low' | 'stop_loss';
  label: string;
  labelAr: string;
  color: string;
  strength: number;
}

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface GoldenPulseChartProps {
  candles: CandleData[];
  levels: TradingLevel[];
  currentPrice: number;
  isFullscreen?: boolean;
}

const GoldenPulseChart = ({ candles, levels, currentPrice, isFullscreen }: GoldenPulseChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [chartReady, setChartReady] = useState(false);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;
    
    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { color: '#0a0a0f' },
        textColor: '#9ca3af',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: 'rgba(75, 85, 99, 0.15)' },
        horzLines: { color: 'rgba(75, 85, 99, 0.15)' },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: '#f59e0b', width: 1, style: 2, labelBackgroundColor: '#f59e0b' },
        horzLine: { color: '#f59e0b', width: 1, style: 2, labelBackgroundColor: '#f59e0b' },
      },
      rightPriceScale: {
        borderColor: 'rgba(75, 85, 99, 0.3)',
        scaleMargins: { top: 0.05, bottom: 0.05 },
        autoScale: true,
        borderVisible: true,
      },
      timeScale: {
        borderColor: 'rgba(75, 85, 99, 0.3)',
        timeVisible: true,
        secondsVisible: false,
        borderVisible: true,
      },
      handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: true },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    setChartReady(true);

    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        const { clientWidth, clientHeight } = chartContainerRef.current;
        chart.applyOptions({
          width: clientWidth,
          height: clientHeight,
        });
        chart.timeScale().fitContent();
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Initial resize after a short delay to ensure container is fully rendered
    setTimeout(handleResize, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
    };
  }, []);

  // Handle fullscreen changes
  useEffect(() => {
    if (!chartRef.current || !chartContainerRef.current) return;
    
    // Delay to allow container to resize first
    const timer = setTimeout(() => {
      if (chartContainerRef.current && chartRef.current) {
        const { clientWidth, clientHeight } = chartContainerRef.current;
        chartRef.current.applyOptions({
          width: clientWidth,
          height: clientHeight,
        });
        chartRef.current.timeScale().fitContent();
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [isFullscreen]);

  // Update candle data
  useEffect(() => {
    if (!candleSeriesRef.current || !candles.length) return;

    const formattedCandles: CandlestickData<Time>[] = candles.map(c => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    candleSeriesRef.current.setData(formattedCandles);

    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [candles]);

  // Draw levels overlay
  const updateOverlay = useCallback(() => {
    if (!overlayRef.current || !chartRef.current || !candleSeriesRef.current || !levels.length) return;

    const container = overlayRef.current;
    const rect = container.getBoundingClientRect();
    
    container.innerHTML = '';

    levels.forEach((level) => {
      const coordinate = candleSeriesRef.current?.priceToCoordinate(level.price);
      if (coordinate === null || coordinate === undefined) return;
      
      const y = coordinate;
      if (y < 0 || y > rect.height) return;

      // Determine styling based on level type
      const isEntry = level.type === 'call_entry' || level.type === 'put_entry';
      const isStopLoss = level.type === 'stop_loss';
      const isTarget = level.type === 'target_up' || level.type === 'target_down';
      const isSwing = level.type === 'swing_high' || level.type === 'swing_low';
      const isPivot = level.type === 'pivot';
      
      // Line thickness based on importance
      const lineHeight = isEntry ? '3px' : isStopLoss ? '2px' : '1px';
      const lineOpacity = isEntry || isStopLoss ? '1' : '0.7';

      // Create level line
      const line = document.createElement('div');
      line.style.cssText = `
        position: absolute;
        left: 0;
        top: ${y}px;
        right: 170px;
        height: ${lineHeight};
        pointer-events: none;
        opacity: ${lineOpacity};
      `;
      
      // Different line styles
      if (isTarget || isSwing || isPivot) {
        line.style.background = `repeating-linear-gradient(to right, ${level.color}, ${level.color} 6px, transparent 6px, transparent 12px)`;
      } else {
        line.style.backgroundColor = level.color;
        if (isEntry) {
          line.style.boxShadow = `0 0 8px ${level.color}80`;
        }
      }

      container.appendChild(line);

      // Create label with professional styling
      const labelBox = document.createElement('div');
      const isLightColor = ['#FBBF24', '#34D399', '#4ADE80', '#F472B6'].includes(level.color);
      const textColor = isLightColor ? '#000' : '#fff';
      const fontSize = isEntry ? '11px' : '10px';
      const padding = isEntry ? '4px 10px' : '3px 8px';
      const zIndex = isEntry ? '30' : isStopLoss ? '25' : '15';
      const fontWeight = isEntry || isStopLoss ? '700' : '600';
      
      labelBox.style.cssText = `
        position: absolute;
        top: ${y}px;
        right: 4px;
        transform: translateY(-50%);
        background-color: ${level.color};
        color: ${textColor};
        font-size: ${fontSize};
        font-weight: ${fontWeight};
        padding: ${padding};
        border-radius: 4px;
        white-space: nowrap;
        pointer-events: none;
        z-index: ${zIndex};
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        min-width: 130px;
        text-align: center;
        font-family: 'Segoe UI', Tahoma, sans-serif;
        letter-spacing: 0.3px;
        direction: rtl;
      `;
      
      if (isEntry) {
        labelBox.style.border = '2px solid rgba(255,255,255,0.4)';
        labelBox.style.boxShadow = `0 3px 10px rgba(0,0,0,0.5), 0 0 15px ${level.color}40`;
      }
      
      labelBox.textContent = level.labelAr;
      container.appendChild(labelBox);
    });

    // Current price indicator
    const currentY = candleSeriesRef.current?.priceToCoordinate(currentPrice);
    if (currentY !== null && currentY !== undefined && currentY >= 0 && currentY <= rect.height) {
      // Price line
      const priceLine = document.createElement('div');
      priceLine.style.cssText = `
        position: absolute;
        left: 0;
        top: ${currentY}px;
        right: 170px;
        height: 2px;
        background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
        pointer-events: none;
        box-shadow: 0 0 10px rgba(245, 158, 11, 0.6);
        animation: pulse 2s ease-in-out infinite;
      `;
      container.appendChild(priceLine);

      // Price label
      const priceLabel = document.createElement('div');
      priceLabel.style.cssText = `
        position: absolute;
        top: ${currentY}px;
        right: 4px;
        transform: translateY(-50%);
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: #000;
        font-size: 12px;
        font-weight: 700;
        padding: 5px 12px;
        border-radius: 4px;
        white-space: nowrap;
        pointer-events: none;
        z-index: 40;
        box-shadow: 0 3px 10px rgba(0,0,0,0.4);
        min-width: 130px;
        text-align: center;
        font-family: 'Segoe UI', Tahoma, sans-serif;
        direction: rtl;
      `;
      priceLabel.textContent = `السعر الحالي ${currentPrice.toFixed(2)}`;
      container.appendChild(priceLabel);
    }

    // Add CSS animation for pulse effect
    if (!document.getElementById('golden-pulse-styles')) {
      const style = document.createElement('style');
      style.id = 'golden-pulse-styles';
      style.textContent = `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `;
      document.head.appendChild(style);
    }
  }, [levels, currentPrice]);

  // Update overlay on chart changes
  useEffect(() => {
    if (!chartReady || !chartRef.current) return;

    updateOverlay();

    const chart = chartRef.current;
    chart.timeScale().subscribeVisibleLogicalRangeChange(updateOverlay);
    chart.subscribeCrosshairMove(updateOverlay);

    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(updateOverlay);
      chart.unsubscribeCrosshairMove(updateOverlay);
    };
  }, [chartReady, updateOverlay]);

  return (
    <div className={cn(
      "relative w-full bg-[#0a0a0f] rounded-lg overflow-hidden",
      isFullscreen ? "h-full min-h-[calc(100vh-100px)]" : "h-[550px]"
    )}>
      <div 
        ref={chartContainerRef} 
        className="absolute inset-0"
        style={{ width: '100%', height: '100%' }}
      />
      <div 
        ref={overlayRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 5 }}
      />
    </div>
  );
};

export default GoldenPulseChart;
