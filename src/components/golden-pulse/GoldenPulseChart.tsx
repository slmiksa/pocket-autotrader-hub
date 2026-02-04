import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, CandlestickSeries } from 'lightweight-charts';
import { cn } from '@/lib/utils';

interface TradingLevel {
  price: number;
  type: 'resistance' | 'support' | 'call_entry' | 'put_entry' | 'target_up' | 'target_down';
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

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#0a0a0f' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: 'rgba(55, 65, 81, 0.3)' },
        horzLines: { color: 'rgba(55, 65, 81, 0.3)' },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: '#f59e0b', width: 1, style: 2 },
        horzLine: { color: '#f59e0b', width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: 'rgba(55, 65, 81, 0.5)',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: 'rgba(55, 65, 81, 0.5)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: true },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
    });

    // lightweight-charts v5 API
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
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
    };
  }, []);

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
    
    // Clear existing levels
    container.innerHTML = '';

    levels.forEach((level) => {
      // Convert price to Y coordinate
      const coordinate = candleSeriesRef.current?.priceToCoordinate(level.price);
      if (coordinate === null || coordinate === undefined) return;
      
      const y = coordinate;
      if (y < 0 || y > rect.height) return;

      // Create level line
      const line = document.createElement('div');
      line.className = 'absolute left-0 pointer-events-none';
      line.style.top = `${y}px`;
      line.style.height = '2px';
      line.style.right = '140px';
      line.style.backgroundColor = level.color;
      line.style.opacity = '0.9';
      
      // Add dashed style for targets
      if (level.type === 'target_up' || level.type === 'target_down') {
        line.style.background = `repeating-linear-gradient(to right, ${level.color}, ${level.color} 8px, transparent 8px, transparent 16px)`;
      }

      container.appendChild(line);

      // Create label box
      const labelBox = document.createElement('div');
      labelBox.className = 'absolute px-2 py-1 text-xs font-bold rounded shadow-lg pointer-events-none whitespace-nowrap';
      labelBox.style.top = `${y}px`;
      labelBox.style.right = '4px';
      labelBox.style.backgroundColor = level.color;
      labelBox.style.color = level.color === '#FFEB3B' ? '#000' : '#fff';
      labelBox.style.transform = 'translateY(-50%)';
      labelBox.style.zIndex = '10';
      labelBox.style.minWidth = '130px';
      labelBox.style.textAlign = 'center';
      labelBox.style.fontSize = '11px';
      labelBox.style.fontWeight = '700';
      labelBox.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
      labelBox.textContent = level.labelAr;

      container.appendChild(labelBox);
    });

    // Add current price line
    const currentY = candleSeriesRef.current?.priceToCoordinate(currentPrice);
    if (currentY !== null && currentY !== undefined && currentY >= 0 && currentY <= rect.height) {
      const priceLine = document.createElement('div');
      priceLine.className = 'absolute left-0 pointer-events-none';
      priceLine.style.top = `${currentY}px`;
      priceLine.style.height = '2px';
      priceLine.style.right = '140px';
      priceLine.style.backgroundColor = '#10b981';
      priceLine.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.6)';
      container.appendChild(priceLine);

      const priceLabel = document.createElement('div');
      priceLabel.className = 'absolute px-2 py-1 text-xs font-bold rounded shadow-lg pointer-events-none';
      priceLabel.style.top = `${currentY}px`;
      priceLabel.style.right = '4px';
      priceLabel.style.transform = 'translateY(-50%)';
      priceLabel.style.backgroundColor = '#10b981';
      priceLabel.style.color = '#fff';
      priceLabel.style.minWidth = '90px';
      priceLabel.style.textAlign = 'center';
      priceLabel.style.zIndex = '15';
      priceLabel.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
      priceLabel.textContent = `السعر: ${currentPrice.toFixed(2)}`;
      container.appendChild(priceLabel);
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
      isFullscreen ? "h-full" : "h-[550px]"
    )}>
      <div 
        ref={chartContainerRef} 
        className="absolute inset-0"
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
