import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Target, Shield, AlertTriangle, ArrowUp, ArrowDown, Zap } from 'lucide-react';

interface TradingLevel {
  price: number;
  type: 'resistance' | 'support' | 'call_entry' | 'put_entry' | 'target_up' | 'target_down' | 'pivot' | 'swing_high' | 'swing_low' | 'stop_loss';
  label: string;
  labelAr: string;
  color: string;
  strength: number;
}

interface LevelsPanelProps {
  levels: TradingLevel[];
  currentPrice: number;
}

const getIcon = (type: string) => {
  switch (type) {
    case 'call_entry': return <Zap className="w-4 h-4" />;
    case 'put_entry': return <Zap className="w-4 h-4" />;
    case 'target_up': return <Target className="w-4 h-4" />;
    case 'target_down': return <Target className="w-4 h-4" />;
    case 'stop_loss': return <AlertTriangle className="w-4 h-4" />;
    case 'resistance': return <ArrowUp className="w-4 h-4" />;
    case 'support': return <ArrowDown className="w-4 h-4" />;
    case 'swing_high': return <TrendingUp className="w-4 h-4" />;
    case 'swing_low': return <TrendingDown className="w-4 h-4" />;
    default: return <Shield className="w-4 h-4" />;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'call_entry': return 'دخول شراء';
    case 'put_entry': return 'دخول بيع';
    case 'target_up': return 'هدف صعود';
    case 'target_down': return 'هدف هبوط';
    case 'stop_loss': return 'ستوب لوز';
    case 'resistance': return 'مقاومة';
    case 'support': return 'دعم';
    case 'swing_high': return 'قمة';
    case 'swing_low': return 'قاع';
    case 'pivot': return 'المحور';
    default: return type;
  }
};

const LevelsPanel = ({ levels, currentPrice }: LevelsPanelProps) => {
  // Group levels by category
  const entryLevels = levels.filter(l => l.type === 'call_entry' || l.type === 'put_entry');
  const stopLossLevels = levels.filter(l => l.type === 'stop_loss');
  const targetLevels = levels.filter(l => l.type === 'target_up' || l.type === 'target_down');
  const swingLevels = levels.filter(l => l.type === 'swing_high' || l.type === 'swing_low');
  const otherLevels = levels.filter(l => !['call_entry', 'put_entry', 'stop_loss', 'target_up', 'target_down', 'swing_high', 'swing_low'].includes(l.type));

  const renderLevel = (level: TradingLevel) => {
    const distance = ((level.price - currentPrice) / currentPrice) * 100;
    const isAbove = level.price > currentPrice;
    
    return (
      <div 
        key={`${level.type}-${level.price}`}
        className="flex items-center justify-between p-2 rounded-lg border border-border/50 hover:border-border transition-colors"
        style={{ borderLeftColor: level.color, borderLeftWidth: '4px' }}
      >
        <div className="flex items-center gap-2">
          <div style={{ color: level.color }}>{getIcon(level.type)}</div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{getTypeLabel(level.type)}</p>
            <p className="font-mono font-bold text-sm" style={{ color: level.color }}>${level.price.toFixed(2)}</p>
          </div>
        </div>
        <Badge 
          variant="outline" 
          className={cn(
            "text-xs font-mono",
            isAbove ? "text-red-400 border-red-500/30" : "text-green-400 border-green-500/30"
          )}
        >
          {isAbove ? '+' : ''}{distance.toFixed(2)}%
        </Badge>
      </div>
    );
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-right flex items-center justify-between">
          <Badge variant="outline" className="text-xs font-mono bg-amber-500/20 text-amber-400 border-amber-500/50">
            ${currentPrice.toFixed(2)}
          </Badge>
          <span>مستويات التداول</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
        {/* Entry Levels */}
        {entryLevels.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2 text-right flex items-center justify-end gap-1">
              <Zap className="w-3 h-3" /> نقاط الدخول
            </h4>
            <div className="space-y-2">
              {entryLevels.map(renderLevel)}
            </div>
          </div>
        )}

        {/* Stop Loss Levels */}
        {stopLossLevels.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2 text-right flex items-center justify-end gap-1">
              <AlertTriangle className="w-3 h-3" /> ستوب لوز
            </h4>
            <div className="space-y-2">
              {stopLossLevels.map(renderLevel)}
            </div>
          </div>
        )}

        {/* Target Levels */}
        {targetLevels.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2 text-right flex items-center justify-end gap-1">
              <Target className="w-3 h-3" /> الأهداف
            </h4>
            <div className="space-y-2">
              {targetLevels.map(renderLevel)}
            </div>
          </div>
        )}

        {/* Swing Points */}
        {swingLevels.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2 text-right flex items-center justify-end gap-1">
              <TrendingUp className="w-3 h-3" /> القمم والقيعان
            </h4>
            <div className="space-y-2">
              {swingLevels.map(renderLevel)}
            </div>
          </div>
        )}

        {/* Support/Resistance */}
        {otherLevels.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2 text-right flex items-center justify-end gap-1">
              <Shield className="w-3 h-3" /> الدعم والمقاومة
            </h4>
            <div className="space-y-2">
              {otherLevels.map(renderLevel)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LevelsPanel;