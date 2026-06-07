import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useGetSignal, useExecuteTrade, useListTrades, getGetSignalQueryKey, getListTradesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, Clock, Activity, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";

const ASSETS = ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "XAU/USD"];
const TIMEFRAMES = ["1m", "5m", "15m", "1h"];

export default function Trading() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [asset, setAsset] = useState(ASSETS[0]);
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[1]);
  
  // Refetch signal every 5 seconds
  const { data: signal, isLoading: signalLoading } = useGetSignal(
    { asset, timeframe },
    { query: { refetchInterval: 5000, enabled: !!user, queryKey: getGetSignalQueryKey({ asset, timeframe }) } }
  );

  const { data: trades, isLoading: tradesLoading } = useListTrades({ query: { enabled: !!user, queryKey: getListTradesQueryKey() } });
  
  const executeMutation = useExecuteTrade();

  const handleExecute = () => {
    if (!signal) return;
    if (signal.direction === "HOLD") {
      toast({ title: "Hold signal", description: "AI recommends waiting.", variant: "destructive" });
      return;
    }
    
    executeMutation.mutate(
      { data: { asset, timeframe, amount: 10, direction: signal.direction as "BUY"|"SELL", confidence: signal.confidence } },
      {
        onSuccess: () => {
          toast({ title: "Trade Executed", description: `Successfully placed ${signal.direction} order on ${asset}.` });
          queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
          queryClient.invalidateQueries({ queryKey: ["/api/users/me"] }); // update credits
        },
        onError: (err: any) => {
          toast({ title: "Execution Failed", description: err.response?.data?.error || "Error placing trade", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Trading</h1>
          <p className="text-muted-foreground">AI Market Analysis & Execution</p>
        </div>
        <div className="flex gap-4">
          <Select value={asset} onValueChange={setAsset}>
            <SelectTrigger className="w-[140px] bg-card" data-testid="select-asset">
              <SelectValue placeholder="Asset" />
            </SelectTrigger>
            <SelectContent>
              {ASSETS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[100px] bg-card" data-testid="select-timeframe">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              {TIMEFRAMES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Signal Panel */}
        <Card className="lg:col-span-2 border-border/50 shadow-xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <CardHeader className="border-b border-border/50 pb-4 bg-muted/30">
            <CardTitle className="flex justify-between items-center text-lg">
              <span className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> Real-time Analysis
              </span>
              <Badge variant="outline" className="font-mono bg-background">LIVE <span className="ml-2 w-2 h-2 rounded-full bg-primary animate-pulse" /></Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {signalLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : signal ? (
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <p className="text-sm font-mono text-muted-foreground tracking-widest">{signal.asset} • {signal.timeframe}</p>
                  <div className={`text-6xl md:text-7xl font-black tracking-tighter ${
                    signal.direction === 'BUY' ? 'text-primary drop-shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 
                    signal.direction === 'SELL' ? 'text-destructive drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'text-muted-foreground'
                  }`}>
                    {signal.direction}
                  </div>
                  <div className="flex justify-center mt-4">
                    <div className="bg-card border border-border/50 px-4 py-2 rounded-full flex items-center gap-2 shadow-inner">
                      <Target className="w-4 h-4 text-accent" />
                      <span className="font-mono font-bold text-lg">{signal.confidence}% Confidence</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 border-t border-border/50 pt-8">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground font-mono mb-1">RSI (14)</p>
                    <p className={`text-xl font-bold ${signal.rsi > 70 ? 'text-destructive' : signal.rsi < 30 ? 'text-primary' : 'text-foreground'}`}>
                      {signal.rsi.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center border-x border-border/50">
                    <p className="text-xs text-muted-foreground font-mono mb-1">EMA (9)</p>
                    <p className="text-xl font-bold">{signal.ema9.toFixed(4)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground font-mono mb-1">EMA (21)</p>
                    <p className="text-xl font-bold">{signal.ema21.toFixed(4)}</p>
                  </div>
                </div>

                <Button 
                  size="lg" 
                  className={`w-full h-16 text-xl font-bold font-mono tracking-wide ${
                    signal.direction === 'BUY' ? 'bg-primary hover:bg-primary/90' : 
                    signal.direction === 'SELL' ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : 'bg-muted'
                  }`}
                  disabled={signal.direction === 'HOLD' || executeMutation.isPending}
                  onClick={handleExecute}
                  data-testid="button-execute-trade"
                >
                  {executeMutation.isPending ? "EXECUTING..." : `EXECUTE ${signal.direction}`}
                </Button>
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">Error loading signal</div>
            )}
          </CardContent>
        </Card>

        {/* Recent Trades */}
        <Card className="border-border/50 shadow-sm flex flex-col">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" /> Recent Trades
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto max-h-[500px]">
            {tradesLoading ? (
               <div className="p-4 space-y-4">
                 {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
               </div>
            ) : trades && trades.length > 0 ? (
              <div className="divide-y divide-border/50">
                {trades.slice(0, 10).map(trade => (
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
                      <div className="text-xs font-mono mt-1 text-muted-foreground">1 CR</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <p>No trades executed yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
