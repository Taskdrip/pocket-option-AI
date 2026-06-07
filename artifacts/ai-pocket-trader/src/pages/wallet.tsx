import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGetMe, useListTopups, useCreateTopup, getListTopupsQueryKey, getGetMeQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Wallet as WalletIcon, Copy, ExternalLink, Clock, CheckCircle, XCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const WALLET_ADDRESS = "UQBxyz1234567890ABCDEFG_TonWalletAddress";

const PACKAGES = [
  { id: "100", credits: 100, usd: 10, ton: 2 },
  { id: "500", credits: 500, usd: 45, ton: 9 },
  { id: "1000", credits: 1000, usd: 80, ton: 16 },
];

const formSchema = z.object({
  txHash: z.string().min(10, "Transaction hash is required"),
});

export default function Wallet() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user } = useGetMe();
  const { data: topups } = useListTopups();
  const createTopup = useCreateTopup();

  const [selectedPackage, setSelectedPackage] = useState<string>("500");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      txHash: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createTopup.mutate(
      { 
        data: { 
          package: selectedPackage as "100" | "500" | "1000", 
          txHash: values.txHash 
        } 
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTopupsQueryKey() });
          toast({
            title: "Top-up Request Submitted",
            description: "Your request is pending admin approval.",
          });
          form.reset();
        },
        onError: (error) => {
          toast({
            title: "Submission Failed",
            description: error.data?.error || "Unknown error occurred",
            variant: "destructive",
          });
        }
      }
    );
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(WALLET_ADDRESS);
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard",
    });
  };

  const activePackage = PACKAGES.find(p => p.id === selectedPackage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-tight">WALLET</h1>
          <p className="text-muted-foreground font-mono text-sm">Purchase credits for auto-trading</p>
        </div>
        
        <div className="bg-card border border-border px-4 py-2 rounded-lg flex items-center gap-3">
          <WalletIcon className="w-5 h-5 text-primary" />
          <div className="font-mono">
            <span className="text-muted-foreground text-xs uppercase mr-2">Balance</span>
            <span className="font-bold text-lg">{user?.credits || 0} CRD</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="font-mono text-lg">1. Select Package</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {PACKAGES.map((pkg) => (
                  <div 
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all flex justify-between items-center ${
                      selectedPackage === pkg.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border/50 hover:border-primary/50'
                    }`}
                  >
                    <div>
                      <div className="font-mono font-bold text-lg">{pkg.credits} CREDITS</div>
                      <div className="font-mono text-sm text-muted-foreground">${pkg.usd} USD</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-primary">{pkg.ton} TON</div>
                      {pkg.id === "1000" && <Badge className="mt-1 font-mono text-[10px] py-0">BEST VALUE</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="font-mono text-lg">2. Send TON Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Send exactly <strong className="text-foreground">{activePackage?.ton} TON</strong> to the network address below.
              </p>
              
              <div className="p-3 bg-background rounded border border-border flex items-center justify-between">
                <code className="text-sm text-primary break-all">{WALLET_ADDRESS}</code>
                <Button variant="ghost" size="icon" onClick={copyToClipboard}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="border-border/50 bg-card/50 backdrop-blur h-full">
            <CardHeader>
              <CardTitle className="font-mono text-lg">3. Submit Transaction Hash</CardTitle>
              <CardDescription className="font-mono text-xs">
                After sending TON, paste the transaction hash here for verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="txHash"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-mono text-xs text-muted-foreground uppercase">Transaction Hash</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 5d4...8f2a" className="font-mono bg-background" {...field} />
                        </FormControl>
                        <FormDescription className="font-mono text-xs">
                          Allow 5-10 minutes for admin verification after submission.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full font-mono uppercase tracking-wider" 
                    disabled={createTopup.isPending || !form.formState.isValid}
                  >
                    {createTopup.isPending ? "Submitting..." : "Submit Payment Proof"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="font-mono text-lg">Payment History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!topups || topups.length === 0 ? (
             <div className="text-center py-8 text-muted-foreground font-mono text-sm">
             No top-up requests found
           </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="font-mono text-xs">PACKAGE</TableHead>
                  <TableHead className="font-mono text-xs">AMOUNT</TableHead>
                  <TableHead className="font-mono text-xs">TX HASH</TableHead>
                  <TableHead className="font-mono text-xs">STATUS</TableHead>
                  <TableHead className="font-mono text-xs text-right">DATE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topups.map((req) => (
                  <TableRow key={req.id} className="border-border/50 hover:bg-card">
                    <TableCell className="font-mono font-medium">{req.credits} CRD</TableCell>
                    <TableCell className="font-mono">{req.tonAmount} TON</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-[150px] truncate">
                      {req.txHash}
                    </TableCell>
                    <TableCell>
                      {req.status === 'pending' && <Badge variant="outline" className="font-mono text-yellow-500 border-yellow-500/20"><Clock className="w-3 h-3 mr-1"/> PENDING</Badge>}
                      {req.status === 'approved' && <Badge variant="outline" className="font-mono text-primary border-primary/20"><CheckCircle className="w-3 h-3 mr-1"/> APPROVED</Badge>}
                      {req.status === 'rejected' && <Badge variant="outline" className="font-mono text-destructive border-destructive/20"><XCircle className="w-3 h-3 mr-1"/> REJECTED</Badge>}
                    </TableCell>
                    <TableCell className="font-mono text-right text-muted-foreground text-xs">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
