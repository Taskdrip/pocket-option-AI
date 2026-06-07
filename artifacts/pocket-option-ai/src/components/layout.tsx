import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Coins, LayoutDashboard, LineChart, LogOut, Settings, ShieldAlert } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const isPublicPage = location === "/" || location === "/login" || location === "/register";

  if (isPublicPage) {
    return (
      <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold font-mono tracking-tighter text-primary">
              POCKET<span className="text-foreground">AI</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
              <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
              <Link href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</Link>
              <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            </nav>
            <div className="flex items-center gap-4">
              {user ? (
                <Link href="/dashboard">
                  <Button variant="outline" className="font-mono border-primary/50 text-primary hover:bg-primary/10">Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">Log In</Link>
                  <Link href="/register">
                    <Button className="font-mono bg-primary text-primary-foreground hover:bg-primary/90">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="pt-16">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-border/50 bg-card shrink-0 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border/50">
          <Link href="/" className="text-xl font-bold font-mono tracking-tighter text-primary">
            POCKET<span className="text-foreground">AI</span>
          </Link>
        </div>
        <div className="p-4 flex-1 flex flex-col gap-2">
          <NavLink href="/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" active={location === "/dashboard"} />
          <NavLink href="/trading" icon={<LineChart size={18} />} label="Live Trading" active={location === "/trading"} />
          <NavLink href="/credits" icon={<Coins size={18} />} label="Buy Credits" active={location === "/credits"} />
          <NavLink href="/settings" icon={<Settings size={18} />} label="Settings" active={location === "/settings"} />
          {user?.isAdmin && (
            <NavLink href="/admin" icon={<ShieldAlert size={18} />} label="Admin Panel" active={location === "/admin"} />
          )}
        </div>
        <div className="p-4 border-t border-border/50">
          <div className="mb-4 px-2">
            <p className="text-xs text-muted-foreground font-mono mb-1">CREDITS</p>
            <p className="text-2xl font-bold text-primary">{user?.credits?.toLocaleString() || 0}</p>
          </div>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={logout}>
            <LogOut size={18} className="mr-2" /> Log Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        <header className="h-16 border-b border-border/50 bg-background flex items-center px-6 md:hidden">
          <p className="font-mono font-bold text-lg">{location.substring(1).toUpperCase()}</p>
        </header>
        <div className="p-6 md:p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavLink({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link href={href}>
      <Button
        variant="ghost"
        className={`w-full justify-start ${active ? "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
      >
        <span className="mr-3">{icon}</span>
        {label}
      </Button>
    </Link>
  );
}
