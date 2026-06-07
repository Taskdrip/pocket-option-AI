import { useState } from "react";
import { useGetSignal, getGetSignalQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Activity, ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const ASSETS = ["BTC/USD", "ETH/USD", "SOL/USD", "TON/USD", "EUR/USD", "XAU/USD"];
const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1d"];

export default function Signals() {
  const [asset, setAsset] = useState("BTC/USD");
  const [timeframe, setTimeframe] = useState("15m");

  const { data: signal, isLoading } = useGetSignal(
    { asset, timeframe },
    { query: { enabled: !!asset && !!timeframe, queryKey: getGetSignalQueryKey({ asset, timeframe }), refetchInterval: 10000 } }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-tight">AI SIGNALS</h1>
        <p className="text-muted-foreground font-mono text-sm">Real-time market analysis and predictions</p>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="font-mono text-lg">Market Parameters</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="space-y-2 flex-1">
            <Label className="font-mono text-xs text-muted-foreground uppercase">Asset Pair</Label>
            <Select value={asset} onValueChange={setAsset}>
              <SelectTrigger className="font-mono bg-background">
                <SelectValue placeholder="Select asset" />
              </SelectTrigger>
              <SelectContent>
                {ASSETS.map(a => (
                  <SelectItem key={a} value={a} className="font-mono">{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 flex-1">
            <Label className="font-mono text-xs text-muted-foreground uppercase">Timeframe</Label>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="font-mono bg-background">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                {TIMEFRAMES.map(t => (
                  <SelectItem key={t} value={t} className="font-mono">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center border border-border/50 rounded-lg bg-card/50 backdrop-blur">
          <Activity className="w-8 h-8 animate-pulse text-muted-foreground" />
        </div>
      ) : signal ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className={`col-span-1 md:col-span-2 border-border/50 bg-card/50 backdrop-blur overflow-hidden relative`}>
            {signal.direction === 'BUY' && <div className="absolute inset-0 bg-primary/5 pointer-events-none" />}
            {signal.direction === 'SELL' && <div className="absolute inset-0 bg-destructive/5 pointer-events-none" />}
            
            <CardHeader>
              <CardTitle className="font-mono flex items-center justify-between">
                <span>SIGNAL OUTPUT</span>
                <Badge 
                  variant="outline" 
                  className={`font-mono px-3 py-1 text-sm border-2 ${
                    signal.direction === 'BUY' ? 'border-primary text-primary' : 
                    signal.direction === 'SELL' ? 'border-destructive text-destructive' : 
                    'border-muted-foreground text-muted-foreground'
                  }`}
                >
                  {signal.direction === 'BUY' && <TrendingUp className="w-4 h-4 mr-2 inline" />}
                  {signal.direction === 'SELL' && <TrendingDown className="w-4 h-4 mr-2 inline" />}
                  {signal.direction === 'HOLD' && <ArrowRight className="w-4 h-4 mr-2 inline" />}
                  {signal.direction}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between font-mono text-sm">
                  <span className="text-muted-foreground">Confidence</span>
                  <span className={signal.confidence >= 75 ? 'text-primary font-bold' : ''}>{signal.confidence}%</span>
                </div>
                <Progress 
                  value={signal.confidence} 
                  className="h-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
                <div>
                  <div className="font-mono text-xs text-muted-foreground mb-1">RSI (14)</div>
                  <div className={`font-mono text-xl ${signal.rsi > 70 ? 'text-destructive' : signal.rsi < 30 ? 'text-primary' : ''}`}>
                    {signal.rsi.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="font-mono text-xs text-muted-foreground mb-1">EMA (9)</div>
                  <div className="font-mono text-xl">{signal.ema9.toFixed(2)}</div>
                </div>
                <div>
                  <div className="font-mono text-xs text-muted-foreground mb-1">EMA (21)</div>
                  <div className="font-mono text-xl">{signal.ema21.toFixed(2)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50 bg-card/50 backdrop-blur">
             <CardHeader>
              <CardTitle className="font-mono text-sm text-muted-foreground">ANALYSIS</CardTitle>
            </CardHeader>
            <CardContent className="font-mono text-sm space-y-4">
              <p>
                {signal.direction === 'BUY' ? 
                  `Strong bullish divergence detected on ${timeframe} timeframe. RSI indicating oversold conditions with EMA cross pending.` :
                 signal.direction === 'SELL' ? 
                  `Bearish momentum building on ${timeframe} timeframe. RSI near overbought levels. Proceed with caution.` :
                  `Market consolidating on ${timeframe} timeframe. Awaiting clear breakout or breakdown.`
                }
              </p>
              <div className="p-3 bg-background rounded border border-border">
                <div className="text-xs text-muted-foreground mb-1">Recommendation</div>
                <div>
                  {signal.confidence >= 80 ? 'High probability setup. Execute trade.' : 
                   signal.confidence >= 60 ? 'Moderate probability. Size position accordingly.' : 
                   'Low probability. Monitor only.'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center border border-border/50 rounded-lg bg-card/50 backdrop-blur text-muted-foreground font-mono">
          Failed to load signal data
        </div>
      )}
    </div>
  );
}
