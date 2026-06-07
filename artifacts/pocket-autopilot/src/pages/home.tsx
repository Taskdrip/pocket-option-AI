import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Cpu, TrendingUp, ShieldCheck, Zap } from "lucide-react";
import heroChart from "@/assets/images/hero-chart.png";
import aiBot from "@/assets/images/ai-bot.png";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground dark selection:bg-primary/30">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cpu className="w-6 h-6 text-primary" />
            <span className="font-display font-bold text-xl tracking-wider">POCKET<span className="text-primary">AUTOPILOT</span></span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Login</Link>
            <Link href="/register">
              <Button className="font-bold tracking-wide">GET ACCESS</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-8">
            <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse mr-2"></span>
              Live Trading Engine v2.4 Online
            </div>
            <h1 className="font-display text-5xl lg:text-7xl font-bold leading-tight tracking-tight">
              DOMINATE THE <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">MARKETS.</span><br/>ON AUTOPILOT.
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              Connect your Pocket Option account. Activate the AI. Watch the algorithm execute high-probability trades with ruthless precision. No emotions. Just math.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto font-bold text-lg h-14 px-8">START TRADING NOW</Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="w-full sm:w-auto font-bold text-lg h-14 px-8">VIEW PERFORMANCE</Button>
              </Link>
            </div>
            <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground font-medium">
              <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary"/> Bank-grade Security</div>
              <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-primary"/> &lt;50ms Latency</div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
            <img src={heroChart} alt="Trading Terminal" className="rounded-xl border border-border/50 shadow-2xl shadow-primary/20" />
            {/* Overlay stats card */}
            <div className="absolute -left-6 bottom-12 z-20 bg-card/90 backdrop-blur-md border border-border p-4 rounded-lg shadow-xl">
              <div className="text-xs text-muted-foreground mb-1 uppercase font-bold tracking-wider">Live Win Rate (24h)</div>
              <div className="font-display text-3xl font-bold text-success flex items-center">
                <TrendingUp className="w-6 h-6 mr-2" />
                82.4%
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-card/30 border-y border-border/50" id="how-it-works">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl lg:text-4xl font-bold mb-4">THE ALGORITHM NEVER SLEEPS</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Our proprietary neural network analyzes thousands of data points across multiple timeframes to execute trades with clinical accuracy.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Deep Market Analysis", desc: "Real-time processing of RSI, MACD, and custom EMA crossovers to pinpoint exact entry conditions." },
              { title: "Risk Management", desc: "Automated stake sizing and daily loss limits protect your capital from market volatility." },
              { title: "Demo to Live", desc: "Test the waters with virtual funds, then flip the switch to real money when you're ready to scale." }
            ].map((feature, i) => (
              <div key={i} className="bg-background border border-border p-8 rounded-xl hover:border-primary/50 transition-colors group">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Cpu className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Bot Visual */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 relative">
            <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
            <img src={aiBot} alt="AI Neural Network" className="relative z-10 rounded-xl" />
          </div>
          <div className="order-1 lg:order-2 space-y-6">
            <h2 className="font-display text-4xl lg:text-5xl font-bold leading-tight">BUILT FOR SERIOUS<br/>TRADERS.</h2>
            <p className="text-lg text-muted-foreground">Stop guessing. Start executing.</p>
            <ul className="space-y-4 pt-4">
              {[
                "Instant Pocket Option integration via SSID",
                "Sub-millisecond trade execution",
                "Advanced AI signal dashboard",
                "Full trade history and performance metrics"
              ].map((item, i) => (
                <li key={i} className="flex items-center font-medium">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3 text-sm">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="pt-8">
              <Link href="/register">
                <Button size="lg" className="h-12 px-8 font-bold">CREATE ACCOUNT</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-background">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 mb-4 md:mb-0 text-muted-foreground">
            <Cpu className="w-5 h-5" />
            <span className="font-display font-bold">POCKET AUTOPILOT</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2025 AI Trading Systems. All rights reserved. Trading involves risk.</p>
        </div>
      </footer>
    </div>
  );
}
