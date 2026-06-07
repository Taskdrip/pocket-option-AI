import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth";
import {
  useGetSignal, useExecuteTrade, useListTrades,
  useUpdateBotStatus, useGetMe, getGetMeQueryKey,
  getGetSignalQueryKey, getListTradesQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp, TrendingDown, Clock, Activity, Target, Bot, PlayCircle,
  Zap, AlertTriangle, CheckCircle, Settings, RefreshCcw, BarChart2,
  Wifi, WifiOff, DollarSign
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

const ASSETS = ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "XAU/USD", "GBP/JPY", "USD/CHF", "NAS100", "BTC/USD"];
const TIMEFRAMES = ["1m", "5m", "15m", "1h"];
const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

type TradingMode = "autopilot" | "manual";

// ── PO Account Widget ─────────────────────────────────────────────────────────
function POAccountWidget({ activeUser, onRefresh }: { activeUser: any; onRefresh: () => void }) {
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const { toast } = useToast();

  const fetchAccount = useCallback(async () => {
    if (!activeUser?.poConnected) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("apt_token");
      const res = await fetch(`${BASE}/api/pocket-option/account`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAccount(data);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [activeUser?.poConnected]);

  useEffect(() => {
    fetchAccount();
    const interval = setInterval(fetchAccount, 5000); // poll every 5s
    return () => clearInterval(interval);
  }, [fetchAccount]);

  const handleSwitch = async (type: "live" | "demo") => {
    setSwitching(true);
    try {
      const token = localStorage.getItem("apt_token");
      const res = await fetch(`${BASE}/api/pocket-option/switch`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ poAccountType: type }),
      });
      if (res.ok) {
        onRefresh();
        setAccount((prev: any) => prev ? { ...prev, accountType: type, currentBalance: type === "live" ? prev.liveBalance : prev.demoBalance } : prev);
        toast({ title: `Switched to ${type.toUpperCase()} account` });
      }
    } finally { setSwitching(false); }
  };

  if (!activeUser?.poConnected) return null;

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-primary" />
          <span className="text-xs font-mono font-bold text-primary">PO ACCOUNT CONNECTED</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">UID: {activeUser?.pocketOptionId}</span>
          <button onClick={fetchAccount} className="text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCcw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-mono text-muted-foreground">ACCOUNT:</span>
          <div className="flex gap-1.5">
            {(["demo", "live"] as const).map(type => (
              <button
                key={type}
                onClick={() => handleSwitch(type)}
                disabled={switching || (account?.accountType || activeUser?.poAccountType) === type}
                className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                  (account?.accountType || activeUser?.poAccountType) === type
                    ? type === "live" ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {type === "demo" ? "📊 DEMO" : "💰 LIVE"}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs font-mono text-muted-foreground mb-1">DEMO BALANCE</p>
            <p className="text-lg font-black font-mono text-primary">
              ${loading ? "..." : (account?.demoBalance ?? activeUser?.poDemoBalance ?? 10000).toFixed(2)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
            <p className="text-xs font-mono text-muted-foreground mb-1">LIVE BALANCE</p>
            <p className="text-lg font-black font-mono text-accent">
              ${loading ? "..." : (account?.liveBalance ?? activeUser?.poLiveBalance ?? 0).toFixed(2)}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs font-mono text-muted-foreground">
          <span>ACTIVE: {((account?.accountType || activeUser?.poAccountType) || "demo").toUpperCase()}</span>
          <span className="text-foreground font-bold">
            BALANCE: ${loading ? "..." : (account?.currentBalance ?? 0).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Indicator Row ────────────────────────────────────────────────────────────
function IndicatorRow({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
      <span className="text-xs font-mono text-muted-foreground">{label}</span>
      <div className="text-right">
        <span className={`text-sm font-bold font-mono ${color || "text-foreground"}`}>{value}</span>
        {sub && <p className="text-xs text-muted-foreground font-mono">{sub}</p>}
      </div>
    </div>
  );
}

// ── Recent Trades Panel ──────────────────────────────────────────────────────
function RecentTradesPanel({ trades, tradesLoading }: { trades: any[] | undefined; tradesLoading: boolean }) {
  const winCount = trades?.filter(t => t.result === "win").length ?? 0;
  const totalCount = trades?.length ?? 0;

  return (
    <Card className="border-border/50 flex flex-col">
      <CardHeader className="border-b border-border/50 pb-3">
        <CardTitle className="text-sm flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" /> Trade History
          </span>
          {totalCount > 0 && (
            <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {winCount}/{totalCount} wins
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-auto max-h-[500px]">
        {tradesLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : trades && trades.length > 0 ? (
          <div className="divide-y divide-border/30">
            {trades.slice(0, 15).map(trade => (
              <div key={trade.id} className="px-4 py-3 flex items-center justify-between hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${trade.result === "win" ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
                    {trade.result === "win" ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`font-bold font-mono text-xs ${trade.direction === "BUY" ? "text-primary" : "text-destructive"}`}>{trade.direction}</span>
                      <span className="font-mono text-sm font-medium">{trade.asset}</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">{new Date(trade.createdAt).toLocaleTimeString()} · {trade.timeframe}</p>
                  </div>
                </div>
                <Badge variant="outline" className={`text-xs font-mono font-bold shrink-0 ${trade.result === "win" ? "border-primary/30 text-primary bg-primary/10" : "border-destructive/30 text-destructive bg-destructive/10"}`}>
                  {trade.result === "win" ? "WIN" : "LOSS"}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center text-muted-foreground">
            <Activity className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No trades yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Trading Page ────────────────────────────────────────────────────────
export default function Trading() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<TradingMode>("manual");
  const [asset, setAsset] = useState(ASSETS[0]);
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[1]);
  const [autopilotRunning, setAutopilotRunning] = useState(false);
  const [autoTradeCount, setAutoTradeCount] = useState(0);
  const [showIndicators, setShowIndicators] = useState(false);
  const lastAutoSignal = useRef<string>("");

  const { data: currentUser, refetch: refetchUser } = useGetMe();
  const activeUser = (currentUser || user) as any;

  const { data: signal, isLoading: signalLoading } = useGetSignal(
    { asset, timeframe },
    {
      query: {
        refetchInterval: 5000,
        enabled: !!user,
        queryKey: getGetSignalQueryKey({ asset, timeframe })
      }
    }
  );

  const { data: trades, isLoading: tradesLoading } = useListTrades({
    query: { enabled: !!user, queryKey: getListTradesQueryKey() }
  });

  const executeMutation = useExecuteTrade();
  const updateBotMutation = useUpdateBotStatus();

  const handleManualExecute = () => {
    if (!signal || signal.direction === "HOLD") {
      toast({ title: "No trade signal", description: "AI recommends waiting for a stronger setup.", variant: "destructive" });
      return;
    }
    executeMutation.mutate(
      { data: { asset, timeframe, amount: 10, direction: signal.direction as "BUY" | "SELL", confidence: signal.confidence } },
      {
        onSuccess: () => {
          toast({ title: "✅ Trade Executed!", description: `${signal.direction} on ${asset} @ ${signal.confidence}% confidence — 1 credit used.` });
          queryClient.invalidateQueries({ queryKey: getListTradesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        },
        onError: (err: any) => {
          toast({ title: "Execution Failed", description: err?.response?.data?.error || "Insufficient credits", variant: "destructive" });
        }
      }
    );
  };

  // Autopilot auto-execute — only fires once per unique signal
  useEffect(() => {
    if (!autopilotRunning || !signal || signal.direction === "HOLD") return undefined;
    const signalKey = `${signal.direction}-${signal.confidence}-${signal.asset}`;
    if (lastAutoSignal.current === signalKey) return undefined;

    const timer = setTimeout(() => {
      lastAutoSignal.current = signalKey;
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
    }, 1200);
    return () => clearTimeout(timer);
  }, [signal?.direction, signal?.confidence, autopilotRunning]);

  const handleToggleAutopilot = (on: boolean) => {
    setAutopilotRunning(on);
    if (on) setAutoTradeCount(0);
    updateBotMutation.mutate(
      { data: { botActive: on, autoConfirm: on } },
      {
        onSuccess: updatedUser => {
          queryClient.setQueryData(getGetMeQueryKey(), updatedUser);
          toast({
            title: on ? "🤖 Autopilot Engaged" : "⏹ Autopilot Stopped",
            description: on
              ? "AI is scanning markets and will auto-execute on high-confidence signals."
              : `Session ended. ${autoTradeCount} trades executed.`
          });
        }
      }
    );
  };

  const winCount = trades?.filter(t => t.result === "win").length ?? 0;
  const totalCount = trades?.length ?? 0;
  const sessionWinRate = totalCount > 0 ? Math.round((winCount / totalCount) * 100) : 0;
  const pocketConnected = !!activeUser?.poConnected;
  const extSignal = signal as any;

  return (
    <div className="space-y-5 max-w-6xl mx-auto">

      {/* Header + Mode Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Live Trading</h1>
          <p className="text-muted-foreground text-sm">7-Indicator AI Engine · Autopilot or Manual</p>
        </div>
        <div className="flex gap-2 p-1.5 rounded-xl bg-muted/50 border border-border/50">
          <button
            onClick={() => { setMode("autopilot"); setAutopilotRunning(false); }}
            data-testid="button-mode-autopilot"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold text-sm transition-all ${mode === "autopilot" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Bot className="w-4 h-4" /> AUTOPILOT
          </button>
          <button
            onClick={() => { setMode("manual"); setAutopilotRunning(false); }}
            data-testid="button-mode-manual"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold text-sm transition-all ${mode === "manual" ? "bg-secondary text-white shadow-md" : "text-muted-foreground hover:text-foreground"}`}
          >
            <PlayCircle className="w-4 h-4" /> MANUAL LIVE
          </button>
        </div>
      </div>

      {/* PO Account Widget */}
      {pocketConnected ? (
        <POAccountWidget activeUser={activeUser} onRefresh={() => { refetchUser(); queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() }); }} />
      ) : (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
          <WifiOff className="w-5 h-5 shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-sm">Pocket Option Account Not Connected</p>
            <p className="text-xs opacity-80">Connect your PO account (email, password, UID) in Settings to enable live account tracking.</p>
          </div>
          <Link href="/settings">
            <Button size="sm" variant="outline" className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 font-mono text-xs gap-1 shrink-0">
              <Settings className="w-3 h-3" /> CONNECT
            </Button>
          </Link>
        </div>
      )}

      {/* Asset + Timeframe Selectors */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={asset} onValueChange={setAsset}>
          <SelectTrigger className="w-[140px] bg-card" data-testid="select-asset">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ASSETS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-[100px] bg-card" data-testid="select-timeframe">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEFRAMES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="sm"
          className="font-mono text-xs gap-1.5 text-muted-foreground"
          onClick={() => setShowIndicators(!showIndicators)}
        >
          <BarChart2 className="w-4 h-4" />
          {showIndicators ? "HIDE" : "SHOW"} INDICATORS
        </Button>
        <div className="ml-auto flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          LIVE — REFRESHES 5s
        </div>
      </div>

      {/* ── AUTOPILOT MODE ── */}
      {mode === "autopilot" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card className="lg:col-span-2 border-border/50 overflow-hidden">
            <div className={`h-1.5 w-full transition-all duration-500 ${autopilotRunning ? "bg-primary" : "bg-muted"}`} />
            <CardHeader className="border-b border-border/50 pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2"><Bot className="w-5 h-5 text-primary" /> Autopilot Robot</span>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-mono font-bold ${autopilotRunning ? "text-primary" : "text-muted-foreground"}`}>
                    {autopilotRunning ? "● RUNNING" : "○ STOPPED"}
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
            <CardContent className="p-6 space-y-6">
              {/* Bot visual */}
              <div className={`rounded-2xl border p-8 text-center transition-all ${autopilotRunning ? "border-primary/30 bg-primary/5 shadow-[0_0_30px_rgba(34,197,94,0.08)]" : "border-border/30 bg-muted/10"}`}>
                <div className={`mx-auto w-20 h-20 rounded-full border-4 flex items-center justify-center mb-4 transition-all ${autopilotRunning ? "border-primary bg-primary/15 shadow-[0_0_20px_rgba(34,197,94,0.25)]" : "border-border/50 bg-muted/30"}`}>
                  <Bot className={`w-10 h-10 transition-colors ${autopilotRunning ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <h3 className={`text-xl font-black font-mono mb-1 ${autopilotRunning ? "text-primary" : "text-muted-foreground"}`}>
                  {autopilotRunning ? "AI BOT ACTIVE" : "BOT STANDBY"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  {autopilotRunning
                    ? `Monitoring ${asset} · executing on high-confidence signals automatically`
                    : pocketConnected
                      ? "Connect to PO account and enable switch to start auto-trading"
                      : "Connect your Pocket Option account first"}
                </p>
                {autopilotRunning && signal && signal.direction !== "HOLD" && (
                  <div className={`mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full border font-mono font-bold animate-pulse ${signal.direction === "BUY" ? "border-primary/50 bg-primary/10 text-primary" : "border-destructive/50 bg-destructive/10 text-destructive"}`}>
                    <Zap className="w-4 h-4" />
                    {signal.direction} · {signal.confidence}% CONFIDENCE
                  </div>
                )}
              </div>

              {/* Session stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "SESSION TRADES", val: autoTradeCount.toString(), color: "text-foreground" },
                  { label: "CREDITS LEFT", val: (activeUser?.credits ?? 0).toString(), color: (activeUser?.credits ?? 0) < 10 ? "text-destructive" : "text-primary" },
                  { label: "WIN RATE", val: `${sessionWinRate}%`, color: "text-foreground" },
                ].map((s, i) => (
                  <div key={i} className="p-4 rounded-xl bg-card border border-border/50 text-center">
                    <p className="text-xs font-mono text-muted-foreground mb-1">{s.label}</p>
                    <p className={`text-2xl font-black font-mono ${s.color}`}>{s.val}</p>
                  </div>
                ))}
              </div>

              {/* Latest signal preview */}
              {autopilotRunning && extSignal && (
                <div className="p-4 rounded-xl border border-border/40 bg-muted/20">
                  <p className="text-xs font-mono text-muted-foreground mb-3 tracking-widest">LATEST ANALYSIS</p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-xs font-mono text-muted-foreground mb-1">RSI</p>
                      <p className={`text-base font-bold font-mono ${extSignal.rsi > 70 ? "text-destructive" : extSignal.rsi < 30 ? "text-primary" : "text-foreground"}`}>{extSignal.rsi?.toFixed(1)}</p>
                    </div>
                    <div className="border-x border-border/30">
                      <p className="text-xs font-mono text-muted-foreground mb-1">MACD</p>
                      <p className={`text-base font-bold font-mono ${extSignal.macdHistogram > 0 ? "text-primary" : "text-destructive"}`}>{extSignal.macdHistogram?.toFixed(5)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-mono text-muted-foreground mb-1">STOCH K</p>
                      <p className={`text-base font-bold font-mono ${extSignal.stochasticK < 20 ? "text-primary" : extSignal.stochasticK > 80 ? "text-destructive" : "text-foreground"}`}>{extSignal.stochasticK?.toFixed(1)}</p>
                    </div>
                  </div>
                </div>
              )}

              {(activeUser?.credits ?? 0) <= 0 && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
                  <p className="font-bold text-destructive mb-1">No Credits</p>
                  <Link href="/credits"><Button size="sm" className="font-mono font-bold">BUY CREDITS</Button></Link>
                </div>
              )}
            </CardContent>
          </Card>
          <RecentTradesPanel trades={trades} tradesLoading={tradesLoading} />
        </div>
      )}

      {/* ── MANUAL LIVE MODE ── */}
      {mode === "manual" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card className="lg:col-span-2 border-border/50 overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-secondary via-primary to-secondary" />
            <CardHeader className="border-b border-border/50 pb-3">
              <CardTitle className="flex justify-between items-center text-base">
                <span className="flex items-center gap-2"><Activity className="w-5 h-5 text-secondary" /> AI Signal — Manual Confirm</span>
                <Badge variant="outline" className="font-mono bg-background gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> LIVE
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {signalLoading ? (
                <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-32 w-full" /></div>
              ) : signal ? (
                <div className="space-y-6">
                  {/* Direction */}
                  <div className="text-center space-y-3">
                    <p className="text-xs font-mono text-muted-foreground tracking-widest">{signal.asset} · {signal.timeframe} · MANUAL MODE</p>
                    <div className={`text-7xl md:text-8xl font-black tracking-tighter leading-none ${
                      signal.direction === "BUY" ? "text-primary drop-shadow-[0_0_20px_rgba(34,197,94,0.4)]" :
                      signal.direction === "SELL" ? "text-destructive drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]" : "text-muted-foreground"
                    }`}>{signal.direction}</div>
                    {signal.direction !== "HOLD" && (
                      <div className="flex justify-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className={`h-2 w-8 rounded-full ${i < Math.ceil(signal.confidence / 20) ? (signal.direction === "BUY" ? "bg-primary" : "bg-destructive") : "bg-muted"}`} />
                        ))}
                      </div>
                    )}
                    <div className="inline-flex items-center gap-2 bg-card border border-border/50 px-5 py-2 rounded-full">
                      <Target className="w-4 h-4 text-accent" />
                      <span className="font-mono font-bold text-xl">{signal.confidence}%</span>
                      <span className="text-muted-foreground text-sm font-mono">CONFIDENCE</span>
                    </div>
                  </div>

                  {/* Core indicators */}
                  <div className="grid grid-cols-3 gap-3 border-t border-border/30 pt-5">
                    {[
                      { label: "RSI (14)", val: signal.rsi.toFixed(1), color: signal.rsi > 70 ? "text-destructive" : signal.rsi < 30 ? "text-primary" : "text-foreground", sub: signal.rsi > 70 ? "OVERBOUGHT" : signal.rsi < 30 ? "OVERSOLD" : "NEUTRAL" },
                      { label: "EMA (9)", val: signal.ema9.toFixed(5), color: "text-foreground", sub: "FAST" },
                      { label: "EMA (21)", val: signal.ema21.toFixed(5), color: "text-foreground", sub: "SLOW" },
                    ].map((ind, i) => (
                      <div key={i} className="text-center p-3 rounded-xl bg-muted/30">
                        <p className="text-xs font-mono text-muted-foreground mb-1.5">{ind.label}</p>
                        <p className={`text-lg font-black font-mono ${ind.color}`}>{ind.val}</p>
                        {ind.sub && <p className="text-xs text-muted-foreground mt-1">{ind.sub}</p>}
                      </div>
                    ))}
                  </div>

                  {/* Extended indicators */}
                  {showIndicators && extSignal && (
                    <div className="p-4 rounded-xl bg-muted/20 border border-border/30 space-y-0.5">
                      <p className="text-xs font-mono text-muted-foreground mb-3 tracking-widest">7-INDICATOR AI ENGINE (FreqTrade Strategy)</p>
                      <IndicatorRow label="MACD" value={extSignal.macd?.toFixed(6)} sub={extSignal.macdHistogram > 0 ? "BULLISH ↑" : "BEARISH ↓"} color={extSignal.macdHistogram > 0 ? "text-primary" : "text-destructive"} />
                      <IndicatorRow label="MACD SIGNAL" value={extSignal.macdSignal?.toFixed(6)} />
                      <IndicatorRow label="BB UPPER" value={extSignal.bollingerUpper?.toFixed(5)} color="text-destructive" />
                      <IndicatorRow label="BB MIDDLE" value={extSignal.bollingerMiddle?.toFixed(5)} />
                      <IndicatorRow label="BB LOWER" value={extSignal.bollingerLower?.toFixed(5)} color="text-primary" />
                      <IndicatorRow label="STOCHASTIC K" value={`${extSignal.stochasticK?.toFixed(1)}%`} color={extSignal.stochasticK < 20 ? "text-primary" : extSignal.stochasticK > 80 ? "text-destructive" : "text-foreground"} />
                      <IndicatorRow label="STOCHASTIC D" value={`${extSignal.stochasticD?.toFixed(1)}%`} />
                      <IndicatorRow label="WILLIAMS %R" value={extSignal.williamsR?.toFixed(1)} color={extSignal.williamsR < -80 ? "text-primary" : extSignal.williamsR > -20 ? "text-destructive" : "text-foreground"} />
                      <IndicatorRow label="ATR (14)" value={extSignal.atr?.toFixed(6)} sub="VOLATILITY" />
                      <IndicatorRow label="EMA (50)" value={extSignal.ema50?.toFixed(5)} sub="TREND" />
                      {extSignal.indicators && (
                        <div className="mt-3 pt-3 border-t border-border/20 grid grid-cols-2 gap-1">
                          {Object.entries(extSignal.indicators).map(([k, v]) => (
                            <div key={k} className="flex justify-between gap-2">
                              <span className="text-xs font-mono text-muted-foreground">{k.toUpperCase()}</span>
                              <span className={`text-xs font-mono font-bold ${String(v).includes("BULL") || String(v).includes("↑") || String(v).includes("OVERSOLD") ? "text-primary" : String(v).includes("BEAR") || String(v).includes("↓") || String(v).includes("OVERBOUGHT") ? "text-destructive" : "text-muted-foreground"}`}>{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Reasoning */}
                  <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
                    <p className="text-xs font-mono text-muted-foreground mb-1 tracking-widest">AI REASONING</p>
                    <p className="text-sm text-foreground leading-relaxed">
                      {signal.direction === "BUY"
                        ? `RSI ${signal.rsi.toFixed(1)} in oversold territory with EMA9 crossing above EMA21. MACD momentum and Stochastic confirming bullish reversal. High-probability long setup — ${signal.confidence}% consensus.`
                        : signal.direction === "SELL"
                        ? `RSI ${signal.rsi.toFixed(1)} in overbought territory with EMA9 crossing below EMA21. MACD and Bollinger Bands confirming bearish pressure. High-probability short setup — ${signal.confidence}% consensus.`
                        : `Indicators are in conflict. RSI neutral, MACD histogram near zero, EMAs not yet crossed. AI recommends HOLD — waiting for a cleaner setup before entering.`}
                    </p>
                  </div>

                  {/* Execute */}
                  {signal.direction !== "HOLD" ? (
                    <Button
                      size="lg"
                      className={`w-full h-14 text-lg font-black font-mono tracking-wide transition-all ${
                        signal.direction === "BUY"
                          ? "bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(34,197,94,0.25)]"
                          : "bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-[0_0_20px_rgba(239,68,68,0.25)]"
                      }`}
                      disabled={!pocketConnected || executeMutation.isPending || (activeUser?.credits ?? 0) <= 0}
                      onClick={handleManualExecute}
                      data-testid="button-execute-trade"
                    >
                      {executeMutation.isPending
                        ? <span className="flex items-center gap-2"><Zap className="w-5 h-5 animate-spin" />EXECUTING...</span>
                        : <span className="flex items-center gap-2">
                            {signal.direction === "BUY" ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                            EXECUTE {signal.direction} — 1 CREDIT
                          </span>}
                    </Button>
                  ) : (
                    <div className="w-full h-14 rounded-xl bg-muted/30 border border-border/50 flex items-center justify-center gap-3 text-muted-foreground font-mono font-bold">
                      <Clock className="w-5 h-5" /> HOLD — WAITING FOR SIGNAL
                    </div>
                  )}

                  {/* Status row */}
                  <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                    <span className="flex items-center gap-1">
                      {pocketConnected ? <CheckCircle className="w-3 h-3 text-primary" /> : <AlertTriangle className="w-3 h-3 text-amber-400" />}
                      {pocketConnected ? `PO ${activeUser?.poAccountType?.toUpperCase() || "DEMO"} connected` : "Account not connected"}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-primary" />
                      {activeUser?.credits ?? 0} credits
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <Activity className="w-10 h-10 mx-auto mb-4 opacity-30" />
                  <p>Connecting to signal server...</p>
                </div>
              )}
            </CardContent>
          </Card>
          <RecentTradesPanel trades={trades} tradesLoading={tradesLoading} />
        </div>
      )}
    </div>
  );
}
