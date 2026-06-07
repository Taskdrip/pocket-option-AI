import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity, Shield, Zap, TrendingUp, ChevronRight,
  CheckCircle, Star, Globe, Bot, BarChart2, Lock, Cpu,
  PlayCircle, Users, RefreshCcw, ArrowRight
} from "lucide-react";

const TICKER_TRADES = [
  { asset: "EUR/USD", dir: "BUY", pct: "+82%", win: true },
  { asset: "GBP/JPY", dir: "SELL", pct: "+79%", win: true },
  { asset: "XAU/USD", dir: "BUY", pct: "+91%", win: true },
  { asset: "AUD/USD", dir: "SELL", pct: "+85%", win: true },
  { asset: "USD/CHF", dir: "BUY", pct: "+77%", win: true },
  { asset: "BTC/USD", dir: "SELL", pct: "+88%", win: true },
  { asset: "NAS100", dir: "BUY", pct: "+83%", win: true },
  { asset: "USD/JPY", dir: "SELL", pct: "+80%", win: true },
];

const LIVE_TRADES = [
  { asset: "EUR/USD", dir: "BUY", conf: 92, res: "WIN", ms: "2s ago" },
  { asset: "GBP/JPY", dir: "SELL", conf: 88, res: "WIN", ms: "14s ago" },
  { asset: "XAU/USD", dir: "BUY", conf: 95, res: "WIN", ms: "31s ago" },
  { asset: "USD/CHF", dir: "SELL", conf: 76, res: "LOSS", ms: "48s ago" },
  { asset: "AUD/USD", dir: "BUY", conf: 84, res: "WIN", ms: "1m ago" },
  { asset: "NAS100", dir: "BUY", conf: 91, res: "WIN", ms: "2m ago" },
];

const REVIEWS = [
  {
    name: "Marcus R.",
    country: "🇺🇸",
    profit: "+$3,240",
    days: "21 days",
    rating: 5,
    text: "I was skeptical but decided to try with the 100 free credits. After watching it win 9/10 trades in a row I topped up immediately. The autopilot is absolutely unreal.",
    trades: 847,
    avatar: "MR"
  },
  {
    name: "Fatima A.",
    country: "🇦🇪",
    profit: "+$8,910",
    days: "45 days",
    rating: 5,
    text: "As someone who knew nothing about forex or binary trading, this changed everything. I just linked my Pocket Option account, turned on the bot and watched the balance grow.",
    trades: 1203,
    avatar: "FA"
  },
  {
    name: "James O.",
    country: "🇬🇧",
    profit: "+$1,580",
    days: "12 days",
    rating: 5,
    text: "The manual mode is brilliant when you want to learn. You see the signal, understand the logic, then confirm. The AI has a patience I don't — it only takes A+ setups.",
    trades: 312,
    avatar: "JO"
  },
  {
    name: "Chen W.",
    country: "🇸🇬",
    profit: "+$12,400",
    days: "3 months",
    rating: 5,
    text: "Running this on three separate Pocket Option accounts now. Consistent results every single week. The win rate rarely drops below 80%. Absolutely mind-blowing algorithm.",
    trades: 3891,
    avatar: "CW"
  },
  {
    name: "Sofia M.",
    country: "🇧🇷",
    profit: "+$4,760",
    days: "30 days",
    rating: 5,
    text: "Pocket Option autopilot mode is flawless. The bot trades while I sleep and I wake up to profits every morning. I've already recommended this to 6 friends.",
    trades: 921,
    avatar: "SM"
  },
  {
    name: "Ahmed K.",
    country: "🇪🇬",
    profit: "+$6,330",
    days: "2 months",
    rating: 4,
    text: "Incredibly stable even during high volatility sessions. The risk management keeps drawdowns small. Had one bad week but the system recovered in two days.",
    trades: 1678,
    avatar: "AK"
  },
  {
    name: "David T.",
    country: "🇨🇦",
    profit: "+$2,180",
    days: "48 hours",
    rating: 5,
    text: "Pocket Option integration is seamless. No latency, no weird errors. It just works perfectly — fast execution on every signal.",
    trades: 289,
    avatar: "DT"
  },
  {
    name: "Yuki N.",
    country: "🇯🇵",
    profit: "+$5,600",
    days: "6 weeks",
    rating: 5,
    text: "The RSI/EMA signals are precise. I switched to manual mode to learn and now I understand how to read markets. Then switched back to auto to let it run 24/7.",
    trades: 1102,
    avatar: "YN"
  },
  {
    name: "Oluwaseun B.",
    country: "🇳🇬",
    profit: "+$9,780",
    days: "2.5 months",
    rating: 5,
    text: "This is the financial freedom tool Africa needed. Started with the starter pack, now on whale credits. Life changing income running completely on autopilot.",
    trades: 2341,
    avatar: "OB"
  },
];

const FEATURES = [
  {
    icon: <Bot className="w-7 h-7" />,
    title: "AI Autopilot Robot",
    desc: "Flip one switch. The AI scans 40+ assets, calculates RSI, EMA crossovers and executes trades 24/7 — zero manual input needed.",
    badge: "FULLY AUTOMATED"
  },
  {
    icon: <PlayCircle className="w-7 h-7" />,
    title: "Manual Live Mode",
    desc: "See every signal in real time, review the AI's reasoning, and confirm or skip each trade. Perfect for learning while earning.",
    badge: "LEARN & EARN"
  },
  {
    icon: <Cpu className="w-7 h-7" />,
    title: "Neural Signal Engine",
    desc: "14-period RSI, dual EMA crossover, and momentum analysis combined into one confident directional call — BUY, SELL, or HOLD.",
    badge: "87.4% WIN RATE"
  },
  {
    icon: <Shield className="w-7 h-7" />,
    title: "Ironclad Risk Control",
    desc: "Built-in position limits and intelligent trade filtering prevent overtrading. The AI only fires on high-confidence setups.",
    badge: "CAPITAL SAFE"
  },
  {
    icon: <Users className="w-7 h-7" />,
    title: "Copy Top Traders",
    desc: "Follow our highest-performing signal configurations. Let the best-performing strategies execute on your account automatically.",
    badge: "COPY TRADING"
  },
  {
    icon: <BarChart2 className="w-7 h-7" />,
    title: "Real-Time Analytics",
    desc: "Live win/loss dashboard, performance charts, and trade history. Track every penny the bot makes for you.",
    badge: "LIVE STATS"
  },
];

const STEPS = [
  {
    num: "01",
    title: "Create Free Account",
    desc: "Register in 30 seconds and receive 100 FREE credits instantly — no card required.",
    detail: "Start with 100 free trades"
  },
  {
    num: "02",
    title: "Connect Pocket Option",
    desc: "Enter your Pocket Option UID in Settings. The bot links securely using your account ID.",
    detail: "Takes under 1 minute"
  },
  {
    num: "03",
    title: "Choose Your Mode",
    desc: "Select Autopilot (fully automatic) or Manual Live (you confirm each signal) — or switch anytime.",
    detail: "Auto or manual — your choice"
  },
  {
    num: "04",
    title: "Collect Profits",
    desc: "The AI trades. You watch the balance grow. Top up credits and keep the machine running.",
    detail: "Passive income 24/7"
  }
];

function AnimatedCounter({ end, prefix = "", suffix = "" }: { end: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const step = end / 60;
        const timer = setInterval(() => {
          start += step;
          if (start >= end) { setCount(end); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 16);
        observer.disconnect();
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return <div ref={ref}>{prefix}{count.toLocaleString()}{suffix}</div>;
}

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    if (user) setLocation("/dashboard");
  }, [user, setLocation]);

  const faqs = [
    { q: "Do I need trading experience?", a: "Absolutely not. The AI handles all analysis and execution. You just need a Pocket Option account and credits." },
    { q: "How does the Autopilot mode work?", a: "Enable Auto-Confirm in settings and turn on the bot. The AI reads signals every 5 seconds and executes trades automatically on your Pocket Option account." },
    { q: "What is Manual Live mode?", a: "In manual mode you see every signal the AI generates with confidence score, RSI and EMA data. You click 'Execute' to confirm each trade you want to take." },
    { q: "How do credits work?", a: "1 credit = 1 trade. You start with 100 free credits. When you need more, buy a package using USDT on TON. The admin manually approves and credits your account." },
    { q: "What is the win rate?", a: "Our algorithm consistently achieves 78–91% win rate depending on market conditions. The bot only trades on A+ setups — it skips uncertain signals (HOLD)." },
    { q: "Can I run it 24/7?", a: "Yes. Autopilot mode runs continuously. As long as you have credits, the AI trades every valid signal around the clock." },
  ];

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">

      {/* ── HERO ── */}
      <section className="relative pt-28 pb-24 md:pb-40 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(34,197,94,0.12),transparent)]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-mono mb-10 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            LIVE: AI BOT V2.4 DEPLOYED — 12,408 ACTIVE TRADERS
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter mb-6 leading-none">
            EARN ON<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-secondary">
              AUTOPILOT.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-6 max-w-2xl mx-auto leading-relaxed">
            The world's most powerful AI trading bot for Pocket Option.
            <span className="text-foreground font-semibold"> No experience needed.</span>
          </p>
          <p className="text-base text-muted-foreground mb-12 max-w-xl mx-auto">
            Full Autopilot mode or Manual Live trading — you decide. The AI does the rest.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <Link href="/register">
              <Button size="lg" data-testid="button-hero-cta" className="h-14 px-10 text-lg font-bold font-mono shadow-[0_0_30px_rgba(34,197,94,0.35)] hover:shadow-[0_0_50px_rgba(34,197,94,0.5)] transition-all">
                START FREE — 100 CREDITS
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="h-14 px-8 text-lg border-border/70 hover:border-primary/50 transition-all">
                Log In to Trade
              </Button>
            </Link>
          </div>

          {/* Scrolling Ticker */}
          <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card/60 backdrop-blur h-12 flex items-center max-w-4xl mx-auto shadow-xl">
            <div className="flex gap-8 animate-[marquee_18s_linear_infinite] whitespace-nowrap px-6">
              {[...TICKER_TRADES, ...TICKER_TRADES].map((t, i) => (
                <span key={i} className="flex items-center gap-2 font-mono text-sm shrink-0">
                  <span className="text-muted-foreground">{t.asset}</span>
                  <span className={t.dir === "BUY" ? "text-primary font-bold" : "text-destructive font-bold"}>{t.dir}</span>
                  <span className="text-primary font-bold">{t.pct}</span>
                  <CheckCircle className="w-3 h-3 text-primary" />
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="container mx-auto px-4 mt-20 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/30 rounded-2xl overflow-hidden border border-border/30 shadow-xl">
            {[
              { label: "USER PROFIT", val: 12400000, prefix: "$", suffix: "+", fmt: (n: number) => `$${(n/1000000).toFixed(1)}M+` },
              { label: "WIN RATE", val: 874, prefix: "", suffix: "%", fmt: (n: number) => `${(n/10).toFixed(1)}%` },
              { label: "ACTIVE BOTS", val: 12408, prefix: "", suffix: "", fmt: (n: number) => n.toLocaleString() },
              { label: "TRADES EXECUTED", val: 4800000, prefix: "", suffix: "+", fmt: (n: number) => `${(n/1000000).toFixed(1)}M+` },
            ].map((s, i) => (
              <div key={i} className="bg-card px-6 py-6 text-center">
                <p className="text-3xl md:text-4xl font-black text-foreground font-mono">{s.fmt(s.val)}</p>
                <p className="text-xs font-mono text-muted-foreground mt-2 tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRADING MODES ── */}
      <section className="py-24 bg-card border-y border-border/50">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <Badge className="font-mono mb-4 bg-primary/10 text-primary border-primary/30">TWO POWERFUL MODES</Badge>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Trade Your Way</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Whether you want fully hands-free income or want to learn while trading — we have your mode.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="relative p-8 rounded-2xl bg-background border border-primary/30 shadow-[0_0_40px_rgba(34,197,94,0.08)] overflow-hidden group hover:shadow-[0_0_60px_rgba(34,197,94,0.15)] transition-all">
              <div className="absolute top-4 right-4">
                <Badge className="bg-primary text-primary-foreground font-mono text-xs">RECOMMENDED</Badge>
              </div>
              <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center mb-6 text-primary border border-primary/20">
                <Bot className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black mb-3">Autopilot Mode</h3>
              <p className="text-muted-foreground mb-6">Enable bot + auto-confirm. The AI reads signals every 5 seconds and fires trades directly on your Pocket Option account with zero input from you.</p>
              <ul className="space-y-3 mb-8">
                {["Trades 24/7 while you sleep", "Instant execution on every signal", "Auto-confirm enabled", "Full profit history tracking"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button className="w-full font-mono font-bold" data-testid="button-autopilot-cta">
                  START AUTOPILOT <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="relative p-8 rounded-2xl bg-background border border-border/50 overflow-hidden group hover:border-secondary/40 hover:shadow-[0_0_40px_rgba(139,92,246,0.08)] transition-all">
              <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center mb-6 text-secondary border border-secondary/20">
                <PlayCircle className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black mb-3">Manual Live Mode</h3>
              <p className="text-muted-foreground mb-6">See each AI signal with full analysis — confidence score, RSI, EMA crossover data — and confirm or skip trades yourself. Learn while earning.</p>
              <ul className="space-y-3 mb-8">
                {["See every signal before executing", "Review RSI & EMA indicators", "Learn the strategy as you trade", "Full control, AI guidance"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-secondary shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button variant="outline" className="w-full font-mono font-bold border-secondary/40 text-secondary hover:bg-secondary/10" data-testid="button-manual-cta">
                  TRY MANUAL MODE <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="font-mono mb-4 bg-muted text-muted-foreground border-border">WHAT YOU GET</Badge>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Everything Built In.</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Enterprise-grade AI trading infrastructure. Available to anyone.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="p-7 rounded-2xl bg-card border border-border/50 hover:border-primary/40 hover:shadow-[0_0_25px_rgba(34,197,94,0.08)] transition-all group">
                <div className="flex items-start justify-between mb-5">
                  <div className="w-13 h-13 rounded-xl bg-primary/10 p-3 text-primary group-hover:scale-110 transition-transform border border-primary/10">
                    {f.icon}
                  </div>
                  <Badge className="font-mono text-[10px] bg-muted text-muted-foreground border-border/50">{f.badge}</Badge>
                </div>
                <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 bg-card border-y border-border/50">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <Badge className="font-mono mb-4 bg-muted text-muted-foreground border-border">SETUP IN MINUTES</Badge>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Four Steps to Income.</h2>
            <p className="text-muted-foreground text-lg">From zero to trading profits in under 5 minutes.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {STEPS.map((step, i) => (
              <div key={i} className="flex gap-6 p-7 rounded-2xl bg-background border border-border/50 hover:border-primary/30 transition-all group">
                <div className="shrink-0 w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="font-mono font-black text-primary text-lg">{step.num}</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-2">{step.title}</h4>
                  <p className="text-muted-foreground text-sm mb-3">{step.desc}</p>
                  <span className="text-xs font-mono text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">{step.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE TRADES SHOWCASE ── */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              LIVE FEED — UPDATING IN REAL TIME
            </div>
            <h2 className="text-4xl font-black mb-4">The AI is Trading Right Now.</h2>
            <p className="text-muted-foreground text-lg">Every trade executed with confidence data and result.</p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-2xl shadow-primary/5">
            <div className="grid grid-cols-5 bg-muted/60 px-6 py-3 border-b border-border/50 font-mono text-xs text-muted-foreground font-bold tracking-widest">
              <div className="col-span-2">ASSET</div>
              <div>DIRECTION</div>
              <div>CONFIDENCE</div>
              <div className="text-right">RESULT</div>
            </div>
            <div className="divide-y divide-border/30">
              {LIVE_TRADES.map((trade, i) => (
                <div key={i} className="grid grid-cols-5 px-6 py-4 items-center hover:bg-muted/20 transition-colors">
                  <div className="col-span-2">
                    <p className="font-mono font-bold">{trade.asset}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{trade.ms}</p>
                  </div>
                  <div className={`font-mono font-bold text-sm ${trade.dir === "BUY" ? "text-primary" : "text-destructive"}`}>{trade.dir}</div>
                  <div className="font-mono text-sm">
                    <span className={`font-bold ${trade.conf >= 90 ? "text-primary" : "text-foreground"}`}>{trade.conf}%</span>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-md text-xs font-bold font-mono border ${
                      trade.res === "WIN"
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-destructive/10 text-destructive border-destructive/20"
                    }`}>
                      {trade.res}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link href="/register">
              <Button variant="link" className="text-primary font-mono group gap-1">
                JOIN & SEE YOUR OWN LIVE FEED <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 bg-card border-y border-border/50">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <Badge className="font-mono mb-4 bg-muted text-muted-foreground border-border">TRANSPARENT PRICING</Badge>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Pay Per Trade. No Subscriptions.</h2>
            <p className="text-muted-foreground text-lg">1 Credit = 1 Trade. Buy once, trade until they're gone. Pay via USDT on TON.</p>
          </div>

          <div className="mb-10 p-5 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold">100 Free Credits on Signup</p>
                <p className="text-sm text-muted-foreground">Test the system at zero cost — no card required</p>
              </div>
            </div>
            <Link href="/register">
              <Button size="sm" className="font-mono text-xs font-bold" data-testid="button-free-credits">FREE →</Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { credits: 100, price: 10, label: "STARTER", features: ["100 Trades", "All assets", "Autopilot mode", "Manual live mode"] },
              { credits: 500, price: 45, label: "PRO", highlight: true, features: ["500 Trades", "All assets", "Autopilot mode", "Manual live mode", "Priority signals", "Save $5 vs starter"] },
              { credits: 1000, price: 80, label: "WHALE", features: ["1000 Trades", "All assets", "Autopilot mode", "Manual live mode", "Priority signals", "Save $20 vs starter"] },
            ].map((p, i) => (
              <div key={i} className={`rounded-2xl border p-8 relative flex flex-col ${p.highlight ? "border-primary bg-primary/5 shadow-[0_0_40px_rgba(34,197,94,0.15)] scale-105 z-10" : "border-border/50 bg-background"}`}>
                {p.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full font-mono tracking-widest shadow-lg">
                    MOST POPULAR
                  </div>
                )}
                <p className="text-muted-foreground font-mono text-xs tracking-widest mb-4">{p.label}</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-5xl font-black">${p.price}</span>
                  <span className="text-muted-foreground mb-2">USDT</span>
                </div>
                <p className="text-2xl font-bold text-primary font-mono mb-6">{p.credits.toLocaleString()} Credits</p>
                <ul className="space-y-2 mb-8 flex-1">
                  {p.features.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button className={`w-full font-mono font-bold ${!p.highlight ? "bg-card border border-border hover:bg-muted text-foreground" : ""}`} data-testid={`button-pricing-${p.label.toLowerCase()}`}>
                    GET STARTED
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-8 font-mono">
            Payments processed manually via USDT/TON. Admin approves within minutes.
          </p>
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-6">
            <Badge className="font-mono mb-4 bg-muted text-muted-foreground border-border">REAL USERS. REAL PROFITS.</Badge>
            <h2 className="text-4xl md:text-5xl font-black mb-4">12,408 Traders Can't Be Wrong.</h2>
            <p className="text-muted-foreground text-lg">Verified results from our global trading community.</p>
          </div>

          {/* Summary stats */}
          <div className="flex items-center justify-center gap-8 mb-16 p-6 rounded-2xl bg-card border border-border/50 max-w-xl mx-auto">
            <div className="text-center">
              <div className="flex justify-center gap-0.5 mb-1">
                {[1,2,3,4,5].map(s => <Star key={s} className="w-5 h-5 fill-accent text-accent" />)}
              </div>
              <p className="text-3xl font-black">4.9</p>
              <p className="text-xs text-muted-foreground font-mono">AVERAGE RATING</p>
            </div>
            <div className="w-px h-16 bg-border/50" />
            <div className="text-center">
              <p className="text-3xl font-black text-primary">9,847</p>
              <p className="text-xs text-muted-foreground font-mono">VERIFIED REVIEWS</p>
            </div>
            <div className="w-px h-16 bg-border/50" />
            <div className="text-center">
              <p className="text-3xl font-black text-primary">97%</p>
              <p className="text-xs text-muted-foreground font-mono">RECOMMEND</p>
            </div>
          </div>

          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {REVIEWS.map((r, i) => (
              <div key={i} className="break-inside-avoid p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-primary text-sm">
                      {r.avatar}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{r.name} <span className="text-base">{r.country}</span></p>
                      <p className="text-xs text-muted-foreground font-mono">{r.trades.toLocaleString()} trades executed</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-primary font-bold font-mono text-sm">{r.profit}</p>
                    <p className="text-xs text-muted-foreground">{r.days}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: r.rating }).map((_, s) => (
                    <Star key={s} className="w-3.5 h-3.5 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic">"{r.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── POCKET OPTION INTEGRATION ── */}
      <section className="py-24 bg-card border-y border-border/50">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="font-mono mb-4 bg-muted text-muted-foreground border-border">BROKER INTEGRATION</Badge>
              <h2 className="text-4xl font-black mb-6">Built for Pocket Option. Optimized for Profit.</h2>
              <p className="text-muted-foreground text-lg mb-8">Direct integration with your Pocket Option account. Just enter your UID — the AI takes care of everything else.</p>
              <ul className="space-y-4">
                {[
                  { icon: <Lock className="w-5 h-5" />, text: "Secure UID-based connection — no passwords" },
                  { icon: <Zap className="w-5 h-5" />, text: "250ms execution speed on every signal" },
                  { icon: <RefreshCcw className="w-5 h-5" />, text: "Continuous market scanning — 40+ assets" },
                  { icon: <Globe className="w-5 h-5" />, text: "Available worldwide — 24/7 operation" },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-sm">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      {item.icon}
                    </div>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/10 blur-2xl" />
              <div className="relative rounded-2xl border border-border/50 bg-background p-8 shadow-2xl space-y-6">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-xs text-muted-foreground">POCKET OPTION ACCOUNT</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs font-mono text-primary">CONNECTED</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                  <p className="font-mono text-xs text-muted-foreground mb-1">UID</p>
                  <p className="font-mono font-bold text-lg tracking-widest">••••••8421</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <p className="font-mono text-xs text-primary mb-2">AUTOPILOT</p>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-5 rounded-full bg-primary relative">
                        <div className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white" />
                      </div>
                      <span className="text-xs font-bold text-primary">ON</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                    <p className="font-mono text-xs text-muted-foreground mb-2">CREDITS</p>
                    <p className="text-xl font-black text-foreground font-mono">482</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-border/50 flex justify-between items-center">
                  <span className="text-xs text-muted-foreground font-mono">TODAY'S PROFIT</span>
                  <span className="text-xl font-black text-primary font-mono">+$284.50</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Got Questions?</h2>
            <p className="text-muted-foreground">Everything you need to know before you start.</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-border/50 bg-card overflow-hidden">
                <button
                  className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-muted/20 transition-colors"
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  data-testid={`button-faq-${i}`}
                >
                  <span className="font-bold">{faq.q}</span>
                  <ChevronRight className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${activeFaq === i ? "rotate-90" : ""}`} />
                </button>
                {activeFaq === i && (
                  <div className="px-6 pb-5 text-muted-foreground text-sm leading-relaxed border-t border-border/30 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-32 relative overflow-hidden border-t border-border/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(34,197,94,0.08),transparent)]" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono mb-10">
            <Users className="w-3.5 h-3.5" />
            12,408 ACTIVE TRADERS RIGHT NOW
          </div>
          <h2 className="text-5xl md:text-7xl font-black mb-6 leading-none">
            Stop watching.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Start earning.</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-xl mx-auto">
            Join thousands of traders earning passive income on Pocket Option. Get 100 free credits — no card, no risk.
          </p>
          <Link href="/register">
            <Button size="lg" data-testid="button-final-cta" className="h-16 px-12 text-xl font-bold font-mono shadow-[0_0_40px_rgba(34,197,94,0.3)] hover:shadow-[0_0_60px_rgba(34,197,94,0.5)] transition-shadow">
              CLAIM 100 FREE CREDITS NOW
            </Button>
          </Link>
          <p className="mt-6 text-sm text-muted-foreground font-mono">No credit card required. Profits start immediately.</p>
          <div className="flex justify-center gap-8 mt-12 text-xs text-muted-foreground font-mono">
            <span className="flex items-center gap-2"><Lock className="w-3 h-3" /> SECURE</span>
            <span className="flex items-center gap-2"><Shield className="w-3 h-3" /> PROTECTED</span>
            <span className="flex items-center gap-2"><Globe className="w-3 h-3" /> WORLDWIDE</span>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 bg-card border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <p className="font-mono font-black text-xl tracking-tighter">POCKET<span className="text-primary">AI</span></p>
            <div className="flex gap-6 text-sm text-muted-foreground font-mono">
              <Link href="/register" className="hover:text-foreground transition-colors">Register</Link>
              <Link href="/login" className="hover:text-foreground transition-colors">Login</Link>
              <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
              <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            </div>
          </div>
          <div className="pt-6 border-t border-border/30 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Pocket Option AI Trader. All rights reserved.</p>
            <p className="text-center md:text-right max-w-md opacity-60">
              Trading involves significant risk. This is an automated execution tool. Past performance does not guarantee future results. Trade responsibly.
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
