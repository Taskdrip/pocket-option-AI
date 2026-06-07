import { Link, useLocation } from "wouter";
import { clearAuth, getAuthUser } from "@/lib/auth";
import { useGetMe } from "@workspace/api-client-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import {
  Activity,
  Bot,
  History,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user } = useGetMe();
  const authUser = getAuthUser();
  const isAdmin = user?.isAdmin || authUser?.isAdmin;

  const handleLogout = () => {
    clearAuth();
    setLocation("/login");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar className="border-r border-border">
          <SidebarHeader className="p-4 border-b border-border">
            <h2 className="text-xl font-mono font-bold text-primary tracking-tighter">AI_POCKET_TRADER</h2>
            {user && (
              <div className="mt-4 flex items-center justify-between bg-card p-3 rounded-md border border-border">
                <span className="text-xs text-muted-foreground font-mono">CREDITS</span>
                <span className="text-lg font-mono font-bold text-foreground">{user.credits}</span>
              </div>
            )}
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu className="p-2 gap-1">
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/dashboard"}>
                  <Link href="/dashboard">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/signals"}>
                  <Link href="/signals">
                    <Activity className="w-4 h-4" />
                    <span>AI Signals</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/auto-trading"}>
                  <Link href="/auto-trading">
                    <Bot className="w-4 h-4" />
                    <span>Auto Trading</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/history"}>
                  <Link href="/history">
                    <History className="w-4 h-4" />
                    <span>Trade History</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/wallet"}>
                  <Link href="/wallet">
                    <Wallet className="w-4 h-4" />
                    <span>Wallet</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/settings"}>
                  <Link href="/settings">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/admin"}>
                    <Link href="/admin">
                      <ShieldAlert className="w-4 h-4" />
                      <span>Admin</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-border">
            <div className="flex flex-col gap-2">
              <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                <span>Disconnect</span>
              </Button>
              <div className="px-2 pb-1 text-center">
                <Link href="/admin-login" className="text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors">
                  [ Admin Portal ]
                </Link>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
