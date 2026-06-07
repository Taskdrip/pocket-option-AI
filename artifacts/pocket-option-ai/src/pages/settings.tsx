import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Wifi, WifiOff, Eye, EyeOff, RefreshCcw, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [poEmail, setPoEmail] = useState("");
  const [poPassword, setPoPassword] = useState("");
  const [poId, setPoId] = useState("");
  const [accountType, setAccountType] = useState<"live" | "demo">("demo");
  const [showPassword, setShowPassword] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [switching, setSwitching] = useState(false);

  const { data: currentUser, refetch } = useGetMe();
  const activeUser = (currentUser || user) as any;

  useEffect(() => {
    if (activeUser?.poEmail) setPoEmail(activeUser.poEmail);
    if (activeUser?.pocketOptionId) setPoId(activeUser.pocketOptionId);
    if (activeUser?.poAccountType) setAccountType(activeUser.poAccountType as "live" | "demo");
  }, [activeUser?.poEmail, activeUser?.pocketOptionId, activeUser?.poAccountType]);

  const token = localStorage.getItem("apt_token");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poEmail || !poPassword || !poId) {
      toast({ title: "Missing fields", description: "Please fill in all Pocket Option fields.", variant: "destructive" });
      return;
    }
    setConnecting(true);
    try {
      const res = await fetch(`${BASE}/api/pocket-option/connect`, {
        method: "POST",
        headers,
        body: JSON.stringify({ poEmail, poPassword, pocketOptionId: poId, poAccountType: accountType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Connection failed");
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      await refetch();
      toast({ title: "Account Connected!", description: `Pocket Option ${accountType.toUpperCase()} account linked successfully.` });
    } catch (err: any) {
      toast({ title: "Connection Failed", description: err.message, variant: "destructive" });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const res = await fetch(`${BASE}/api/pocket-option/disconnect`, { method: "DELETE", headers });
      if (!res.ok) throw new Error("Disconnect failed");
      setPoEmail(""); setPoPassword(""); setPoId("");
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      await refetch();
      toast({ title: "Account Disconnected", description: "Pocket Option account has been unlinked." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSwitchAccount = async (type: "live" | "demo") => {
    setSwitching(true);
    try {
      const res = await fetch(`${BASE}/api/pocket-option/switch`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ poAccountType: type }),
      });
      if (!res.ok) throw new Error("Switch failed");
      setAccountType(type);
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      await refetch();
      toast({ title: `Switched to ${type.toUpperCase()}`, description: `Now trading on ${type} account.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSwitching(false);
    }
  };

  const isConnected = activeUser?.poConnected;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your Pocket Option account and trading preferences.</p>
      </div>

      {/* Connection Status Banner */}
      <div className={`p-4 rounded-xl border flex items-center justify-between ${isConnected ? "bg-primary/5 border-primary/30" : "bg-muted/30 border-border/50"}`}>
        <div className="flex items-center gap-3">
          {isConnected
            ? <Wifi className="w-5 h-5 text-primary" />
            : <WifiOff className="w-5 h-5 text-muted-foreground" />}
          <div>
            <p className="font-bold text-sm">{isConnected ? "Pocket Option Account Connected" : "No Account Connected"}</p>
            {isConnected && (
              <p className="text-xs text-muted-foreground font-mono">
                UID: {activeUser?.pocketOptionId} · {activeUser?.poEmail} · {(activeUser?.poAccountType || "demo").toUpperCase()}
              </p>
            )}
          </div>
        </div>
        {isConnected && (
          <Badge className="font-mono bg-primary/10 text-primary border-primary/20">
            <CheckCircle className="w-3 h-3 mr-1" /> LIVE
          </Badge>
        )}
      </div>

      {/* Account Switcher — only show when connected */}
      {isConnected && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Account Type</CardTitle>
            <CardDescription>Switch between your Live real-money account and Demo practice account.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleSwitchAccount("demo")}
                disabled={switching || activeUser?.poAccountType === "demo"}
                className={`p-5 rounded-xl border-2 text-left transition-all ${activeUser?.poAccountType === "demo" ? "border-primary bg-primary/5" : "border-border/50 hover:border-border"}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="font-bold font-mono">DEMO</p>
                  {activeUser?.poAccountType === "demo" && <Badge className="bg-primary text-primary-foreground text-xs">ACTIVE</Badge>}
                </div>
                <p className="text-2xl font-black font-mono text-primary">
                  ${activeUser?.poDemoBalance?.toFixed(2) || "10,000.00"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Practice account — no real money</p>
              </button>
              <button
                onClick={() => handleSwitchAccount("live")}
                disabled={switching || activeUser?.poAccountType === "live"}
                className={`p-5 rounded-xl border-2 text-left transition-all ${activeUser?.poAccountType === "live" ? "border-accent bg-accent/5" : "border-border/50 hover:border-border"}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="font-bold font-mono">LIVE</p>
                  {activeUser?.poAccountType === "live" && <Badge className="bg-accent text-accent-foreground text-xs">ACTIVE</Badge>}
                </div>
                <p className="text-2xl font-black font-mono text-accent">
                  ${activeUser?.poLiveBalance?.toFixed(2) || "0.00"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Real money — live trading</p>
              </button>
            </div>
            {switching && <p className="text-center text-sm text-muted-foreground mt-4 font-mono">Switching account...</p>}
          </CardContent>
        </Card>
      )}

      {/* Connect / Update Account Form */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>{isConnected ? "Update Account" : "Connect Pocket Option"}</CardTitle>
          <CardDescription>
            {isConnected
              ? "Update your Pocket Option account credentials."
              : "Link your Pocket Option account to enable live trading. Enter your login email, password and UID."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleConnect} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="poEmail">Pocket Option Email</Label>
              <Input
                id="poEmail"
                type="email"
                value={poEmail}
                onChange={e => setPoEmail(e.target.value)}
                placeholder="your@email.com"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="poPassword">Pocket Option Password</Label>
              <div className="relative">
                <Input
                  id="poPassword"
                  type={showPassword ? "text" : "password"}
                  value={poPassword}
                  onChange={e => setPoPassword(e.target.value)}
                  placeholder="Your Pocket Option password"
                  className="bg-background pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="poId">Pocket Option UID</Label>
              <Input
                id="poId"
                value={poId}
                onChange={e => setPoId(e.target.value)}
                placeholder="e.g. 12345678"
                className="font-mono bg-background"
              />
              <p className="text-xs text-muted-foreground">Find your UID in Pocket Option → Profile → Account Settings.</p>
            </div>

            {/* Account type selection */}
            <div className="space-y-2">
              <Label>Start Trading On</Label>
              <div className="flex gap-3">
                {(["demo", "live"] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAccountType(type)}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 font-mono font-bold text-sm transition-all ${accountType === type ? "border-primary bg-primary/10 text-primary" : "border-border/50 text-muted-foreground hover:border-border"}`}
                  >
                    {type === "demo" ? "📊 DEMO" : "💰 LIVE"}
                  </button>
                ))}
              </div>
              {accountType === "live" && (
                <p className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg p-2">
                  ⚠️ Live trading uses real money. Start with Demo to test the bot first.
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                className="flex-1 font-mono font-bold"
                disabled={connecting}
              >
                {connecting ? (
                  <span className="flex items-center gap-2"><RefreshCcw className="w-4 h-4 animate-spin" /> CONNECTING...</span>
                ) : (
                  isConnected ? "UPDATE ACCOUNT" : "CONNECT ACCOUNT"
                )}
              </Button>
              {isConnected && (
                <Button
                  type="button"
                  variant="outline"
                  className="border-destructive/50 text-destructive hover:bg-destructive/10"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account Details */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Platform Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground font-mono mb-1 text-xs">EMAIL</p>
              <p className="font-medium">{activeUser?.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-mono mb-1 text-xs">USERNAME</p>
              <p className="font-medium">{activeUser?.username}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-mono mb-1 text-xs">CREDITS</p>
              <p className="font-bold text-primary text-lg">{activeUser?.credits?.toLocaleString() || 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-mono mb-1 text-xs">STATUS</p>
              <p className="font-medium text-primary">ACTIVE</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
