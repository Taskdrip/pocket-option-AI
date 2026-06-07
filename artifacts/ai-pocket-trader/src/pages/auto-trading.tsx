import { useState, useEffect, useRef } from "react";
import { useGetMe, useGetSignal, useUpdateBotStatus, useExecuteTrade, getGetMeQueryKey, getGetSignalQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Bot, Zap, Play, Square, Activity, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const ASSETS = ["BTC/USD", "ETH/USD", "SOL/USD", "TON/USD", "EUR/USD", "XAU/USD"];
const TIMEFRAMES = ["1m", "5m", "15m", "1h"];

export default function AutoTrading() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user } = useGetMe();
  
  const [asset, setAsset] = useState("BTC/USD");
  const [timeframe, setTimeframe] = useState("5m");
  const [tradeAmount, setTradeAmount] = useState(10);
  
  const [countdown, setCountdown] = useState<number | null>(null);
  const [pendingSignal, setPendingSignal] = useState<any | null>(null);
  
  const updateBot = useUpdateBotStatus();
  const executeTrade = useExecuteTrade();

  // Polling signal only if bot is active
  const { data: signal, isFetching } = useGetSignal(
    { asset, timeframe },
    { 
      query: { 
        enabled: !!user?.botActive, 
        queryKey: getGetSignalQueryKey({ asset, timeframe }), 
        refetchInterval: user?.botActive ? 10000 : false 
      } 
    }
  );

  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedSignalRef = useRef<string | null>(null);

  // Check credits
  useEffect(() => {
    if (user?.botActive && user.credits <= 0) {
      updateBot.mutate({ data: { botActive: false } });
      toast({
        title: "Insufficient Credits",
        description: "Bot stopped. You need to top up credits to continue auto-trading.",
        variant: "destructive",
      });
    }
  }, [user?.botActive, user?.credits, updateBot, toast]);

  // Handle new signals
  useEffect(() => {
    if (!user?.botActive || !signal) return;
    
    // Create a unique hash for the signal to avoid processing the same one twice
    const signalHash = `${signal.asset}-${signal.timeframe}-${signal.direction}-${signal.confidence}-${Date.now()}`;
    
    // Process if it's a strong buy/sell signal and we haven't processed it recently
    if (
      signal.direction !== 'HOLD' && 
      signal.confidence >= 75 && 
      lastProcessedSignalRef.current !== signalHash &&
      countdown === null &&
      !pendingSignal
    ) {
      lastProcessedSignalRef.current = signalHash;
      setPendingSignal(signal);
      setCountdown(5);
    }
  }, [signal, user?.botActive, countdown, pendingSignal]);

  // Handle countdown and execution
  useEffect(() => {
    if (countdown === null || !pendingSignal) return;

    if (countdown > 0) {
      countdownTimerRef.current = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => {
        if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
      };
    }

    // Countdown reached 0
    else {
      if (user?.autoConfirm) {
        handleTradeExecution(pendingSignal);
      }
      // If not autoConfirm, the user has 5 more seconds to click before it clears
      countdownTimerRef.current = setTimeout(() => {
        setCountdown(null);
        setPendingSignal(null);
      }, 5000);
      
      return () => {
        if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
      };
    }
  }, [countdown, pendingSignal, user?.autoConfirm]);

  const handleTradeExecution = (sig: any) => {
    if (executeTrade.isPending) return;
    
    executeTrade.mutate(
      { 
        data: {
          asset: sig.asset,
          timeframe: sig.timeframe,
          amount: tradeAmount,
          direction: sig.direction as "BUY" | "SELL",
          confidence: sig.confidence
        }
      },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          toast({
            title: `Trade Executed: ${data.direction} ${data.asset}`,
            description: `Amount: $${data.amount} | Status: ${data.result}`,
          });
          setCountdown(null);
          setPendingSignal(null);
        },
        onError: (error) => {
          toast({
            title: "Trade Failed",
            description: error.data?.error || "Failed to execute trade",
            variant: "destructive",
          });
          setCountdown(null);
          setPendingSignal(null);
        }
      }
    );
  };

  const toggleBot = (active: boolean) => {
    if (active && (user?.credits || 0) <= 0) {
      toast({
        title: "Cannot start bot",
        description: "You need to top up credits first.",
        variant: "destructive",
      });
      return;
    }
    
    updateBot.mutate({ data: { botActive: active } });
    if (!active) {
      setCountdown(null);
      setPendingSignal(null);
    }
  };

  const toggleAutoConfirm = (active: boolean) => {
    updateBot.mutate({ data: { autoConfirm: active } });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-tight">AUTO TRADING</h1>
          <p className="text-muted-foreground font-mono text-sm">Configure bot parameters and execution settings</p>
        </div>
        
        {user?.botActive && (
          <Badge className="font-mono bg-primary/20 text-primary border-primary animate-pulse">
            <Activity className="w-3 h-3 mr-1" />
            BOT RUNNING
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="font-mono text-lg flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                Control Panel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-background">
                <div className="space-y-0.5">
                  <Label className="font-mono text-base">Bot Engine</Label>
                  <p className="text-xs text-muted-foreground font-mono">Master switch</p>
                </div>
                <Switch 
                  checked={user?.botActive || false} 
                  onCheckedChange={toggleBot} 
                  disabled={updateBot.isPending}
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-background">
                <div className="space-y-0.5">
                  <Label className="font-mono text-base">Auto-Confirm</Label>
                  <p className="text-xs text-muted-foreground font-mono">Execute without prompt</p>
                </div>
                <Switch 
                  checked={user?.autoConfirm || false} 
                  onCheckedChange={toggleAutoConfirm}
                  disabled={updateBot.isPending || !user?.botActive}
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <div className="space-y-2">
                  <Label className="font-mono text-xs text-muted-foreground uppercase">Target Asset</Label>
                  <Select value={asset} onValueChange={setAsset} disabled={user?.botActive}>
                    <SelectTrigger className="font-mono bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSETS.map(a => <SelectItem key={a} value={a} className="font-mono">{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-mono text-xs text-muted-foreground uppercase">Timeframe</Label>
                  <Select value={timeframe} onValueChange={setTimeframe} disabled={user?.botActive}>
                    <SelectTrigger className="font-mono bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEFRAMES.map(t => <SelectItem key={t} value={t} className="font-mono">{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-mono text-xs text-muted-foreground uppercase">Trade Amount (USD)</Label>
                  <Input 
                    type="number" 
                    min={1} 
                    value={tradeAmount} 
                    onChange={(e) => setTradeAmount(Number(e.target.value))}
                    disabled={user?.botActive}
                    className="font-mono bg-background"
                  />
                </div>
              </div>

              <Button 
                className="w-full font-mono uppercase tracking-wider" 
                variant={user?.botActive ? "destructive" : "default"}
                onClick={() => toggleBot(!user?.botActive)}
                disabled={updateBot.isPending}
              >
                {user?.botActive ? (
                  <><Square className="w-4 h-4 mr-2" /> Stop Bot</>
                ) : (
                  <><Play className="w-4 h-4 mr-2" /> Start Bot</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur h-full min-h-[400px]">
            <CardHeader>
              <CardTitle className="font-mono text-lg flex items-center justify-between">
                <span>Signal Monitor</span>
                {isFetching && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              </CardTitle>
              <CardDescription className="font-mono text-xs">
                Waiting for high confidence ({'>'}=75%) {asset} signals on {timeframe} timeframe
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[calc(100%-80px)] flex flex-col items-center justify-center relative">
              
              {!user?.botActive ? (
                <div className="text-center text-muted-foreground space-y-4">
                  <Bot className="w-16 h-16 mx-auto opacity-20" />
                  <p className="font-mono text-sm uppercase tracking-widest">Bot is offline</p>
                </div>
              ) : pendingSignal && countdown !== null ? (
                <div className={`p-8 border rounded-xl w-full max-w-md text-center shadow-2xl relative overflow-hidden ${
                  pendingSignal.direction === 'BUY' ? 'border-primary/50 bg-primary/5' : 'border-destructive/50 bg-destructive/5'
                }`}>
                  <div className="absolute top-0 left-0 h-1 bg-muted-foreground w-full">
                    <div 
                      className={`h-full transition-all duration-1000 ease-linear ${
                        pendingSignal.direction === 'BUY' ? 'bg-primary' : 'bg-destructive'
                      }`} 
                      style={{ width: `${(countdown / 5) * 100}%` }}
                    />
                  </div>
                  
                  <Badge variant="outline" className={`mb-4 px-3 py-1 font-mono border-2 ${
                    pendingSignal.direction === 'BUY' ? 'border-primary text-primary' : 'border-destructive text-destructive'
                  }`}>
                    {pendingSignal.direction} SIGNAL DETECTED
                  </Badge>
                  
                  <div className="font-mono text-4xl font-bold mb-2">{countdown > 0 ? countdown : 0}s</div>
                  <p className="font-mono text-sm text-muted-foreground mb-6">
                    {pendingSignal.asset} @ {pendingSignal.timeframe} | Conf: {pendingSignal.confidence}%
                  </p>
                  
                  {countdown === 0 && !user?.autoConfirm ? (
                    <Button 
                      className={`w-full font-mono font-bold ${
                        pendingSignal.direction === 'BUY' ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                      }`}
                      size="lg"
                      onClick={() => handleTradeExecution(pendingSignal)}
                      disabled={executeTrade.isPending}
                    >
                      {executeTrade.isPending ? "EXECUTING..." : "CONFIRM TRADE NOW"}
                    </Button>
                  ) : countdown === 0 && user?.autoConfirm ? (
                    <div className="font-mono text-sm uppercase animate-pulse">Executing automatically...</div>
                  ) : (
                    <div className="font-mono text-sm uppercase text-muted-foreground">
                      {user?.autoConfirm ? "Auto-executing in..." : "Waiting for manual confirm..."}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-muted-foreground space-y-4">
                  <Activity className="w-16 h-16 mx-auto opacity-20 animate-pulse" />
                  <p className="font-mono text-sm uppercase tracking-widest">Scanning market...</p>
                  <p className="font-mono text-xs opacity-50">Deducts 1 credit per executed trade</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
