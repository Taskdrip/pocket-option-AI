import { useAuth } from "@/lib/auth";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Activity, Shield, Zap, TrendingUp, Users, Clock, Award, ChevronRight } from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Section */}
      <section className="relative pt-20 pb-24 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background -z-10" />
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-mono mb-8">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            LIVE: AI BOT V2.4 DEPLOYED
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6">
            AUTOPILOT WEALTH <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              GENERATION.
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            The world's most accessible AI trading robot. Engineered for absolute beginners to earn passive income on Pocket Option without knowing a single thing about trading.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="h-14 px-8 text-lg font-bold font-mono w-full sm:w-auto shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                START TRADING FREE
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="outline" size="lg" className="h-14 px-8 text-lg w-full sm:w-auto border-border">
                SEE HOW IT WORKS
              </Button>
            </Link>
          </div>
        </div>

        {/* Hero Image / Ticker */}
        <div className="mt-16 md:mt-24 container mx-auto px-4 max-w-5xl">
          <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-2xl shadow-primary/10">
            <div className="h-12 bg-muted border-b border-border/50 flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <div className="w-3 h-3 rounded-full bg-accent" />
                <div className="w-3 h-3 rounded-full bg-primary" />
              </div>
              <div className="mx-auto bg-background px-4 py-1 rounded text-xs font-mono text-muted-foreground flex gap-4 w-full max-w-md overflow-hidden">
                <span className="text-primary whitespace-nowrap animate-[marquee_10s_linear_infinite]">EUR/USD +82% • GBP/JPY +79% • AUD/USD +85% • USD/JPY +81% • XAU/USD +89%</span>
              </div>
            </div>
            <div className="aspect-video relative bg-black">
              <img src="/src/assets/images/hero-robot.png" alt="AI Trading Robot" className="w-full h-full object-cover opacity-80 mix-blend-screen" />
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                <div>
                  <p className="text-sm font-mono text-muted-foreground mb-1">CURRENT WIN RATE</p>
                  <p className="text-4xl md:text-5xl font-black text-primary drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]">87.4%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-muted-foreground mb-1">ACTIVE BOTS</p>
                  <p className="text-2xl md:text-3xl font-bold text-foreground">12,408</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Stats/Logos */}
      <section className="py-12 border-y border-border/50 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-border/50">
            <div>
              <p className="text-3xl font-black text-foreground">$12.4M+</p>
              <p className="text-sm font-mono text-muted-foreground mt-1">USER PROFIT</p>
            </div>
            <div>
              <p className="text-3xl font-black text-foreground">250ms</p>
              <p className="text-sm font-mono text-muted-foreground mt-1">EXECUTION SPEED</p>
            </div>
            <div>
              <p className="text-3xl font-black text-foreground">99.9%</p>
              <p className="text-sm font-mono text-muted-foreground mt-1">UPTIME</p>
            </div>
            <div>
              <p className="text-3xl font-black text-foreground">24/7</p>
              <p className="text-sm font-mono text-muted-foreground mt-1">AI MONITORING</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Features Section */}
      <section id="features" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">Command the Markets</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Enterprise-grade AI execution disguised as a simple toggle switch.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { icon: <Activity className="w-8 h-8" />, title: "Zero Experience Needed", desc: "If you can click a button, you can trade. The AI analyzes 10,000+ data points per second." },
              { icon: <Zap className="w-8 h-8" />, title: "Lightning Execution", desc: "Direct Pocket Option integration. Trades are executed instantly with zero slippage." },
              { icon: <Shield className="w-8 h-8" />, title: "Ironclad Risk Management", desc: "Built-in stop losses and daily limits protect your capital automatically." }
            ].map((f, i) => (
              <div key={i} className="p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(34,197,94,0.1)] transition-all group">
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. How it Works */}
      <section id="how-it-works" className="py-24 bg-card border-y border-border/50">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1 space-y-8">
              <div>
                <h2 className="text-4xl font-black mb-4">Three Steps to Autopilot.</h2>
                <p className="text-lg text-muted-foreground">Setup takes less than 5 minutes. After that, the AI does the heavy lifting.</p>
              </div>
              <div className="space-y-6">
                {[
                  { title: "Connect Your Account", desc: "Link your Pocket Option ID securely in one click." },
                  { title: "Load Your Credits", desc: "1 trade = 1 credit. We only win when you trade." },
                  { title: "Flip the Switch", desc: "Turn on Auto-Confirm and watch the AI execute trades 24/7." }
                ].map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-primary/20 text-primary font-mono font-bold flex items-center justify-center border border-primary/30">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-1">{step.title}</h4>
                      <p className="text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 w-full">
              <div className="p-6 rounded-2xl bg-background border border-border/50 shadow-2xl relative">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-primary to-secondary rounded-2xl opacity-20 blur-lg" />
                <div className="relative bg-card rounded-xl p-6 border border-border">
                  <div className="flex items-center justify-between mb-8">
                    <div className="space-y-1">
                      <p className="text-xs font-mono text-muted-foreground">SYSTEM STATUS</p>
                      <p className="text-2xl font-bold text-primary">ONLINE</p>
                    </div>
                    <div className="w-16 h-8 rounded-full bg-primary relative cursor-pointer">
                      <div className="absolute right-1 top-1 w-6 h-6 rounded-full bg-white shadow-sm" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-2 rounded bg-muted w-3/4" />
                    <div className="h-2 rounded bg-muted w-1/2" />
                    <div className="h-2 rounded bg-muted w-5/6" />
                  </div>
                  <div className="mt-8 pt-6 border-t border-border/50 flex justify-between items-center">
                    <p className="font-mono text-sm">PROFIT TODAY</p>
                    <p className="font-mono text-xl text-primary font-bold">+$482.50</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Live Trades / Copy Trading Showcase */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">The AI is Trading Right Now.</h2>
            <p className="text-muted-foreground text-lg">Watch our neural network execute perfect setups in real-time.</p>
          </div>
          
          <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
            <div className="grid grid-cols-5 bg-muted/50 p-4 border-b border-border/50 font-mono text-sm text-muted-foreground font-bold">
              <div className="col-span-2">ASSET</div>
              <div>DIRECTION</div>
              <div>CONFIDENCE</div>
              <div className="text-right">RESULT</div>
            </div>
            <div className="divide-y divide-border/50">
              {[
                { asset: "EUR/USD", dir: "BUY", conf: 92, res: "WIN", type: "primary" },
                { asset: "GBP/JPY", dir: "SELL", conf: 88, res: "WIN", type: "primary" },
                { asset: "XAU/USD", dir: "BUY", conf: 95, res: "WIN", type: "primary" },
                { asset: "USD/CHF", dir: "SELL", conf: 76, res: "LOSS", type: "destructive" },
                { asset: "AUD/USD", dir: "BUY", conf: 84, res: "WIN", type: "primary" },
              ].map((trade, i) => (
                <div key={i} className="grid grid-cols-5 p-4 items-center hover:bg-muted/20 transition-colors">
                  <div className="col-span-2 font-mono font-bold">{trade.asset}</div>
                  <div className={`font-mono font-bold text-${trade.dir === 'BUY' ? 'primary' : 'destructive'}`}>{trade.dir}</div>
                  <div className="font-mono">{trade.conf}%</div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-bold bg-${trade.type}/10 text-${trade.type} border border-${trade.type}/20`}>
                      {trade.res}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link href="/register">
              <Button variant="link" className="text-primary font-mono group">
                VIEW FULL HISTORY <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Pricing / Credits */}
      <section id="pricing" className="py-24 bg-card border-y border-border/50">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Pay Per Performance.</h2>
            <p className="text-muted-foreground text-lg">No monthly subscriptions. Just buy credits and let the bot trade. 1 Credit = 1 Trade.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { credits: 100, price: 10, label: "STARTER" },
              { credits: 500, price: 45, label: "PRO", highlight: true },
              { credits: 1000, price: 80, label: "WHALE" },
            ].map((p, i) => (
              <div key={i} className={`rounded-2xl border p-8 text-center relative ${p.highlight ? 'border-primary bg-primary/5 shadow-[0_0_30px_rgba(34,197,94,0.15)] scale-105 z-10' : 'border-border/50 bg-background'}`}>
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full font-mono tracking-widest">
                    MOST POPULAR
                  </div>
                )}
                <p className="text-muted-foreground font-mono text-sm mb-4">{p.label}</p>
                <div className="flex justify-center items-end gap-1 mb-2">
                  <span className="text-5xl font-black">${p.price}</span>
                  <span className="text-muted-foreground mb-1">/ USDT</span>
                </div>
                <div className="text-2xl font-bold text-primary font-mono my-6">{p.credits} CR</div>
                <Link href="/register">
                  <Button className={`w-full font-mono font-bold ${p.highlight ? '' : 'variant-outline border-border'}`}>
                    GET STARTED
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Social Proof */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-black text-center mb-16">Traders are scaling up.</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Alex K.", profit: "+$1,240", time: "in 7 days", text: "I literally turned it on and went to sleep. Woke up to 14 winning trades. This is insane." },
              { name: "Sarah M.", profit: "+$4,890", time: "in 30 days", text: "The risk management is what sold me. It never overtrades. Just takes the high-probability setups and exits." },
              { name: "David T.", profit: "+$850", time: "in 48 hours", text: "Pocket Option integration is flawless. No latency, no weird errors. It just works." },
            ].map((t, i) => (
              <div key={i} className="p-6 rounded-xl bg-card border border-border/50">
                <div className="flex justify-between items-start mb-4">
                  <div className="font-bold">{t.name}</div>
                  <div className="text-right">
                    <div className="text-primary font-bold font-mono">{t.profit}</div>
                    <div className="text-xs text-muted-foreground">{t.time}</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground italic">"{t.text}"</p>
                <div className="mt-4 flex gap-1 text-accent">
                  {[1,2,3,4,5].map(star => <span key={star}>★</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Final CTA */}
      <section className="py-32 relative overflow-hidden border-t border-border/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-5xl md:text-7xl font-black mb-6">Stop watching.<br/>Start earning.</h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-xl mx-auto">Join thousands of traders who have already automated their income. Get 100 free credits when you register today.</p>
          <Link href="/register">
            <Button size="lg" className="h-16 px-10 text-xl font-bold font-mono shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:shadow-[0_0_50px_rgba(34,197,94,0.5)] transition-shadow">
              CLAIM 100 FREE CREDITS
            </Button>
          </Link>
          <p className="mt-6 text-sm text-muted-foreground">No credit card required to start.</p>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 bg-card border-t border-border/50 text-center text-sm text-muted-foreground">
        <p className="font-mono mb-2">POCKET<span className="text-foreground">AI</span></p>
        <p>© {new Date().getFullYear()} Pocket Option AI Trader. All rights reserved.</p>
        <p className="text-xs mt-4 opacity-50 max-w-2xl mx-auto">Trading involves significant risk. This AI tool is for educational and automated execution purposes. Past performance does not guarantee future results.</p>
      </footer>
    </div>
  );
}
