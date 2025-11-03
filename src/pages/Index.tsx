import { useState } from "react";
import { TradingDashboard } from "@/components/trading/TradingDashboard";
import { SignalHistory } from "@/components/trading/SignalHistory";
import { SettingsPanel } from "@/components/trading/SettingsPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { BarChart3, Settings, History, TrendingUp } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-background dark">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary p-2">
                <TrendingUp className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">PocketOption Auto Trader</h1>
                <p className="text-sm text-muted-foreground">نظام التداول الآلي من تيليجرام</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm text-muted-foreground">متصل</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">لوحة التحكم</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">السجل</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">الإعدادات</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <TradingDashboard />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <SignalHistory />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <SettingsPanel />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>تطوير: Salem Alquzi | تحذير: التداول يحمل مخاطر عالية. استخدم على مسؤوليتك الخاصة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
