import { Bell, BellOff, Trash2, TrendingUp, TrendingDown, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { usePriceAlerts } from '@/hooks/usePriceAlerts';
import { useNavigate } from 'react-router-dom';

export const PriceAlertsList = () => {
  const navigate = useNavigate();
  const { alerts, loading, deleteAlert, toggleAlert } = usePriceAlerts();

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-[hsl(215,20%,65%)]" />
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-12 text-[hsl(215,20%,65%)]">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-orange-500/10 flex items-center justify-center">
          <Bell className="h-10 w-10 text-orange-500/40" />
        </div>
        <p className="text-lg font-medium text-[hsl(210,40%,98%)]">لا توجد تنبيهات سعرية</p>
        <p className="text-sm mt-1">أضف تنبيهات من صفحة الأسواق</p>
        <Button 
          variant="outline" 
          className="mt-4 border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400" 
          onClick={() => navigate('/markets')}
        >
          <Bell className="h-4 w-4 ml-2" />
          تصفح الأسواق
        </Button>
      </div>
    );
  }

  const activeAlerts = alerts.filter(a => a.is_active && !a.triggered_at);
  const triggeredAlerts = alerts.filter(a => a.triggered_at);
  const inactiveAlerts = alerts.filter(a => !a.is_active && !a.triggered_at);

  return (
    <div className="space-y-6">
      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-[hsl(215,20%,65%)] mb-3 flex items-center gap-2">
            <Bell className="h-4 w-4 text-orange-400" />
            تنبيهات نشطة ({activeAlerts.length})
          </h4>
          <div className="space-y-3">
            {activeAlerts.map(alert => (
              <AlertCard 
                key={alert.id} 
                alert={alert} 
                onDelete={deleteAlert} 
                onToggle={toggleAlert}
              />
            ))}
          </div>
        </div>
      )}

      {/* Triggered Alerts */}
      {triggeredAlerts.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-[hsl(215,20%,65%)] mb-3 flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-500" />
            تنبيهات تم تفعيلها ({triggeredAlerts.length})
          </h4>
          <div className="space-y-3">
            {triggeredAlerts.map(alert => (
              <AlertCard 
                key={alert.id} 
                alert={alert} 
                onDelete={deleteAlert} 
                onToggle={toggleAlert}
                triggered
              />
            ))}
          </div>
        </div>
      )}

      {/* Inactive Alerts */}
      {inactiveAlerts.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-[hsl(215,20%,65%)] mb-3 flex items-center gap-2">
            <BellOff className="h-4 w-4 text-[hsl(215,20%,50%)]" />
            تنبيهات متوقفة ({inactiveAlerts.length})
          </h4>
          <div className="space-y-3">
            {inactiveAlerts.map(alert => (
              <AlertCard 
                key={alert.id} 
                alert={alert} 
                onDelete={deleteAlert} 
                onToggle={toggleAlert}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface AlertCardProps {
  alert: {
    id: string;
    symbol: string;
    symbol_name_ar: string;
    symbol_name_en: string;
    category: string;
    target_price: number;
    condition: 'above' | 'below';
    is_active: boolean;
    triggered_at: string | null;
    created_at: string;
  };
  onDelete: (id: string) => Promise<boolean>;
  onToggle: (id: string, isActive: boolean) => Promise<boolean>;
  triggered?: boolean;
}

const AlertCard = ({ alert, onDelete, onToggle, triggered }: AlertCardProps) => {
  const navigate = useNavigate();

  return (
    <Card 
      className={`p-4 border-[hsl(217,33%,17%)] bg-[hsl(217,33%,12%)] hover:border-orange-500/30 transition-all cursor-pointer ${
        triggered ? 'border-emerald-500/30 bg-emerald-500/5' : ''
      } ${!alert.is_active && !triggered ? 'opacity-60' : ''}`}
      onClick={() => navigate(`/live-chart?symbol=${alert.symbol}`)}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-[hsl(210,40%,98%)]">{alert.symbol_name_ar}</p>
            {triggered && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
                تم تفعيله
              </span>
            )}
          </div>
          <p className="text-xs text-[hsl(215,20%,50%)]">{alert.symbol_name_en}</p>
          
          <div className="flex items-center gap-2 mt-2">
            <span className={`flex items-center gap-1 text-sm font-medium ${
              alert.condition === 'above' ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {alert.condition === 'above' ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {alert.condition === 'above' ? 'فوق' : 'تحت'} {alert.target_price}
            </span>
            <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
              {alert.category}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
          {!triggered && (
            <Switch
              checked={alert.is_active}
              onCheckedChange={(checked) => onToggle(alert.id, checked)}
              className="data-[state=checked]:bg-primary"
            />
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-red-400/60 hover:text-red-400 hover:bg-red-500/10"
            onClick={() => onDelete(alert.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
