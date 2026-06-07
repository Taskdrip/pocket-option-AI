import { useAuth } from "@/lib/auth";
import { useGetTradeStats, useUpdateBotStatus, useGetMe, getGetMeQueryKey, useListTrades, getGetTradeStatsQueryKey, getListTradesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, TrendingUp, TrendingDown, Target, Wallet, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: currentUser, isLoading: userLoading } = useGetMe();
  const { data: stats, isLoading: statsLoading } = useGetTradeStats({ query: { enabled: !!user, queryKey: getGetTradeStatsQueryKey() } });
  const { data: trades, isLoading: tradesLoading } = useListTrades({ query: { enabled: !!user, queryKey: getListTradesQueryKey() } });
  
  const updateBot = useUpdateBotStatus();
  
  const handleToggleBot = (checked: boolean) => {
    updateBot.mutate({ data: { botActive: checked } }, {
      onSuccess: (updatedUser) => {
        queryClient.setQueryData(getGetMeQueryKey(), updatedUser);
        toast({
          title: checked ? "Autopilot Engaged" : "Autopilot Disabled",
          description: checked ? "AI is now scanning markets." : "Manual control active.",
          variant: checked ? "default" : "destructive"
        });
      }
    });
  };

  const handleToggleAutoConfirm = (checked: boolean) => {
    updateBot.mutate({ data: { autoConfirm: checked } }, {
      onSuccess: (updatedUser) => {
        queryClient.setQueryData(getGetMeQueryKey(), updatedUser);
        toast({
          title: checked ? "Auto-Confirm Enabled" : "Auto-Confirm Disabled",
          description: "Execution preferences updated."
        });
      }
    });
  };

  const activeUser = currentUser || user;

  if (userLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  // Generate mock chart data based on win rate for visual effect
  const chartData = Array.from({ length: 20 }).map((_, i) => ({
    time: i,
    balance: 1000 + (Math.random() * 200 - 50) + (i * 20 * ((stats?.winRate || 50) / 100))
  }));

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
          <p className="text-muted-foreground">Welcome back, {activeUser?.username}. AI systems nominal.</p>
        </div>
        <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 shadow-sm">
          <div className="flex flex-col space-y-1">
            <Label className="text-xs text-muted-foreground font-mono">AUTOPILOT STATUS</Label>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${activeUser?.botActive ? 'bg-primary animate-pulse' : 'bg-destructive'}`} />
              <span className="font-medium">{activeUser?.botActive ? 'ONLINE' : 'OFFLINE'}</span>
            </div>
          </div>
          <Switch 
            checked={!!activeUser?.botActive} 
            onCheckedChange={handleToggleBot}
            data-testid="switch-bot-status"
            className="data-[state=checked]:bg-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground tracking-wide font-mono">AVAILABLE CREDITS</CardTitle>
            <Wallet className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black font-mono text-primary">{activeUser?.credits?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground mt-1 font-mono opacity-70">1 TRADE = 1 CREDIT</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground tracking-wide font-mono">WIN RATE</CardTitle>
            <Target className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black font-mono">{stats?.winRate?.toFixed(1) || "0.0"}%</div>
            <p className="text-xs text-muted-foreground mt-1 font-mono opacity-70">BASED ON {stats?.totalTrades || 0} TRADES</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground tracking-wide font-mono">PROFITABLE</CardTitle>
            <TrendingUp className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black font-mono text-primary">{stats?.wins || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-destructive/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground tracking-wide font-mono">LOSSES</CardTitle>
            <TrendingDown className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black font-mono text-destructive">{stats?.losses || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/50 shadow-sm flex flex-col">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Performance History
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-6">
             <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" hide />
                    <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                      itemStyle={{ color: 'hsl(var(--primary))' }}
                    />
                    <Area type="monotone" dataKey="balance" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm flex flex-col">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-auto max-h-[350px]">
            {tradesLoading ? (
               <div className="p-4 space-y-4">
                 {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
               </div>
            ) : trades && trades.length > 0 ? (
              <div className="divide-y divide-border/50">
                {trades.slice(0, 5).map(trade => (
                  <div key={trade.id} className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-bold font-mono ${trade.direction === 'BUY' ? 'text-primary' : 'text-destructive'}`}>
                          {trade.direction}
                        </span>
                        <span className="font-mono font-medium">{trade.asset}</span>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {new Date(trade.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className={`${
                        trade.result === 'win' ? 'border-primary/50 text-primary bg-primary/10' : 
                        trade.result === 'loss' ? 'border-destructive/50 text-destructive bg-destructive/10' : ''
                      }`}>
                        {trade.result.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <p>No recent trades.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            System Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/50 hover:border-primary/30 transition-colors">
            <div className="space-y-0.5">
              <Label className="text-base font-bold">Auto-Confirm Trades</Label>
              <p className="text-sm text-muted-foreground">
                Allow AI to execute trades without manual approval
              </p>
            </div>
            <Switch 
              checked={!!activeUser?.autoConfirm} 
              onCheckedChange={handleToggleAutoConfirm}
              data-testid="switch-auto-confirm"
              className="data-[state=checked]:bg-primary"
            />
          </div>
          
          {!activeUser?.pocketOptionId && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive-foreground flex items-center justify-between">
              <div>
                <p className="font-bold">Account Disconnected</p>
                <p className="text-sm opacity-80">Link your Pocket Option ID to start trading.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
