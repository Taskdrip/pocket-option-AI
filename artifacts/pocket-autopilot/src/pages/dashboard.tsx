import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useGetTradeStats, useListTrades, useGetSignal, useUpdateBotStatus } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, ArrowDownRight, ArrowUpRight, Loader2, Power, Settings2, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [asset, setAsset] = useState("EURUSD");
  const [timeframe, setTimeframe] = useState("M1");

  const { data: stats } = useGetTradeStats();
  const { data: trades } = useListTrades();
  const { data: signal } = useGetSignal({ asset, timeframe });
  
  const updateBot = useUpdateBotStatus();

  const handleBotToggle = (checked: boolean) => {
    updateBot.mutate({ data: { botActive: checked } }, {
      onSuccess: (updatedUser) => {
        queryClient.setQueryData(getGetMeQueryKey(), updatedUser);
      }
    });
  };

  const winRate = stats?.winRate ?? 0;
  const isProfitable = winRate > 50;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">COMMAND CENTER</h1>
          <p className="text-muted-foreground text-sm">Real-time market execution matrix.</p>
        </div>
        <div className="flex items-center gap-4 bg-card px-4 py-2 rounded-lg border border-border">
          <span className="font-display text-sm font-bold text-muted-foreground uppercase tracking-widest">Bot Status</span>
          <div className="flex items-center gap-2">
            <Switch checked={user?.botActive} onCheckedChange={handleBotToggle} />
            <span className={`text-sm font-bold ${user?.botActive ? 'text-success' : 'text-muted-foreground'}`}>
              {user?.botActive ? 'ACTIVE' : 'STANDBY'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-display tracking-widest uppercase">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold font-display ${isProfitable ? 'text-success' : 'text-destructive'}`}>
              {winRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-display tracking-widest uppercase">Total Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display text-foreground">
              {stats?.totalTrades || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-display tracking-widest uppercase">Wins / Losses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-display flex gap-2">
              <span className="text-success">{stats?.wins || 0}W</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-destructive">{stats?.losses || 0}L</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-display tracking-widest uppercase">Credits Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display text-foreground">
              ${stats?.creditsSpent?.toFixed(2) || "0.00"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Signal Widget */}
        <Card className="col-span-1 border-border relative overflow-hidden bg-card">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg tracking-wide uppercase">
              <Activity className="w-5 h-5 text-primary" /> AI Signal Matrix
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-2">
              <Select value={asset} onValueChange={setAsset}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Asset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EURUSD">EUR/USD</SelectItem>
                  <SelectItem value="GBPUSD">GBP/USD</SelectItem>
                  <SelectItem value="USDJPY">USD/JPY</SelectItem>
                </SelectContent>
              </Select>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M1">M1</SelectItem>
                  <SelectItem value="M5">M5</SelectItem>
                  <SelectItem value="M15">M15</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {signal ? (
              <div className="p-6 bg-background rounded-lg border border-border text-center space-y-4">
                <div className="text-xs text-muted-foreground uppercase tracking-widest font-display">Target Action</div>
                <div className={`text-4xl font-black font-display tracking-tight flex items-center justify-center gap-2
                  ${signal.direction === 'BUY' ? 'text-success' : signal.direction === 'SELL' ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {signal.direction === 'BUY' && <ArrowUpRight className="w-8 h-8" />}
                  {signal.direction === 'SELL' && <ArrowDownRight className="w-8 h-8" />}
                  {signal.direction === 'HOLD' && <ShieldAlert className="w-8 h-8" />}
                  {signal.direction}
                </div>
                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border/50 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs">CONF</div>
                    <div className="font-bold">{signal.confidence.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">RSI</div>
                    <div className="font-bold">{signal.rsi.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Trend</div>
                    <div className="font-bold">{signal.ema9 > signal.ema21 ? 'UP' : 'DOWN'}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center border border-dashed border-border rounded-lg bg-background/50">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <span className="text-sm">Calculating vectors...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trade Log */}
        <Card className="col-span-1 lg:col-span-2 border-border bg-card">
          <CardHeader>
            <CardTitle className="font-display text-lg tracking-wide uppercase flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-primary" /> Execution Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-background/50 border-b border-border font-display tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Asset</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3 text-right">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {!trades || trades.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted-foreground">No execution history found.</td>
                    </tr>
                  ) : (
                    trades.map((trade) => (
                      <tr key={trade.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{format(new Date(trade.createdAt), "HH:mm:ss dd/MM")}</td>
                        <td className="px-4 py-3 font-bold">{trade.asset} ({trade.timeframe})</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${trade.direction === 'BUY' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                            {trade.direction}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono">${trade.amount.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-bold ${trade.result === 'win' ? 'text-success' : 'text-destructive'}`}>
                            {trade.result.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
