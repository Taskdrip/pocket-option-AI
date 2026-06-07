import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useGetSignal, useExecuteTrade, useListTrades, useUpdateBotStatus, useGetMe, getGetMeQueryKey, getGetSignalQueryKey, getListTradesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, Clock, Activity, Target, Bot, PlayCircle, Zap, AlertTriangle, CheckCircle, Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

const ASSETS = ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "XAU/USD", "GBP/JPY", "USD/CHF", "NAS100"];
const TIMEFRAMES = ["1m", "5m", "15m", "1h"];

type TradingMode = "autopilot" | "manual";

export default function Trading() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<TradingMode>("manual");
  const [asset, setAsset] = useState(ASSETS[0]);
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[1]);
  const [autopilotRunning, setAutopilotRunning] = useState(false);
  const [autoTradeCount, setAutoTradeCount] = useState(0);

  const { data: currentUser } = useGetMe();
  const activeUser = currentUser || user;

  const { data: signal, isLoading: signalLoading } = useGetSignal(
    { asset, timeframe },
    { query: { refetchInterval: autopilotRunning ? 5000 : (mode === "manual" ? 5000 : false), enabled: !!user, queryKey: getGetSignalQueryKey({ asset, timeframe }) } }
  );

  const { data: trades, isLoading: tradesLoading } = useListTrades({
    query: { enabled: !!user, queryKey: getListTradesQueryKey() }
  });

  const executeMutation = useExecuteTrade();
  const updateBotMutation = useUpdateBotStatus();

  const handleManualExecute = () => {
    if (!signal || signal.direction === "HOLD") {
      toast({ title: "No trade signal", description: "AI recommends holding — wait for a stronger setup.", variant: "destructive" });
      return;
    }
    executeMutation.mutate(
      { data: { asset, timeframe, amount: 10, direction: signal.direction as "BUY" | "SELL", confidence: signal.confidence } },
      {
        onSuccess: () => {
          toast({ title: "Trade Executed!", description: `${signal.direction} on ${asset} @ ${signal.confidence}% confidence` });
          queryClient.invalidateQueries({ queryKey: getListTradesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        },
        onError: (err: any) => {
          toast({ title: "Execution Failed", description: err?.response?.data?.error || "Insufficient credits or connection error", variant: "destructive" });
        }
      }
    );
  };

  // Autopilot: auto-execute trades when signal fires
  const handleAutoTrade = useCallback(() => {
    if (!signal || signal.direction === "HOLD" || !autopilotRunning) return;
    executeMutation.mutate(
      { data: { asset, timeframe, amount: 10, direction: signal.direction as "BUY" | "SELL", confidence: signal.confidence } },
      {
        onSuccess: () => {
          setAutoTradeCount(c => c + 1);
          queryClient.invalidateQueries({ queryKey: getListTradesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        }
      }
    );
  }, [signal, autopilotRunning, asset, timeframe, executeMutation, queryClient]);

  useEffect(() => {
    if (autopilotRunning && signal && signal.direction !== "HOLD") {
      const timer = setTimeout(handleAutoTrade, 800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [signal?.direction, signal?.confidence, autopilotRunning]);

  const handleToggleAutopilot = (on: boolean) => {
    setAutopilotRunning(on);
    updateBotMutation.mutate(
      { data: { botActive: on, autoConfirm: on } },
      {
        onSuccess: (updatedUser) => {
          queryClient.setQueryData(getGetMeQueryKey(), updatedUser);
          if (on) {
            setAutoTradeCount(0);
            toast({ title: "Autopilot Engaged", description: "AI is now scanning and executing trades automatically." });
          } else {
            toast({ title: "Autopilot Stopped", description: `Session complete. ${autoTradeCount} trades executed.`, variant: "destructive" });
          }
        }
      }
    );
  };

  const winCount = trades?.filter(t => t.result === "win").length ?? 0;
  const totalCount = trades?.length ?? 0;
  const sessionWinRate = totalCount > 0 ? Math.round((winCount / totalCount) * 100) : 0;

  const pocketConnected = !!activeUser?.pocketOptionId;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* Header + Mode Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Trading</h1>
          <p className="text-muted-foreground">AI Signal Engine — Autopilot or Manual</p>
        </div>
        {/* Mode Selector */}
        <div className="flex gap-2 p-1.5 rounded-xl bg-muted/50 border border-border/50">
          <button
            onClick={() => { setMode("autopilot"); setAutopilotRunning(false); }}
            data-testid="button-mode-autopilot"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold text-sm transition-all ${mode === "autopilot" ? "bg-primary text-primary-foreground shadow-md shadow-primary/30" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Bot className="w-4 h-4" /> AUTOPILOT
          </button>
          <button
            onClick={() => { setMode("manual"); setAutopilotRunning(false); }}
            data-testid="button-mode-manual"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold text-sm transition-all ${mode === "manual" ? "bg-secondary text-white shadow-md shadow-secondary/30" : "text-muted-foreground hover:text-foreground"}`}
          >
            <PlayCircle className="w-4 h-4" /> MANUAL LIVE
          </button>
        </div>
      </div>

      {/* Pocket Option not connected warning */}
      {!pocketConnected && (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-sm">Pocket Option Account Not Connected</p>
            <p className="text-xs opacity-80">Connect your Pocket Option UID in Settings to enable live trading.</p>
          </div>
          <Link href="/settings">
            <Button size="sm" variant="outline" className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 font-mono text-xs gap-1">
              <Settings className="w-3 h-3" /> CONNECT
            </Button>
          </Link>
        </div>
      )}

      {/* Asset + Timeframe selectors */}
      <div className="flex flex-wrap gap-3 items-center">
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
        <div className="ml-auto flex items-center gap-3 text-sm text-muted-foreground font-mono">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          LIVE SIGNALS
        </div>
      </div>

      {/* AUTOPILOT MODE */}
      {mode === "autopilot" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Autopilot Control Panel */}
          <Card className="lg:col-span-2 border-border/50 overflow-hidden">
            <div className={`h-1.5 w-full transition-all ${autopilotRunning ? "bg-primary animate-pulse" : "bg-muted"}`} />
            <CardHeader className="border-b border-border/50">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" /> Autopilot Control
                </span>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-mono font-bold ${autopilotRunning ? "text-primary" : "text-muted-foreground"}`}>
                    {autopilotRunning ? "RUNNING" : "STOPPED"}
                  </span>
                  <Switch
                    checked={autopilotRunning}
                    onCheckedChange={handleToggleAutopilot}
                    disabled={!pocketConnected || (activeUser?.credits ?? 0) <= 0}
                    data-testid="switch-autopilot"
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {/* Bot Status Visual */}
              <div className={`relative rounded-2xl border p-8 text-center transition-all ${autopilotRunning ? "border-primary/40 bg-primary/5 shadow-[0_0_40px_rgba(34,197,94,0.1)]" : "border-border/50 bg-muted/20"}`}>
                <div className={`mx-auto w-24 h-24 rounded-full border-4 flex items-center justify-center mb-6 transition-all ${autopilotRunning ? "border-primary bg-primary/15 shadow-[0_0_30px_rgba(34,197,94,0.3)]" : "border-border/50 bg-muted/30"}`}>
                  <Bot className={`w-12 h-12 transition-colors ${autopilotRunning ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <h3 className={`text-2xl font-black font-mono mb-2 ${autopilotRunning ? "text-primary" : "text-muted-foreground"}`}>
                  {autopilotRunning ? "AI BOT ACTIVE" : "BOT STANDBY"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {autopilotRunning
                    ? `Scanning ${asset} every 5 seconds — executing on high-confidence signals`
                    : "Enable the switch to start automated trading on your Pocket Option account"}
                </p>
                {autopilotRunning && signal && signal.direction !== "HOLD" && (
                  <div className={`mt-6 inline-flex items-center gap-3 px-6 py-3 rounded-full border font-mono font-bold text-lg animate-pulse ${signal.direction === "BUY" ? "border-primary/50 bg-primary/10 text-primary" : "border-destructive/50 bg-destructive/10 text-destructive"}`}>
                    <Zap className="w-5 h-5" />
                    {signal.direction} SIGNAL — {signal.confidence}% CONFIDENCE
                  </div>
                )}
              </div>

              {/* Live stats while running */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-card border border-border/50 text-center">
                  <p className="text-xs font-mono text-muted-foreground mb-1">SESSION TRADES</p>
                  <p className="text-3xl font-black font-mono text-foreground">{autoTradeCount}</p>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border/50 text-center">
                  <p className="text-xs font-mono text-muted-foreground mb-1">CREDITS LEFT</p>
                  <p className={`text-3xl font-black font-mono ${(activeUser?.credits ?? 0) < 10 ? "text-destructive" : "text-primary"}`}>
                    {activeUser?.credits ?? 0}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border/50 text-center">
                  <p className="text-xs font-mono text-muted-foreground mb-1">WIN RATE</p>
                  <p className="text-3xl font-black font-mono">{sessionWinRate}%</p>
                </div>
              </div>

              {/* Signal preview while in autopilot */}
              {autopilotRunning && signal && (
                <div className="p-4 rounded-xl border border-border/50 bg-muted/30">
                  <p className="text-xs font-mono text-muted-foreground mb-3 tracking-widest">LATEST SIGNAL ANALYSIS</p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground font-mono mb-1">RSI (14)</p>
                      <p className={`text-lg font-bold font-mono ${signal.rsi > 70 ? "text-destructive" : signal.rsi < 30 ? "text-primary" : "text-foreground"}`}>
                        {signal.rsi.toFixed(1)}
                      </p>
                    </div>
                    <div className="border-x border-border/50">
                      <p className="text-xs text-muted-foreground font-mono mb-1">EMA 9</p>
                      <p className="text-lg font-bold font-mono">{signal.ema9.toFixed(4)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-mono mb-1">EMA 21</p>
                      <p className="text-lg font-bold font-mono">{signal.ema21.toFixed(4)}</p>
                    </div>
                  </div>
                </div>
              )}

              {(activeUser?.credits ?? 0) <= 0 && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
                  <p className="font-bold text-destructive mb-2">No Credits Available</p>
                  <p className="text-sm text-muted-foreground mb-4">Top up to continue autopilot trading</p>
                  <Link href="/credits">
                    <Button size="sm" className="font-mono font-bold">BUY CREDITS</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Trades */}
          <RecentTradesPanel trades={trades} tradesLoading={tradesLoading} />
        </div>
      )}

      {/* MANUAL LIVE MODE */}
      {mode === "manual" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Signal Panel */}
          <Card className="lg:col-span-2 border-border/50 overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-secondary to-primary" />
            <CardHeader className="border-b border-border/50 bg-muted/20">
              <CardTitle className="flex justify-between items-center text-lg">
                <span className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-secondary" /> AI Signal — Manual Confirm
                </span>
                <Badge variant="outline" className="font-mono bg-background gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  LIVE
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {signalLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : signal ? (
                <div className="space-y-8">
                  {/* Direction Display */}
                  <div className="text-center space-y-3">
                    <p className="text-xs font-mono text-muted-foreground tracking-widest">{signal.asset} • {signal.timeframe} • MANUAL MODE</p>
                    <div className={`text-7xl md:text-8xl font-black tracking-tighter leading-none ${
                      signal.direction === "BUY" ? "text-primary drop-shadow-[0_0_20px_rgba(34,197,94,0.4)]" :
                      signal.direction === "SELL" ? "text-destructive drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]" : "text-muted-foreground"
                    }`}>
                      {signal.direction}
                    </div>

                    {signal.direction !== "HOLD" && (
                      <div className="flex justify-center gap-1 mt-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className={`h-2 w-8 rounded-full transition-all ${i < Math.ceil(signal.confidence / 20) ? (signal.direction === "BUY" ? "bg-primary" : "bg-destructive") : "bg-muted"}`} />
                        ))}
                      </div>
                    )}

                    <div className="inline-flex items-center gap-2 bg-card border border-border/50 px-5 py-2.5 rounded-full shadow-inner">
                      <Target className="w-4 h-4 text-accent" />
                      <span className="font-mono font-bold text-xl">{signal.confidence}%</span>
                      <span className="text-muted-foreground text-sm font-mono">CONFIDENCE</span>
                    </div>
                  </div>

                  {/* Indicators */}
                  <div className="grid grid-cols-3 gap-4 border-t border-border/50 pt-6">
                    <div className="text-center p-4 rounded-xl bg-muted/30">
                      <p className="text-xs text-muted-foreground font-mono mb-2">RSI (14)</p>
                      <p className={`text-2xl font-black font-mono ${signal.rsi > 70 ? "text-destructive" : signal.rsi < 30 ? "text-primary" : "text-foreground"}`}>
                        {signal.rsi.toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{signal.rsi > 70 ? "OVERBOUGHT" : signal.rsi < 30 ? "OVERSOLD" : "NEUTRAL"}</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-muted/30">
                      <p className="text-xs text-muted-foreground font-mono mb-2">EMA (9)</p>
                      <p className="text-xl font-bold font-mono">{signal.ema9.toFixed(5)}</p>
                      <p className="text-xs text-muted-foreground mt-1">FAST</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-muted/30">
                      <p className="text-xs text-muted-foreground font-mono mb-2">EMA (21)</p>
                      <p className="text-xl font-bold font-mono">{signal.ema21.toFixed(5)}</p>
                      <p className="text-xs text-muted-foreground mt-1">SLOW</p>
                    </div>
                  </div>

                  {/* EMA Crossover explanation */}
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
                    <p className="text-xs font-mono text-muted-foreground mb-1">AI REASONING</p>
                    <p className="text-sm text-foreground">
                      {signal.direction === "BUY"
                        ? `RSI at ${signal.rsi.toFixed(1)} (oversold territory) with EMA9 crossing above EMA21 — bullish momentum building. High-probability long setup.`
                        : signal.direction === "SELL"
                        ? `RSI at ${signal.rsi.toFixed(1)} (overbought territory) with EMA9 crossing below EMA21 — bearish pressure emerging. High-probability short setup.`
                        : "EMA crossover not yet confirmed and RSI is in neutral zone. AI recommends waiting for a stronger setup before entering."}
                    </p>
                  </div>

                  {/* Execute Button */}
                  {signal.direction !== "HOLD" ? (
                    <Button
                      size="lg"
                      className={`w-full h-16 text-xl font-black font-mono tracking-wide transition-all ${
                        signal.direction === "BUY"
                          ? "bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_35px_rgba(34,197,94,0.5)]"
                          : "bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                      }`}
                      disabled={!pocketConnected || executeMutation.isPending || (activeUser?.credits ?? 0) <= 0}
                      onClick={handleManualExecute}
                      data-testid="button-execute-trade"
                    >
                      {executeMutation.isPending ? (
                        <span className="flex items-center gap-2"><Zap className="w-5 h-5 animate-spin" /> EXECUTING...</span>
                      ) : (
                        <span className="flex items-center gap-2">
                          {signal.direction === "BUY" ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                          EXECUTE {signal.direction} — 1 CREDIT
                        </span>
                      )}
                    </Button>
                  ) : (
                    <div className="w-full h-16 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-center gap-3 text-muted-foreground font-mono font-bold">
                      <Clock className="w-5 h-5" /> WAITING FOR SIGNAL...
                    </div>
                  )}

                  {/* Credits + PO account status */}
                  <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                    <span className="flex items-center gap-1">
                      {pocketConnected ? <CheckCircle className="w-3 h-3 text-primary" /> : <AlertTriangle className="w-3 h-3 text-amber-400" />}
                      {pocketConnected ? `PO Account Connected` : "Account Not Connected"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-primary" />
                      {activeUser?.credits ?? 0} credits remaining
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <Activity className="w-10 h-10 mx-auto mb-4 opacity-30" />
                  <p>Error loading signal. Check your connection.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Trades */}
          <RecentTradesPanel trades={trades} tradesLoading={tradesLoading} />
        </div>
      )}
    </div>
  );
}

function RecentTradesPanel({ trades, tradesLoading }: { trades: any[] | undefined; tradesLoading: boolean }) {
  const winCount = trades?.filter(t => t.result === "win").length ?? 0;
  const totalCount = trades?.length ?? 0;

  return (
    <Card className="border-border/50 flex flex-col">
      <CardHeader className="border-b border-border/50">
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" /> Trade History
          </span>
          {totalCount > 0 && (
            <span className="text-xs font-mono text-muted-foreground">{winCount}/{totalCount} wins</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-auto max-h-[560px]">
        {tradesLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : trades && trades.length > 0 ? (
          <div className="divide-y divide-border/30">
            {trades.slice(0, 15).map((trade, i) => (
              <div key={trade.id} className="px-4 py-3 flex items-center justify-between hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${trade.result === "win" ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
                    {trade.result === "win" ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold font-mono text-xs ${trade.direction === "BUY" ? "text-primary" : "text-destructive"}`}>
                        {trade.direction}
                      </span>
                      <span className="font-mono text-sm font-medium">{trade.asset}</span>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {new Date(trade.createdAt).toLocaleTimeString()} · {trade.timeframe}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className={`text-xs font-mono font-bold shrink-0 ${
                  trade.result === "win"
                    ? "border-primary/30 text-primary bg-primary/10"
                    : "border-destructive/30 text-destructive bg-destructive/10"
                }`}>
                  {trade.result.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center text-muted-foreground">
            <Activity className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No trades yet. Execute your first trade!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
