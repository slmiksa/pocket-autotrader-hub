import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bell, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { usePriceAlerts, NewPriceAlert } from '@/hooks/usePriceAlerts';

interface PriceAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  market: {
    name: string;
    nameAr: string;
    symbol: string;
    category: string;
  };
  currentPrice?: number;
}

export const PriceAlertDialog = ({ 
  open, 
  onOpenChange, 
  market,
  currentPrice 
}: PriceAlertDialogProps) => {
  const { addAlert } = usePriceAlerts();
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!targetPrice || isNaN(Number(targetPrice))) {
      return;
    }

    setLoading(true);
    const newAlert: NewPriceAlert = {
      symbol: market.symbol,
      symbol_name_ar: market.nameAr,
      symbol_name_en: market.name,
      category: market.category,
      target_price: Number(targetPrice),
      condition
    };

    const success = await addAlert(newAlert);
    setLoading(false);
    
    if (success) {
      setTargetPrice('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Bell className="h-5 w-5 text-primary" />
            إضافة تنبيه سعري
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Market Info */}
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
            <p className="font-bold text-lg text-foreground">{market.nameAr}</p>
            <p className="text-sm text-muted-foreground">{market.name}</p>
            <span className="inline-block text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full mt-2">
              {market.category}
            </span>
            {currentPrice && (
              <p className="text-sm text-muted-foreground mt-2">
                السعر الحالي: <span className="text-primary font-medium">{currentPrice}</span>
              </p>
            )}
          </div>

          {/* Condition Selection */}
          <div className="space-y-2">
            <Label className="text-foreground">نوع التنبيه</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={condition === 'above' ? 'default' : 'outline'}
                className={`flex items-center gap-2 ${
                  condition === 'above' 
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                    : 'border-border/50 hover:border-emerald-500/50'
                }`}
                onClick={() => setCondition('above')}
              >
                <TrendingUp className="h-4 w-4" />
                عند الصعود فوق
              </Button>
              <Button
                type="button"
                variant={condition === 'below' ? 'default' : 'outline'}
                className={`flex items-center gap-2 ${
                  condition === 'below' 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'border-border/50 hover:border-red-500/50'
                }`}
                onClick={() => setCondition('below')}
              >
                <TrendingDown className="h-4 w-4" />
                عند الهبوط تحت
              </Button>
            </div>
          </div>

          {/* Target Price */}
          <div className="space-y-2">
            <Label htmlFor="targetPrice" className="text-foreground">السعر المستهدف</Label>
            <Input
              id="targetPrice"
              type="number"
              step="any"
              placeholder="أدخل السعر المستهدف..."
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="text-lg"
              dir="ltr"
            />
            
            {/* Quick price buttons based on current price */}
            {currentPrice && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">اختر سعر سريع:</p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '-5%', value: currentPrice * 0.95 },
                    { label: '-2%', value: currentPrice * 0.98 },
                    { label: '-1%', value: currentPrice * 0.99 },
                    { label: 'الحالي', value: currentPrice },
                    { label: '+1%', value: currentPrice * 1.01 },
                    { label: '+2%', value: currentPrice * 1.02 },
                    { label: '+5%', value: currentPrice * 1.05 },
                    { label: '+10%', value: currentPrice * 1.10 },
                  ].map((item) => (
                    <Button
                      key={item.label}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 hover:bg-primary/20 hover:border-primary"
                      onClick={() => setTargetPrice(item.value.toFixed(item.value < 1 ? 6 : 2))}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-primary font-medium">
                  السعر الحالي: {currentPrice.toFixed(currentPrice < 1 ? 6 : 2)}
                </p>
              </div>
            )}
            
            {targetPrice && (
              <p className="text-xs text-muted-foreground">
                {condition === 'above' 
                  ? `سيتم إشعارك عندما يصل السعر إلى ${targetPrice} أو أعلى`
                  : `سيتم إشعارك عندما يصل السعر إلى ${targetPrice} أو أقل`
                }
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit} 
            disabled={!targetPrice || loading}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : (
              <Bell className="h-4 w-4 ml-2" />
            )}
            إضافة التنبيه
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
