import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Zap, Shield, Activity, ChevronRight, ArrowRight, Bot, BarChart3, Cpu, Globe } from "lucide-react";
import heroChart from "@/assets/images/hero-chart.png";
import aiBot from "@/assets/images/ai-bot.png";

const STATS = [
  { label: "Active Traders", value: "14,820" },
  { label: "Trades Executed", value: "3.2M+" },
  { label: "Avg Win Rate", value: "82.4%" },
  { label: "Uptime", value: "99.97%" },
];

const FEATURES = [
  {
    icon: Bot,
    title: "AI Signal Engine",
    desc: "Multi-indicator consensus model using RSI, MACD, Bollinger Bands, Stochastic, EMA crossovers and Williams %R — voted together for high-confidence entries.",
    color: "blue",
  },
  {
    icon: Globe,
    title: "Live & Demo Control",
    desc: "Seamlessly switch between your Pocket Option live and demo accounts. Test strategies risk-free, then deploy with one click to real capital.",
    color: "purple",
  },
  {
    icon: Zap,
    title: "Sub-Second Execution",
    desc: "Trades are placed the moment a signal fires. No hesitation, no slippage from manual entry. Pure algorithmic speed on your account.",
    color: "cyan",
  },
];

const STEPS = [
  { n: "01", title: "Register", desc: "Create your free account in under 60 seconds." },
  { n: "02", title: "Connect Pocket Option", desc: "Paste your session SSID. We'll verify your live and demo balances." },
  { n: "03", title: "Set & Forget", desc: "Activate the bot, pick your pair and timeframe — the AI handles the rest." },
];

const colorMap: Record<string, string> = {
  blue: "from-blue-500/20 to-blue-600/5 border-blue-500/20 group-hover:border-blue-500/40",
  purple: "from-purple-500/20 to-purple-600/5 border-purple-500/20 group-hover:border-purple-500/40",
  cyan: "from-cyan-500/20 to-cyan-600/5 border-cyan-500/20 group-hover:border-cyan-500/40",
};
const iconColorMap: Record<string, string> = {
  blue: "text-blue-400",
  purple: "text-purple-400",
  cyan: "text-cyan-400",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />
      {/* Ambient orbs */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/6 rounded-full blur-[100px] pointer-events-none" />

      {/* ── NAV ── */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center glow-blue">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">
              Pocket<span className="text-gradient">Autopilot</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it works</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-0 glow-blue">
                Get Started
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-1.5 backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full bg-green-400 pulse-dot" />
                <span className="text-xs font-semibold text-blue-300 tracking-wide">LIVE ENGINE v2.4 — ONLINE</span>
              </div>

              {/* Headline */}
              <div>
                <h1 className="font-display text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.05] tracking-tight">
                  Trade Pocket Option
                  <br />
                  <span className="text-gradient">on Autopilot.</span>
                </h1>
                <p className="mt-6 text-lg text-muted-foreground max-w-lg leading-relaxed">
                  Connect your Pocket Option account. The AI analyses 7 technical indicators in real-time and executes trades on your live <em>or</em> demo account — fully automated.
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/register">
                  <Button size="lg" className="h-12 px-7 font-semibold text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-0 glow-blue">
                    Start for Free
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="h-12 px-7 font-semibold text-base border-white/10 hover:border-white/20 bg-white/5">
                    I have an account
                  </Button>
                </Link>
              </div>

              {/* Micro-trust */}
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-blue-400" />Non-custodial</div>
                <div className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-blue-400" />Sub-50ms execution</div>
                <div className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-blue-400" />24/7 monitoring</div>
              </div>
            </div>

            {/* Hero visual */}
            <div className="relative">
              {/* Glow behind image */}
              <div className="absolute inset-0 bg-blue-600/15 blur-[80px] rounded-3xl" />
              <div className="relative gradient-border overflow-hidden rounded-2xl shadow-2xl">
                <img
                  src={heroChart}
                  alt="AI trading terminal"
                  className="w-full rounded-2xl"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent rounded-2xl" />
              </div>

              {/* Floating stats */}
              <div className="absolute -left-6 bottom-16 z-20 glass rounded-xl px-4 py-3 shadow-xl border border-white/8">
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">Live Win Rate (24h)</div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span className="font-display text-2xl font-bold text-green-400">82.4%</span>
                </div>
              </div>
              <div className="absolute -right-4 top-12 z-20 glass rounded-xl px-4 py-3 shadow-xl border border-white/8">
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">Active Bot Signal</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="font-display font-bold text-green-400">BUY · EUR/USD</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="max-w-7xl mx-auto mt-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="glass rounded-xl px-6 py-5 text-center border border-white/6">
                <div className="font-display text-3xl font-bold text-gradient">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-1.5 mb-5">
              <span className="text-xs font-semibold text-blue-300 tracking-wide">FEATURES</span>
            </div>
            <h2 className="font-display text-4xl lg:text-5xl font-bold tracking-tight">
              Everything you need to<br /><span className="text-gradient">automate trading</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Built specifically for Pocket Option. No generic bots — deep integration with live and demo accounts.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className={`group gradient-border rounded-xl p-7 bg-gradient-to-br ${colorMap[f.color]} border transition-all duration-300 hover:translate-y-[-2px] cursor-default`}>
                  <div className={`w-11 h-11 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center mb-5`}>
                    <Icon className={`w-5 h-5 ${iconColorMap[f.color]}`} />
                  </div>
                  <h3 className="font-display text-lg font-bold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── AI VISUAL SECTION ── */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/5 px-4 py-1.5">
              <span className="text-xs font-semibold text-purple-300 tracking-wide">AI TECHNOLOGY</span>
            </div>
            <h2 className="font-display text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
              Seven indicators.<br /><span className="text-gradient-green">One clear decision.</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Our consensus engine runs RSI, MACD, Bollinger Bands, Stochastic, ATR, Williams %R, and three EMA crossovers simultaneously. Each indicator votes. The majority wins. Confidence is quantified before any trade fires.
            </p>
            <div className="space-y-3 pt-2">
              {["Real-time signal refreshes on every API call", "Confidence scoring 40–98% on every signal", "HOLD signals block trades below threshold", "Full indicator breakdown in the dashboard"].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  </div>
                  <span className="text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-purple-600/10 blur-[80px] rounded-3xl" />
            <div className="relative gradient-border rounded-2xl overflow-hidden">
              <img src={aiBot} alt="AI Neural Network" className="w-full rounded-2xl" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent rounded-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5 mb-5">
              <span className="text-xs font-semibold text-cyan-300 tracking-wide">HOW IT WORKS</span>
            </div>
            <h2 className="font-display text-4xl font-bold tracking-tight">
              Up and running in <span className="text-gradient">3 steps</span>
            </h2>
          </div>
          <div className="space-y-4">
            {STEPS.map((step, i) => (
              <div key={step.n} className="flex gap-6 items-start p-6 glass rounded-xl border border-white/6 hover:border-blue-500/20 transition-colors">
                <div className="font-display text-4xl font-bold text-blue-500/20 flex-shrink-0 w-16 text-right">{step.n}</div>
                <div className="pt-1">
                  <div className="font-display font-bold text-lg mb-1">{step.title}</div>
                  <div className="text-muted-foreground text-sm leading-relaxed">{step.desc}</div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="ml-auto flex-shrink-0 self-center">
                    <ChevronRight className="w-5 h-5 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/register">
              <Button size="lg" className="h-12 px-10 font-semibold text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-0 glow-blue">
                Create free account
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── LIVE TICKER BANNER ── */}
      <section className="border-y border-white/5 bg-card/30 py-4 overflow-hidden">
        <div className="flex gap-10 whitespace-nowrap" style={{ animation: 'ticker 30s linear infinite' }}>
          {[
            { pair: "EUR/USD", dir: "BUY", conf: 87, color: "green" },
            { pair: "GBP/JPY", dir: "SELL", conf: 79, color: "red" },
            { pair: "BTC/USD", dir: "BUY", conf: 91, color: "green" },
            { pair: "AUD/USD", dir: "BUY", conf: 82, color: "green" },
            { pair: "USD/CAD", dir: "SELL", conf: 74, color: "red" },
            { pair: "EUR/GBP", dir: "BUY", conf: 88, color: "green" },
            { pair: "EUR/USD", dir: "BUY", conf: 87, color: "green" },
            { pair: "GBP/JPY", dir: "SELL", conf: 79, color: "red" },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-3 flex-shrink-0">
              {t.dir === 'BUY'
                ? <TrendingUp className="w-4 h-4 text-green-400" />
                : <TrendingDown className="w-4 h-4 text-red-400" />}
              <span className="font-mono text-sm font-bold">{t.pair}</span>
              <span className={`text-sm font-bold ${t.color === 'green' ? 'text-green-400' : 'text-red-400'}`}>{t.dir}</span>
              <span className="text-xs text-muted-foreground">{t.conf}%</span>
              <span className="text-white/10 mx-2">|</span>
            </div>
          ))}
        </div>
        <style>{`
          @keyframes ticker {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Cpu className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-bold text-sm">PocketAutopilot</span>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            © 2025 PocketAutopilot. Trading involves significant risk. Past performance does not guarantee future results.
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link href="/login" className="hover:text-foreground transition-colors">Login</Link>
            <Link href="/register" className="hover:text-foreground transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
