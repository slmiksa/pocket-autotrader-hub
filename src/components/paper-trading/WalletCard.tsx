import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Wallet, TrendingUp, TrendingDown, RefreshCw, Edit3, Trophy, Target } from "lucide-react";
import { VirtualWallet } from "@/hooks/useVirtualWallet";

interface WalletCardProps {
  wallet: VirtualWallet | null;
  onResetWallet: () => Promise<boolean>;
  onUpdateBalance: (balance: number) => Promise<boolean>;
}

export const WalletCard = ({ wallet, onResetWallet, onUpdateBalance }: WalletCardProps) => {
  const [editOpen, setEditOpen] = useState(false);
  const [newBalance, setNewBalance] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    await onResetWallet();
    setIsResetting(false);
  };

  const handleUpdateBalance = async () => {
    const balance = parseFloat(newBalance);
    if (isNaN(balance) || balance < 0) return;
    await onUpdateBalance(balance);
    setEditOpen(false);
    setNewBalance("");
  };

  if (!wallet) return null;

  const profitLossPercent = wallet.initial_balance > 0 
    ? ((wallet.balance - wallet.initial_balance) / wallet.initial_balance * 100).toFixed(2)
    : "0";

  const winRate = wallet.total_trades > 0 
    ? ((wallet.winning_trades / wallet.total_trades) * 100).toFixed(1)
    : "0";

  return (
    <>
      <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <span>المحفظة الوهمية</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditOpen(true)}
                className="h-8 w-8"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReset}
                disabled={isResetting}
                className="h-8 w-8"
              >
                <RefreshCw className={`h-4 w-4 ${isResetting ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Balance */}
            <div className="text-center py-4 bg-background/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">الرصيد الحالي</p>
              <p className="text-3xl font-bold text-primary">
                ${wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className={`flex items-center justify-center gap-1 mt-2 text-sm ${
                wallet.total_profit_loss >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {wallet.total_profit_loss >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>{profitLossPercent}%</span>
                <span>(${wallet.total_profit_loss.toFixed(2)})</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background/50 p-3 rounded-lg text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Target className="h-4 w-4" />
                  <span className="text-xs">إجمالي الصفقات</span>
                </div>
                <p className="text-lg font-semibold">{wallet.total_trades}</p>
              </div>
              <div className="bg-background/50 p-3 rounded-lg text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Trophy className="h-4 w-4" />
                  <span className="text-xs">نسبة الفوز</span>
                </div>
                <p className="text-lg font-semibold text-primary">{winRate}%</p>
              </div>
              <div className="bg-green-500/10 p-3 rounded-lg text-center">
                <p className="text-xs text-green-500 mb-1">صفقات رابحة</p>
                <p className="text-lg font-semibold text-green-500">{wallet.winning_trades}</p>
              </div>
              <div className="bg-red-500/10 p-3 rounded-lg text-center">
                <p className="text-xs text-red-500 mb-1">صفقات خاسرة</p>
                <p className="text-lg font-semibold text-red-500">{wallet.losing_trades}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Balance Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل رصيد المحفظة</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm text-muted-foreground mb-2 block">
              الرصيد الجديد ($)
            </label>
            <Input
              type="number"
              value={newBalance}
              onChange={(e) => setNewBalance(e.target.value)}
              placeholder="أدخل الرصيد الجديد"
              min="0"
              step="100"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdateBalance}>
              تحديث الرصيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
