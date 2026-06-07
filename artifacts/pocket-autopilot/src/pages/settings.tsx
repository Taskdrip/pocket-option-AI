import { useAuth } from "@/hooks/use-auth";
import { useUpdatePocketOption, useUpdateBotStatus, useListTopups, useCreateTopup } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey, getListTopupsQueryKey } from "@workspace/api-client-react";
import {
  Loader2, Link as LinkIcon, CreditCard, ShieldCheck,
  ExternalLink, ChevronDown, ChevronUp, CheckCircle, XCircle, Clock,
  Monitor, Wallet, Eye, EyeOff
} from "lucide-react";
import { format } from "date-fns";

const WALLET_ADDRESSES: Record<string, string> = {
  usdt: "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE",
  ton: "UQDm5TcVqDeMrkiDxXKmrBpNxjGcDqBvxApXANMZvCkMvw2A",
};

const PACKAGE_PRICES: Record<string, number> = {
  "100": 10,
  "500": 45,
  "1000": 80,
};

function SSIDGuide({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-xl border border-blue-500/15 bg-blue-500/5 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-blue-300 hover:bg-blue-500/5 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Monitor className="w-4 h-4" />
          How to find your Pocket Option SSID
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-blue-500/10">
          <ol className="list-none space-y-2.5 mt-3">
            {[
              <>Log in to <a href="https://pocketoption.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-1">pocketoption.com <ExternalLink className="w-3 h-3" /></a></>,
              <>Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-xs font-mono">F12</kbd> to open DevTools</>,
              <>Go to the <strong className="text-foreground">Application</strong> tab → <strong className="text-foreground">Storage → Cookies</strong> → click the Pocket Option URL</>,
              <>Find the cookie named <code className="px-1.5 py-0.5 rounded bg-white/10 text-xs font-mono">_po_uname</code> or <code className="px-1.5 py-0.5 rounded bg-white/10 text-xs font-mono">session</code></>,
              <>Copy the full <strong className="text-foreground">Value</strong> and paste it below</>,
            ].map((step, i) => (
              <li key={i} className="flex gap-3 text-xs text-muted-foreground leading-relaxed">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-[10px] font-bold mt-0.5">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-xs text-amber-300">
            Your SSID gives access to your PO account. Never share it with anyone else.
          </div>
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updatePO = useUpdatePocketOption();
  const updateBot = useUpdateBotStatus();
  const createTopup = useCreateTopup();
  const { data: topups } = useListTopups();

  const [ssid, setSsid] = useState(user?.pocketOptionId || "");
  const [showSsid, setShowSsid] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [accountType, setAccountType] = useState<"live" | "demo">(
    (user?.poAccountType as "live" | "demo") || "demo"
  );
  const [topupPackage, setTopupPackage] = useState<"100" | "500" | "1000">("100");
  const [currency, setCurrency] = useState<"ton" | "usdt">("usdt");
  const [txHash, setTxHash] = useState("");

  const handleConnect = () => {
    if (!ssid.trim()) {
      toast({ variant: "destructive", title: "SSID required", description: "Paste your Pocket Option session SSID." });
      return;
    }
    updatePO.mutate({
      data: {
        pocketOptionId: ssid.trim(),
        poAccountType: accountType,
      }
    }, {
      onSuccess: (u) => {
        queryClient.setQueryData(getGetMeQueryKey(), u);
        toast({ title: "✓ Pocket Option account connected", description: `${accountType === 'live' ? 'Live' : 'Demo'} account activated.` });
      },
      onError: (err: any) => toast({
        variant: "destructive",
        title: "Connection failed",
        description: err?.response?.data?.error || "Check your SSID and try again."
      })
    });
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
        toast({ title: "Topup request submitted", description: "Pending admin verification — usually within 1 hour." });
        setTxHash("");
        queryClient.invalidateQueries({ queryKey: getListTopupsQueryKey() });
      },
      onError: (err: any) => toast({ variant: "destructive", title: "Submission failed", description: err?.response?.data?.error })
    });
  };

  const walletAddress = WALLET_ADDRESSES[currency];
  const usdPrice = PACKAGE_PRICES[topupPackage];

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your Pocket Option connection and account settings.</p>
      </div>

      {/* ── Pocket Option Connection ── */}
      <div className="glass rounded-2xl border border-white/6 overflow-hidden">
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 font-semibold">
              <LinkIcon className="w-5 h-5 text-blue-400" />
              Pocket Option Connection
            </div>
            {user?.poConnected ? (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Connected
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                Not connected
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-5">Paste your Pocket Option session SSID to link your live and demo accounts.</p>

          <div className="space-y-4">
            <SSIDGuide open={guideOpen} onToggle={() => setGuideOpen(o => !o)} />

            <div className="space-y-3">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Session SSID</label>
              <div className="relative">
                <Input
                  value={ssid}
                  onChange={e => setSsid(e.target.value)}
                  placeholder="Paste your Pocket Option SSID here..."
                  type={showSsid ? "text" : "password"}
                  className="pr-10 font-mono text-sm h-11 bg-white/5 border-white/10 focus:border-blue-500/50"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowSsid(v => !v)}
                >
                  {showSsid ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Default Account</label>
                <Select value={accountType} onValueChange={(v: any) => setAccountType(v)}>
                  <SelectTrigger className="bg-white/5 border-white/10 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="demo">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-400" />
                        Demo Account
                      </div>
                    </SelectItem>
                    <SelectItem value="live">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        Live Account
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleConnect}
                  disabled={updatePO.isPending || !ssid.trim()}
                  className="w-full h-11 font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-0"
                >
                  {updatePO.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Connecting...</>
                  ) : user?.poConnected ? "Reconnect Account" : "Connect Account"}
                </Button>
              </div>
            </div>

            {user?.poConnected && (
              <div className="flex gap-4 mt-1">
                <div className="flex-1 rounded-xl p-4 bg-gradient-to-br from-blue-500/8 to-blue-600/3 border border-blue-500/15">
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Live Balance</div>
                  <div className="font-display text-xl font-bold text-blue-300">
                    ${(user.poLiveBalance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="flex-1 rounded-xl p-4 bg-gradient-to-br from-purple-500/8 to-purple-600/3 border border-purple-500/15">
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Demo Balance</div>
                  <div className="font-display text-xl font-bold text-purple-300">
                    ${(user.poDemoBalance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
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
        <p className="text-sm text-muted-foreground mb-5">Configure how the autopilot places trades on your account.</p>
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/6">
          <div>
            <div className="font-semibold text-sm">Auto-Confirm Trades</div>
            <div className="text-xs text-muted-foreground mt-0.5">Place trades automatically without manual approval on every signal.</div>
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
          <p className="text-sm text-muted-foreground mb-5">1 credit = 1 automated trade. Current balance: <span className="font-semibold text-foreground">{user?.credits ?? 0} credits</span></p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {/* Package */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Package</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["100", "500", "1000"] as const).map(pkg => (
                    <button
                      key={pkg}
                      type="button"
                      onClick={() => setTopupPackage(pkg)}
                      className={`rounded-xl p-3 text-center border transition-all ${
                        topupPackage === pkg
                          ? 'border-purple-500/40 bg-purple-500/10 text-purple-300'
                          : 'border-white/8 bg-white/3 text-muted-foreground hover:border-white/15'
                      }`}
                    >
                      <div className="font-display font-bold text-sm">{pkg}</div>
                      <div className="text-xs mt-0.5">${PACKAGE_PRICES[pkg]}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Currency */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["usdt", "ton"] as const).map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCurrency(c)}
                      className={`rounded-xl p-3 text-center border transition-all flex items-center justify-center gap-2 ${
                        currency === c
                          ? 'border-blue-500/40 bg-blue-500/10 text-blue-300'
                          : 'border-white/8 bg-white/3 text-muted-foreground hover:border-white/15'
                      }`}
                    >
                      <Wallet className="w-4 h-4" />
                      <span className="font-semibold text-sm">{c === 'usdt' ? 'USDT TRC20' : 'TON'}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Wallet address */}
              <div className="rounded-xl p-4 bg-white/3 border border-white/8">
                <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Send exactly ${usdPrice} to:</div>
                <div className="font-mono text-xs break-all text-foreground font-medium mt-1 select-all">{walletAddress}</div>
              </div>

              {/* TX Hash */}
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

            {/* Topup history */}
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
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        t.status === 'approved' ? 'bg-green-500/10 text-green-400' :
                        t.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {t.status === 'approved' ? <CheckCircle className="w-3 h-3" /> :
                         t.status === 'rejected' ? <XCircle className="w-3 h-3" /> :
                         <Clock className="w-3 h-3" />}
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
