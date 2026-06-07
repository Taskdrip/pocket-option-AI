import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useGetTradeStats, useListTrades, useGetSignal, useUpdateBotStatus } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Activity, ArrowDownRight, ArrowUpRight, Loader2, Power,
  TrendingUp, TrendingDown, Clock, BarChart3, Zap, Wifi, AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [asset, setAsset] = useState("EURUSD");
  const [timeframe, setTimeframe] = useState("M1");
  const [tick, setTick] = useState(0);

  const { data: stats } = useGetTradeStats();
  const { data: trades } = useListTrades();
  const { data: signal, isLoading: signalLoading } = useGetSignal({ asset, timeframe });

  const updateBot = useUpdateBotStatus();

  // Refresh signal every 10s
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(id);
  }, []);

  const handleBotToggle = () => {
    updateBot.mutate({ data: { botActive: !user?.botActive } }, {
      onSuccess: (updatedUser) => {
        queryClient.setQueryData(getGetMeQueryKey(), updatedUser);
      }
    });
  };

  const winRate = stats?.winRate ?? 0;
  const botActive = user?.botActive ?? false;
  const poConnected = user?.poConnected ?? false;

  const dirColor = signal?.direction === 'BUY' ? 'text-green-400' : signal?.direction === 'SELL' ? 'text-red-400' : 'text-yellow-400';
  const dirBg = signal?.direction === 'BUY' ? 'bg-green-500/10 border-green-500/20' : signal?.direction === 'SELL' ? 'bg-red-500/10 border-red-500/20' : 'bg-yellow-500/10 border-yellow-500/20';

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Command Center</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time execution matrix · {asset} · {timeframe}</p>
        </div>

        {/* Bot toggle */}
        <button
          onClick={handleBotToggle}
          disabled={updateBot.isPending || !poConnected}
          className={`flex items-center gap-3 px-5 py-2.5 rounded-xl border font-semibold text-sm transition-all duration-300 ${
            botActive
              ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20 glow-green'
              : 'bg-white/5 border-white/10 text-muted-foreground hover:border-white/20'
          } ${!poConnected ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {updateBot.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Power className={`w-4 h-4 ${botActive ? 'text-green-400' : 'text-muted-foreground'}`} />
          )}
          {botActive ? 'Bot Active' : 'Bot Standby'}
          <div className={`w-2 h-2 rounded-full ${botActive ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
        </button>
      </div>

      {/* ── PO Not Connected Banner ── */}
      {!poConnected && (
        <div className="flex items-center justify-between gap-4 px-5 py-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-amber-300">Pocket Option account not connected</div>
              <div className="text-xs text-muted-foreground">Connect your SSID in Settings to enable live trading.</div>
            </div>
          </div>
          <Link href="/settings">
            <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10 flex-shrink-0">
              Connect Now
            </Button>
          </Link>
        </div>
      )}

      {/* ── Account Balances ── */}
      {poConnected && (
        <div className="grid grid-cols-2 gap-4">
          <div className={`rounded-xl p-5 border ${user?.poAccountType === 'live' ? 'gradient-border bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20' : 'glass border-white/6'}`}>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${user?.poAccountType === 'live' ? 'bg-blue-400 animate-pulse' : 'bg-gray-600'}`} />
              Live Account
            </div>
            <div className="font-display text-2xl font-bold">${(user?.poLiveBalance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div className={`rounded-xl p-5 border ${user?.poAccountType === 'demo' ? 'gradient-border bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20' : 'glass border-white/6'}`}>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${user?.poAccountType === 'demo' ? 'bg-purple-400 animate-pulse' : 'bg-gray-600'}`} />
              Demo Account
            </div>
            <div className="font-display text-2xl font-bold">${(user?.poDemoBalance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
        </div>
      )}

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Win Rate", value: `${winRate.toFixed(1)}%`, color: winRate >= 50 ? 'text-green-400' : 'text-red-400', icon: TrendingUp },
          { label: "Total Trades", value: stats?.totalTrades ?? 0, color: 'text-foreground', icon: BarChart3 },
          { label: "Wins / Losses", value: `${stats?.wins ?? 0}W / ${stats?.losses ?? 0}L`, color: 'text-foreground', icon: Activity },
          { label: "Credits", value: `$${user?.credits?.toFixed(2) ?? '0.00'}`, color: 'text-blue-400', icon: Zap },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass rounded-xl p-5 border border-white/6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{s.label}</span>
                <Icon className="w-4 h-4 text-muted-foreground/40" />
              </div>
              <div className={`font-display text-2xl font-bold ${s.color}`}>{String(s.value)}</div>
            </div>
          );
        })}
      </div>

      {/* ── Signal + Trade Log ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* AI Signal */}
        <div className="glass rounded-xl border border-white/6 overflow-hidden">
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Activity className="w-4 h-4 text-blue-400" />
                AI Signal
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                Live
              </div>
            </div>

            {/* Selectors */}
            <div className="flex gap-2 mb-5">
              <Select value={asset} onValueChange={setAsset}>
                <SelectTrigger className="bg-white/5 border-white/10 h-9 text-xs flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["EURUSD","GBPUSD","USDJPY","AUDUSD","EURGBP","GBPJPY"].map(a => (
                    <SelectItem key={a} value={a} className="text-xs">
                      {a.slice(0,3)}/{a.slice(3)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="bg-white/5 border-white/10 h-9 text-xs flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["M1","M5","M15","M30","H1"].map(t => (
                    <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {signalLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-xs">Calculating vectors...</span>
              </div>
            ) : signal ? (
              <div className={`rounded-xl p-5 border text-center space-y-3 ${dirBg}`}>
                <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Signal</div>
                <div className={`font-display text-5xl font-bold flex items-center justify-center gap-2 ${dirColor}`}>
                  {signal.direction === 'BUY' && <ArrowUpRight className="w-10 h-10" />}
                  {signal.direction === 'SELL' && <ArrowDownRight className="w-10 h-10" />}
                  {signal.direction === 'HOLD' && <Clock className="w-8 h-8" />}
                  {signal.direction}
                </div>
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5 text-xs">
                  <div>
                    <div className="text-muted-foreground mb-0.5">Confidence</div>
                    <div className="font-bold text-sm">{signal.confidence.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-0.5">RSI</div>
                    <div className="font-bold text-sm">{signal.rsi.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-0.5">Trend</div>
                    <div className={`font-bold text-sm ${signal.ema9 > signal.ema21 ? 'text-green-400' : 'text-red-400'}`}>
                      {signal.ema9 > signal.ema21 ? '▲ UP' : '▼ DN'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground text-sm py-8">No signal available</div>
            )}

            {/* Indicator bars */}
            {signal && (
              <div className="mt-5 space-y-2">
                <div className="text-xs text-muted-foreground font-semibold uppercase tracking-widest mb-3">Indicators</div>
                {[
                  { label: "RSI", val: signal.rsi, max: 100, warn: signal.rsi > 70 || signal.rsi < 30 },
                  { label: "MACD", val: Math.abs(signal.macd) * 100, max: 100, warn: false },
                  { label: "BB Width", val: (signal.bbUpper - signal.bbLower) * 50, max: 100, warn: false },
                ].map((ind) => (
                  <div key={ind.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{ind.label}</span>
                      <span className={ind.warn ? 'text-amber-400 font-bold' : 'text-foreground font-mono'}>
                        {ind.label === "RSI" ? ind.val.toFixed(1) : ind.val.toFixed(2)}
                      </span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${ind.warn ? 'bg-amber-400' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min(100, Math.max(0, (ind.val / ind.max) * 100))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Trade Log */}
        <div className="lg:col-span-2 glass rounded-xl border border-white/6 overflow-hidden">
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />
          <div className="p-5">
            <div className="flex items-center gap-2 font-semibold text-sm mb-5">
              <Wifi className="w-4 h-4 text-green-400" />
              Execution Log
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b border-white/5">
                    <th className="pb-3 pr-4 font-semibold uppercase tracking-widest">Time</th>
                    <th className="pb-3 pr-4 font-semibold uppercase tracking-widest">Asset</th>
                    <th className="pb-3 pr-4 font-semibold uppercase tracking-widest">Dir</th>
                    <th className="pb-3 pr-4 font-semibold uppercase tracking-widest">Amount</th>
                    <th className="pb-3 text-right font-semibold uppercase tracking-widest">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {!trades || trades.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground text-sm">
                        <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        No trades yet. Activate the bot to start.
                      </td>
                    </tr>
                  ) : (
                    trades.slice(0, 20).map((trade) => (
                      <tr key={trade.id} className="border-b border-white/4 hover:bg-white/2 transition-colors">
                        <td className="py-3 pr-4 text-muted-foreground font-mono text-xs">
                          {format(new Date(trade.createdAt), "HH:mm:ss")}
                        </td>
                        <td className="py-3 pr-4 font-semibold text-xs">
                          {trade.asset} <span className="text-muted-foreground font-normal">·{trade.timeframe}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ${
                            trade.direction === 'BUY' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {trade.direction === 'BUY' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {trade.direction}
                          </span>
                        </td>
                        <td className="py-3 pr-4 font-mono text-xs">${trade.amount.toFixed(2)}</td>
                        <td className="py-3 text-right">
                          <span className={`font-bold text-xs ${trade.result === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                            {trade.result === 'win' ? '✓ WIN' : '✗ LOSS'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
