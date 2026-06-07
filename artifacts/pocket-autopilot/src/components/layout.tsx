import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Activity, LayoutDashboard, Settings, ShieldAlert, LogOut, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return <>{children}</>;

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  if (user.isAdmin) {
    navigation.push({ name: "Admin Panel", href: "/admin", icon: ShieldAlert });
  }

  return (
    <div className="flex h-screen flex-col md:flex-row bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <div className="w-full md:w-64 border-r border-border bg-card flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Cpu className="w-6 h-6 text-primary mr-2" />
          <span className="font-display font-bold text-xl tracking-tight">AUTO<span className="text-primary">PILOT</span></span>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-colors cursor-pointer ${isActive ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-border">
          <div className="mb-4 px-2">
            <div className="text-sm font-medium text-muted-foreground mb-1">Balance</div>
            <div className="font-display font-bold text-2xl text-success flex items-center">
              ${user.credits.toFixed(2)}
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-muted-foreground hover:text-destructive" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background p-6">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
