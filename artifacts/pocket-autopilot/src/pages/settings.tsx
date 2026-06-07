import { useAuth } from "@/hooks/use-auth";
import { useUpdateBotStatus, useListTopups, useCreateTopup } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey, getListTopupsQueryKey } from "@workspace/api-client-react";
import {
  Loader2, CreditCard, ShieldCheck,
  ChevronDown, ChevronUp, CheckCircle, XCircle, Clock,
  Wallet, Eye, EyeOff, Mail, Lock, LogOut,
  TrendingUp, RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import axios from "axios";

const WALLET_ADDRESSES: Record<string, string> = {
  usdt: "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE",
  ton: "UQDm5TcVqDeMrkiDxXKmrBpNxjGcDqBvxApXANMZvCkMvw2A",
};

const PACKAGE_PRICES: Record<string, number> = {
  "100": 10,
  "500": 45,
  "1000": 80,
};

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateBot = useUpdateBotStatus();
  const createTopup = useCreateTopup();
  const { data: topups } = useListTopups();

  // PO credentials form
  const [poEmail, setPoEmail] = useState(user?.poEmail || "");
  const [poPassword, setPoPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accountType, setAccountType] = useState<"live" | "demo">(
    (user?.poAccountType as "live" | "demo") || "demo"
  );
  const [isConnecting, setIsConnecting] = useState(false);

  // Manual SSID fallback
  const [showSsidFallback, setShowSsidFallback] = useState(false);
  const [ssid, setSsid] = useState("");
  const [showSsid, setShowSsid] = useState(false);
  const [isSsidConnecting, setIsSsidConnecting] = useState(false);

  // Topup
  const [topupPackage, setTopupPackage] = useState<"100" | "500" | "1000">("100");
  const [currency, setCurrency] = useState<"ton" | "usdt">("usdt");
  const [txHash, setTxHash] = useState("");

  const refreshUser = async () => {
    const res = await axios.get("/api/auth/me");
    queryClient.setQueryData(getGetMeQueryKey(), res.data);
  };

  // ── Connect with email/password ──
  const handleConnectCredentials = async () => {
    if (!poEmail.trim() || !poPassword.trim()) {
      toast({ variant: "destructive", title: "Email and password required" });
      return;
    }
    setIsConnecting(true);
    try {
      const res = await axios.post("/api/pocket-option/connect-credentials", {
        poEmail: poEmail.trim(),
        poPassword: poPassword.trim(),
        poAccountType: accountType,
      });
      queryClient.setQueryData(getGetMeQueryKey(), res.data.account);
      toast({
        title: "✓ Pocket Option connected!",
        description: `${accountType === "live" ? "Live" : "Demo"} account active. Live: $${res.data.liveBalance?.toFixed(2) ?? 0} · Demo: $${res.data.demoBalance?.toFixed(2) ?? 0}`,
      });
      setPoPassword("");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: err?.response?.data?.error || "Could not log in to Pocket Option. Check your credentials.",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // ── Connect with SSID (manual fallback) ──
  const handleConnectSsid = async () => {
    if (!ssid.trim()) {
      toast({ variant: "destructive", title: "SSID required" });
      return;
    }
    setIsSsidConnecting(true);
    try {
      const res = await axios.post("/api/pocket-option/connect", {
        pocketOptionId: ssid.trim(),
        poAccountType: accountType,
      });
      queryClient.setQueryData(getGetMeQueryKey(), res.data.account);
      toast({ title: "✓ Connected via SSID" });
      setSsid("");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "SSID connection failed",
        description: err?.response?.data?.error || "Invalid SSID",
      });
    } finally {
      setIsSsidConnecting(false);
    }
  };

  // ── Disconnect ──
  const handleDisconnect = async () => {
    try {
      await axios.delete("/api/pocket-option/disconnect");
      await refreshUser();
      toast({ title: "Pocket Option account disconnected" });
    } catch {
      toast({ variant: "destructive", title: "Failed to disconnect" });
    }
  };

  // ── Switch live/demo ──
  const handleSwitchAccount = async (type: "live" | "demo") => {
    try {
      await axios.patch("/api/pocket-option/switch", { poAccountType: type });
      await refreshUser();
      setAccountType(type);
      toast({ title: `Switched to ${type === "live" ? "Live" : "Demo"} account` });
    } catch {
      toast({ variant: "destructive", title: "Failed to switch account" });
    }
  };

  const handleAutoConfirmToggle = (checked: boolean) => {
    updateBot.mutate({ data: { autoConfirm: checked } }, {
      onSuccess: (u) => {
        queryClient.setQueryData(getGetMeQueryKey(), u);
        toast({ title: checked ? "Auto-confirm enabled" : "Auto-confirm disabled" });
      }
    });
  };

  const handleTopup = () => {
    if (!txHash) {
      toast({ variant: "destructive", title: "Transaction hash required" });
      return;
    }
    createTopup.mutate({ data: { package: topupPackage, currency, txHash } }, {
      onSuccess: () => {
        toast({ title: "Topup submitted", description: "Pending admin verification — usually within 1 hour." });
        setTxHash("");
        queryClient.invalidateQueries({ queryKey: getListTopupsQueryKey() });
      },
      onError: (err: any) => toast({ variant: "destructive", title: "Submission failed", description: err?.response?.data?.error })
    });
  };

  const walletAddress = WALLET_ADDRESSES[currency];
  const usdPrice = PACKAGE_PRICES[topupPackage];
  const isConnected = user?.poConnected ?? false;

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your Pocket Option connection and trading preferences.</p>
      </div>

      {/* ── Pocket Option Connection ── */}
      <div className="glass rounded-2xl border border-white/6 overflow-hidden">
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
        <div className="p-6 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2.5 font-semibold text-base mb-0.5">
                {/* PO logo placeholder */}
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-xs font-black text-white">PO</div>
                Pocket Option Account
              </div>
              <p className="text-sm text-muted-foreground">Log in with your Pocket Option email and password to control your live and demo trades.</p>
            </div>
            {isConnected && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full flex-shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Connected
              </div>
            )}
          </div>

          {/* Connected balances + account switcher */}
          {isConnected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSwitchAccount("live")}
                  className={`rounded-xl p-4 text-left border transition-all ${
                    user?.poAccountType === "live"
                      ? "bg-gradient-to-br from-green-500/15 to-emerald-600/5 border-green-500/30 glow-green"
                      : "bg-white/3 border-white/8 hover:border-white/15"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${user?.poAccountType === "live" ? "bg-green-400 animate-pulse" : "bg-gray-500"}`} />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Live Account</span>
                    {user?.poAccountType === "live" && <span className="ml-auto text-xs font-bold text-green-400">ACTIVE</span>}
                  </div>
                  <div className={`font-display text-2xl font-bold ${user?.poAccountType === "live" ? "text-green-300" : "text-foreground"}`}>
                    ${(user?.poLiveBalance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Click to trade on Live</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchAccount("demo")}
                  className={`rounded-xl p-4 text-left border transition-all ${
                    user?.poAccountType === "demo"
                      ? "bg-gradient-to-br from-purple-500/15 to-indigo-600/5 border-purple-500/30"
                      : "bg-white/3 border-white/8 hover:border-white/15"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${user?.poAccountType === "demo" ? "bg-purple-400 animate-pulse" : "bg-gray-500"}`} />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Demo Account</span>
                    {user?.poAccountType === "demo" && <span className="ml-auto text-xs font-bold text-purple-400">ACTIVE</span>}
                  </div>
                  <div className={`font-display text-2xl font-bold ${user?.poAccountType === "demo" ? "text-purple-300" : "text-foreground"}`}>
                    ${(user?.poDemoBalance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Click to trade on Demo</div>
                </button>
              </div>

              {user?.poEmail && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
                  <Mail className="w-3.5 h-3.5" />
                  Connected as <span className="text-foreground font-semibold">{user.poEmail}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleDisconnect}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-red-400 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Disconnect Pocket Option
              </button>
            </div>
          )}

          {/* Login form (shown when not connected OR always available to reconnect) */}
          {!isConnected && (
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Pocket Option Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={poEmail}
                    onChange={e => setPoEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="pl-10 h-11 bg-white/5 border-white/10 focus:border-blue-500/50"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Pocket Option Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={poPassword}
                    onChange={e => setPoPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-11 bg-white/5 border-white/10 focus:border-blue-500/50"
                    onKeyDown={e => { if (e.key === "Enter") handleConnectCredentials(); }}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(v => !v)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Account type */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Start Trading On</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAccountType("demo")}
                    className={`rounded-xl p-3 text-center border transition-all ${accountType === "demo" ? "border-purple-500/40 bg-purple-500/10 text-purple-300" : "border-white/8 bg-white/3 text-muted-foreground hover:border-white/15"}`}
                  >
                    <div className="text-sm font-semibold">Demo</div>
                    <div className="text-xs opacity-70">Practice mode</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType("live")}
                    className={`rounded-xl p-3 text-center border transition-all ${accountType === "live" ? "border-green-500/40 bg-green-500/10 text-green-300" : "border-white/8 bg-white/3 text-muted-foreground hover:border-white/15"}`}
                  >
                    <div className="text-sm font-semibold">Live</div>
                    <div className="text-xs opacity-70">Real money</div>
                  </button>
                </div>
              </div>

              <Button
                className="w-full h-11 font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 border-0"
                onClick={handleConnectCredentials}
                disabled={isConnecting || !poEmail.trim() || !poPassword.trim()}
              >
                {isConnecting ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" />Logging in to Pocket Option...</>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Connect Pocket Option Account
                  </>
                )}
              </Button>

              <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Your credentials are used only to authenticate with Pocket Option. We never store your password in plain text.
              </div>
            </div>
          )}

          {/* Reconnect form when already connected */}
          {isConnected && (
            <details className="group">
              <summary className="list-none flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors py-1">
                <RefreshCw className="w-3.5 h-3.5" />
                Reconnect with different credentials
                <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="space-y-3 mt-4 pt-4 border-t border-white/6">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={poEmail}
                    onChange={e => setPoEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="pl-10 h-10 bg-white/5 border-white/10 text-sm"
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={poPassword}
                    onChange={e => setPoPassword(e.target.value)}
                    placeholder="Password"
                    className="pl-10 pr-10 h-10 bg-white/5 border-white/10 text-sm"
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(v => !v)}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button
                  size="sm"
                  className="w-full h-9 font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-0"
                  onClick={handleConnectCredentials}
                  disabled={isConnecting}
                >
                  {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reconnect"}
                </Button>
              </div>
            </details>
          )}

          {/* SSID manual fallback */}
          <div className="pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={() => setShowSsidFallback(o => !o)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showSsidFallback ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              Can't log in? Use session SSID manually
            </button>

            {showSsidFallback && (
              <div className="mt-4 space-y-3">
                <div className="rounded-xl p-4 bg-amber-500/5 border border-amber-500/10 text-xs text-amber-200 space-y-2">
                  <div className="font-semibold">How to get your SSID:</div>
                  <ol className="list-decimal list-inside space-y-1 text-amber-300/80">
                    <li>Log in at <a href="https://pocketoption.com" target="_blank" rel="noopener noreferrer" className="underline">pocketoption.com</a></li>
                    <li>Press F12 → Application → Cookies → pocketoption.com</li>
                    <li>Copy the value of <code className="bg-white/10 px-1 rounded">_po_uname</code></li>
                  </ol>
                </div>
                <div className="relative">
                  <Input
                    value={ssid}
                    onChange={e => setSsid(e.target.value)}
                    type={showSsid ? "text" : "password"}
                    placeholder="Paste session SSID..."
                    className="pr-10 font-mono text-xs h-10 bg-white/5 border-white/10"
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowSsid(v => !v)}>
                    {showSsid ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-9 text-xs"
                  onClick={handleConnectSsid}
                  disabled={isSsidConnecting || !ssid.trim()}
                >
                  {isSsidConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Connect via SSID"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bot Settings ── */}
      <div className="glass rounded-2xl border border-white/6 p-6">
        <div className="flex items-center gap-2 font-semibold mb-1">
          <ShieldCheck className="w-5 h-5 text-green-400" />
          Bot Settings
        </div>
        <p className="text-sm text-muted-foreground mb-5">Configure how the autopilot places trades on your Pocket Option account.</p>
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/6">
          <div>
            <div className="font-semibold text-sm">Auto-Confirm Trades</div>
            <div className="text-xs text-muted-foreground mt-0.5">Execute trades automatically on every AI signal without manual approval.</div>
          </div>
          <Switch
            checked={user?.autoConfirm ?? false}
            onCheckedChange={handleAutoConfirmToggle}
            className="data-[state=checked]:bg-green-600"
          />
        </div>
      </div>

      {/* ── Buy Credits ── */}
      <div className="glass rounded-2xl border border-white/6 overflow-hidden">
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
        <div className="p-6">
          <div className="flex items-center gap-2 font-semibold mb-1">
            <CreditCard className="w-5 h-5 text-purple-400" />
            Buy Credits
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            1 credit = 1 automated trade. Current balance:{" "}
            <span className="font-semibold text-foreground">{user?.credits ?? 0} credits</span>
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Package</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["100", "500", "1000"] as const).map(pkg => (
                    <button
                      key={pkg}
                      type="button"
                      onClick={() => setTopupPackage(pkg)}
                      className={`rounded-xl p-3 text-center border transition-all ${topupPackage === pkg ? "border-purple-500/40 bg-purple-500/10 text-purple-300" : "border-white/8 bg-white/3 text-muted-foreground hover:border-white/15"}`}
                    >
                      <div className="font-display font-bold text-sm">{pkg}</div>
                      <div className="text-xs mt-0.5">${PACKAGE_PRICES[pkg]}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["usdt", "ton"] as const).map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCurrency(c)}
                      className={`rounded-xl p-3 text-center border transition-all flex items-center justify-center gap-2 ${currency === c ? "border-blue-500/40 bg-blue-500/10 text-blue-300" : "border-white/8 bg-white/3 text-muted-foreground hover:border-white/15"}`}
                    >
                      <Wallet className="w-4 h-4" />
                      <span className="font-semibold text-sm">{c === "usdt" ? "USDT TRC20" : "TON"}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl p-4 bg-white/3 border border-white/8">
                <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Send exactly ${usdPrice} to:</div>
                <div className="font-mono text-xs break-all text-foreground font-medium mt-1 select-all">{walletAddress}</div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Transaction Hash</label>
                <Input
                  value={txHash}
                  onChange={e => setTxHash(e.target.value)}
                  placeholder="Paste your TXID after sending..."
                  className="bg-white/5 border-white/10 h-11 font-mono text-sm"
                />
              </div>

              <Button
                className="w-full h-11 font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border-0"
                onClick={handleTopup}
                disabled={createTopup.isPending}
              >
                {createTopup.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting...</> : "Submit for Verification"}
              </Button>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-3 pb-3 border-b border-white/6">Topup History</h3>
              <div className="space-y-2">
                {!topups?.length ? (
                  <div className="text-sm text-muted-foreground text-center py-8">No topup history yet.</div>
                ) : (
                  topups.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/6">
                      <div>
                        <div className="font-semibold text-sm">{t.credits} Credits</div>
                        <div className="text-xs text-muted-foreground">{format(new Date(t.createdAt), "MMM d, yyyy")}</div>
                      </div>
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${t.status === "approved" ? "bg-green-500/10 text-green-400" : t.status === "rejected" ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"}`}>
                        {t.status === "approved" ? <CheckCircle className="w-3 h-3" /> : t.status === "rejected" ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {t.status}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
