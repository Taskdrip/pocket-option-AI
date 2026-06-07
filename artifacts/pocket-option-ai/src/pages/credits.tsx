import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useCreateTopup, useListTopups, getListTopupsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Coins, Zap, Shield, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const PACKAGES = [
  { id: "100", credits: 100, price: 10, popular: false },
  { id: "500", credits: 500, price: 45, popular: true },
  { id: "1000", credits: 1000, price: 80, popular: false },
];

export default function Credits() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState("");
  
  const { data: topups, isLoading: topupsLoading } = useListTopups({ query: { enabled: !!user, queryKey: getListTopupsQueryKey() } });
  const createTopup = useCreateTopup();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage || !txHash) {
      toast({ title: "Validation Error", description: "Please select a package and enter transaction hash.", variant: "destructive" });
      return;
    }

    createTopup.mutate(
      { data: { package: selectedPackage as any, txHash, currency: "usdt" } },
      {
        onSuccess: () => {
          toast({ title: "Request Submitted", description: "Your topup request is pending admin approval." });
          setTxHash("");
          setSelectedPackage(null);
          queryClient.invalidateQueries({ queryKey: ["/api/topups"] });
        },
        onError: (err: any) => {
          toast({ title: "Submission Failed", description: err.response?.data?.error || "An error occurred", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Buy Credits</h1>
        <p className="text-muted-foreground">Fuel your trading bot. 1 Credit = 1 AI Trade Execution.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PACKAGES.map((pkg) => (
          <Card 
            key={pkg.id} 
            className={`relative cursor-pointer transition-all border-2 ${
              selectedPackage === pkg.id ? 'border-primary shadow-[0_0_20px_rgba(34,197,94,0.15)] scale-[1.02]' : 'border-border/50 hover:border-primary/50'
            }`}
            onClick={() => setSelectedPackage(pkg.id)}
            data-testid={`card-package-${pkg.id}`}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold font-mono rounded-full">
                MOST POPULAR
              </div>
            )}
            <CardHeader className="text-center pt-8">
              <CardTitle className="flex justify-center items-center gap-2 text-3xl font-mono">
                <Coins className="w-8 h-8 text-primary" /> {pkg.credits}
              </CardTitle>
              <CardDescription className="text-sm font-mono tracking-widest uppercase mt-2">CREDITS</CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-8">
              <div className="text-4xl font-black">${pkg.price}</div>
              <p className="text-sm text-muted-foreground mt-2">USDT (TRC20)</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
            <CardDescription>Send USDT (TRC20) to the address below, then submit the TX Hash.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-muted/30 rounded-lg border border-border/50 space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-widest font-mono">Deposit Address (USDT TRC20)</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-background rounded border border-border/50 text-sm break-all font-mono">
                  TXYZ1234567890abcdefghijklmnopqrstuv
                </code>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="txHash">Transaction Hash (TXID)</Label>
                <Input 
                  id="txHash" 
                  value={txHash} 
                  onChange={(e) => setTxHash(e.target.value)} 
                  placeholder="Paste transaction hash here..."
                  className="font-mono bg-background"
                  required
                  data-testid="input-txhash"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full font-bold font-mono" 
                disabled={!selectedPackage || !txHash || createTopup.isPending}
                data-testid="button-submit-topup"
              >
                {createTopup.isPending ? "SUBMITTING..." : "SUBMIT PAYMENT"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle>History</CardTitle>
            <CardDescription>Your recent topup requests.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-0 max-h-[400px]">
            {topupsLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : topups && topups.length > 0 ? (
              <div className="divide-y divide-border/50">
                {topups.map(t => (
                  <div key={t.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-bold font-mono">{t.credits} CR</div>
                      <div className="text-xs text-muted-foreground font-mono mt-1 w-32 truncate">{t.txHash}</div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <Badge variant="outline" className={`mb-1 ${
                        t.status === 'approved' ? 'bg-primary/10 text-primary border-primary/20' : 
                        t.status === 'rejected' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-muted/50'
                      }`}>
                        {t.status.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">No topup history found.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
