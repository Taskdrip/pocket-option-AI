import { useAuth } from "@/hooks/use-auth";
import { useUpdatePocketOption, useUpdateBotStatus, useListTopups, useCreateTopup } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey, getListTopupsQueryKey } from "@workspace/api-client-react";
import { Loader2, Link as LinkIcon, CreditCard, ShieldCheck } from "lucide-react";
import { format } from "date-fns";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const updatePO = useUpdatePocketOption();
  const updateBot = useUpdateBotStatus();
  const createTopup = useCreateTopup();
  const { data: topups } = useListTopups();

  const [poId, setPoId] = useState(user?.pocketOptionId || "");
  const [topupPackage, setTopupPackage] = useState<"100"|"500"|"1000">("100");
  const [currency, setCurrency] = useState<"ton"|"usdt">("usdt");
  const [txHash, setTxHash] = useState("");

  const handleUpdatePO = () => {
    updatePO.mutate({ data: { pocketOptionId: poId } }, {
      onSuccess: (u) => {
        queryClient.setQueryData(getGetMeQueryKey(), u);
        toast({ title: "Pocket Option ID linked successfully." });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to update ID" })
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
        toast({ title: "Topup request submitted. Pending admin approval." });
        setTxHash("");
        queryClient.invalidateQueries({ queryKey: getListTopupsQueryKey() });
      },
      onError: (err: any) => toast({ variant: "destructive", title: "Submission failed", description: err?.response?.data?.error })
    });
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">SYSTEM CONFIGURATION</h1>
        <p className="text-muted-foreground text-sm">Manage integration parameters and account balances.</p>
      </div>

      <div className="grid gap-6">
        {/* Connection Settings */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-display tracking-wider flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-primary" /> Broker Integration
            </CardTitle>
            <CardDescription>Link your Pocket Option SSID to enable automated execution.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input 
                  value={poId} 
                  onChange={e => setPoId(e.target.value)} 
                  placeholder="Enter Pocket Option SSID"
                  className="bg-background"
                />
              </div>
              <Button onClick={handleUpdatePO} disabled={updatePO.isPending || poId === user?.pocketOptionId}>
                {updatePO.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Link Account"}
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-background/50">
              <div className="space-y-0.5">
                <div className="font-bold">Autonomous Execution (Auto-Confirm)</div>
                <div className="text-sm text-muted-foreground">If enabled, trades will be placed automatically without manual approval.</div>
              </div>
              <Switch checked={user?.autoConfirm} onCheckedChange={handleAutoConfirmToggle} />
            </div>
          </CardContent>
        </Card>

        {/* Topup Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-display tracking-wider flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" /> Acquire Credits
            </CardTitle>
            <CardDescription>Add execution credits to your account. 1 Credit = 1 Automated Trade.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Select Package</label>
                  <Select value={topupPackage} onValueChange={(v: any) => setTopupPackage(v)}>
                    <SelectTrigger className="bg-background h-12">
                      <SelectValue placeholder="Package" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">Starter - 100 Credits ($10)</SelectItem>
                      <SelectItem value="500">Pro - 500 Credits ($45)</SelectItem>
                      <SelectItem value="1000">Whale - 1000 Credits ($80)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Payment Network</label>
                  <Select value={currency} onValueChange={(v: any) => setCurrency(v)}>
                    <SelectTrigger className="bg-background h-12">
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usdt">USDT (TRC20)</SelectItem>
                      <SelectItem value="ton">TON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 bg-muted/30 border border-border rounded-lg text-sm font-mono text-muted-foreground">
                  Send exactly the package amount to:<br/>
                  <span className="text-foreground font-bold break-all">TXYZ...1234567890ABCDEF (Dummy Address)</span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Transaction Hash</label>
                  <Input 
                    value={txHash}
                    onChange={e => setTxHash(e.target.value)}
                    placeholder="Enter TXID to verify..."
                    className="bg-background h-12 font-mono text-sm"
                  />
                </div>

                <Button className="w-full h-12 font-bold" onClick={handleTopup} disabled={createTopup.isPending}>
                  {createTopup.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "SUBMIT VERIFICATION"}
                </Button>
              </div>

              <div>
                <h3 className="font-display font-bold tracking-wide uppercase text-sm mb-4 border-b border-border pb-2">Recent Requests</h3>
                <div className="space-y-3">
                  {!topups?.length ? (
                    <div className="text-sm text-muted-foreground text-center py-8">No topup history found.</div>
                  ) : (
                    topups.map(t => (
                      <div key={t.id} className="flex justify-between items-center p-3 rounded-lg border border-border bg-background/50">
                        <div>
                          <div className="font-bold">{t.credits} Credits</div>
                          <div className="text-xs text-muted-foreground font-mono">{format(new Date(t.createdAt), "MMM d, yyyy")}</div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-bold uppercase
                          ${t.status === 'approved' ? 'bg-success/10 text-success' : 
                            t.status === 'rejected' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                          {t.status}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
