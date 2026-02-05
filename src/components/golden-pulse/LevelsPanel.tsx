import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TradingLevel {
  price: number;
   type: 'resistance' | 'support' | 'call_entry' | 'put_entry' | 'target_up' | 'target_down' | 'pivot';
  label: string;
  labelAr: string;
  color: string;
  strength: number;
}

interface LevelsPanelProps {
  levels: TradingLevel[];
  currentPrice: number;
}

const LevelsPanel = ({ levels, currentPrice }: LevelsPanelProps) => {
  const getIcon = (type: TradingLevel['type']) => {
    switch (type) {
      case 'call_entry':
        return <TrendingUp className="h-4 w-4" />;
      case 'put_entry':
        return <TrendingDown className="h-4 w-4" />;
      case 'resistance':
      case 'support':
        return <Shield className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: TradingLevel['type']) => {
    switch (type) {
      case 'call_entry':
        return 'دخول CALL';
      case 'put_entry':
        return 'دخول PUT';
      case 'resistance':
        return 'مقاومة';
      case 'support':
        return 'دعم';
      case 'target_up':
        return 'هدف صعود';
      case 'target_down':
        return 'هدف هبوط';
       case 'pivot':
         return 'المحور';
       default:
         return '';
    }
  };

  const sortedLevels = [...levels].sort((a, b) => b.price - a.price);

  const entriesAndSR = sortedLevels.filter(l => 
     ['call_entry', 'put_entry', 'resistance', 'support', 'pivot'].includes(l.type)
  );
  
  const targetsUp = sortedLevels.filter(l => l.type === 'target_up');
  const targetsDown = sortedLevels.filter(l => l.type === 'target_down');

  return (
    <Card className="border-amber-500/30 bg-card">
      <CardContent className="py-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-amber-500" />
          مستويات التداول الحية
        </h3>

        {/* Main Entry Levels */}
        <div className="space-y-2 mb-4">
          {entriesAndSR.map((level, idx) => {
            const isAbovePrice = level.price > currentPrice;
            const distance = ((level.price - currentPrice) / currentPrice * 100).toFixed(2);
            
            return (
              <div 
                key={`${level.type}-${idx}`}
                className={cn(
                  "flex items-center justify-between p-2 rounded-lg border",
                  level.type === 'call_entry' && "bg-green-500/10 border-green-500/30",
                  level.type === 'put_entry' && "bg-red-500/10 border-red-500/30",
                  level.type === 'resistance' && "bg-yellow-500/10 border-yellow-500/30",
                   level.type === 'support' && "bg-yellow-500/10 border-yellow-500/30",
                   level.type === 'pivot' && "bg-purple-500/10 border-purple-500/30"
                )}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: level.color }}
                  />
                  <span className="text-sm font-medium">{getTypeLabel(level.type)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: level.color }}>
                    {level.price.toFixed(2)}
                  </span>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      isAbovePrice ? "text-green-400 border-green-500/50" : "text-red-400 border-red-500/50"
                    )}
                  >
                    {isAbovePrice ? '+' : ''}{distance}%
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>

        {/* Targets Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Targets Up */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              أهداف الصعود
            </p>
            {targetsUp.map((level, idx) => (
              <div 
                key={`up-${idx}`}
                className="flex items-center justify-between text-xs p-1.5 rounded bg-green-500/10"
              >
                <span className="text-green-400">هدف {idx + 1}</span>
                <span className="font-mono text-green-400">{level.price.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Targets Down */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-red-500" />
              أهداف الهبوط
            </p>
            {targetsDown.map((level, idx) => (
              <div 
                key={`down-${idx}`}
                className="flex items-center justify-between text-xs p-1.5 rounded bg-red-500/10"
              >
                <span className="text-red-400">هدف {idx + 1}</span>
                <span className="font-mono text-red-400">{level.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LevelsPanel;
