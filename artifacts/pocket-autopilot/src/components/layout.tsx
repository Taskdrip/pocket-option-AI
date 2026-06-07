import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, Settings, ShieldAlert, LogOut, Cpu, Zap } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return <>{children}</>;

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  if (user.isAdmin) {
    navigation.push({ name: "Admin", href: "/admin", icon: ShieldAlert });
  }

  const poAccountType = user.poAccountType ?? "demo";

  return (
    <div className="flex h-screen flex-col md:flex-row bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <div className="w-full md:w-60 border-r border-white/6 bg-card flex flex-col flex-shrink-0 relative">
        {/* Ambient glow top */}
        <div className="absolute top-0 left-0 w-full h-32 bg-blue-600/5 blur-[40px] pointer-events-none" />

        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-white/6 relative z-10">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-2.5 flex-shrink-0">
            <Cpu className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-base tracking-tight">
            Pocket<span className="text-gradient">Autopilot</span>
          </span>
        </div>

        {/* PO Account badge */}
        {user.poConnected && (
          <div className="mx-4 mt-4 px-3 py-2.5 rounded-xl bg-white/3 border border-white/6 relative z-10">
            <div className="text-xs text-muted-foreground mb-1">Active account</div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 animate-pulse ${poAccountType === 'live' ? 'bg-green-400' : 'bg-purple-400'}`} />
              <span className={`text-sm font-semibold ${poAccountType === 'live' ? 'text-green-300' : 'text-purple-300'}`}>
                {poAccountType === 'live' ? 'Live Account' : 'Demo Account'}
              </span>
            </div>
            <div className="font-display text-lg font-bold mt-0.5">
              ${poAccountType === 'live'
                ? (user.poLiveBalance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : (user.poDemoBalance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto relative z-10">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || location.startsWith(item.href + '/');
            return (
              <Link key={item.name} href={item.href}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 text-sm ${
                  isActive
                    ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20 font-semibold'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground font-medium'
                }`}>
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-400' : ''}`} />
                  {item.name}
                  {isActive && <div className="ml-auto w-1 h-1 rounded-full bg-blue-400" />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom: credits + logout */}
        <div className="p-4 border-t border-white/6 space-y-3 relative z-10">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/3 border border-white/6">
            <Zap className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground">Credits</div>
              <div className="font-display font-bold text-sm">{user.credits.toFixed(0)}</div>
            </div>
          </div>
          <div className="px-2 text-xs text-muted-foreground truncate">{user.email}</div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background">
        {/* Top bar */}
        <div className="h-16 border-b border-white/6 flex items-center px-6 bg-card/30 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {navigation.find(n => location === n.href || location.startsWith(n.href + '/'))?.name ?? 'Dashboard'}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Hi, <span className="text-foreground font-semibold">{user.username}</span></span>
            </div>
            {user.botActive && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Bot Active
              </div>
            )}
          </div>
        </div>

        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
