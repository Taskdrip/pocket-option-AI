import { useGetMe, useAdminListTopups, useApproveTopup, getAdminListTopupsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, XCircle, ShieldAlert } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function AdminPanel() {
  const { data: user, isLoading: isUserLoading } = useGetMe();
  const [, setLocation] = useLocation();

  if (!isUserLoading && !user?.isAdmin) {
    setLocation("/dashboard");
    return null;
  }

  const { data: topups } = useAdminListTopups({ query: { enabled: !!user?.isAdmin, queryKey: getAdminListTopupsQueryKey() } });
  const approveTopup = useApproveTopup();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleApprove = (id: number) => {
    approveTopup.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getAdminListTopupsQueryKey() });
          toast({
            title: "Top-up Approved",
            description: "Credits have been added to the user's account.",
          });
        },
        onError: (error) => {
          toast({
            title: "Approval Failed",
            description: error.data?.error || "Unknown error occurred",
            variant: "destructive",
          });
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-tight text-destructive flex items-center gap-2">
          <ShieldAlert className="w-8 h-8" /> ADMIN TERMINAL
        </h1>
        <p className="text-muted-foreground font-mono text-sm">Manage platform operations and user requests</p>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="font-mono text-lg">Pending Top-up Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!topups || topups.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground font-mono text-sm">
              No pending top-up requests
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="font-mono text-xs">USER</TableHead>
                  <TableHead className="font-mono text-xs">PACKAGE</TableHead>
                  <TableHead className="font-mono text-xs">TON</TableHead>
                  <TableHead className="font-mono text-xs">TX HASH</TableHead>
                  <TableHead className="font-mono text-xs">DATE</TableHead>
                  <TableHead className="font-mono text-xs text-right">ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topups.map((req) => (
                  <TableRow key={req.id} className="border-border/50 hover:bg-card">
                    <TableCell className="font-mono">
                      <div className="font-bold">{req.username}</div>
                      <div className="text-xs text-muted-foreground">{req.email}</div>
                    </TableCell>
                    <TableCell className="font-mono font-medium">{req.credits} CRD</TableCell>
                    <TableCell className="font-mono">{req.tonAmount} TON</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-[150px] truncate">
                      {req.txHash}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground text-xs">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {req.status === 'pending' ? (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="font-mono border-primary text-primary hover:bg-primary/20"
                          onClick={() => handleApprove(req.id)}
                          disabled={approveTopup.isPending}
                        >
                          APPROVE
                        </Button>
                      ) : (
                        <Badge variant="outline" className={`font-mono ${req.status === 'approved' ? 'text-primary border-primary/20' : 'text-destructive border-destructive/20'}`}>
                          {req.status === 'approved' ? <CheckCircle className="w-3 h-3 mr-1"/> : <XCircle className="w-3 h-3 mr-1"/>}
                          {req.status.toUpperCase()}
                        </Badge>
                      )}
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
