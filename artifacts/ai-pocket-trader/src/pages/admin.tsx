import { useState } from "react";
import { 
  useGetMe, 
  useAdminListTopups, 
  useApproveTopup, 
  useRejectTopup,
  getAdminListTopupsQueryKey,
  useAdminListUsers,
  useAdminUpdateUser,
  useAdminAdjustCredits,
  getAdminListUsersQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Clock, XCircle, ShieldAlert, Users, CreditCard, Ban, Edit3 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminPanel() {
  const { data: user, isLoading: isUserLoading } = useGetMe();
  const [, setLocation] = useLocation();

  if (!isUserLoading && !user?.isAdmin) {
    setLocation("/dashboard");
    return null;
  }

  const { data: topups } = useAdminListTopups({ query: { enabled: !!user?.isAdmin, queryKey: getAdminListTopupsQueryKey() } });
  const { data: users } = useAdminListUsers({ query: { enabled: !!user?.isAdmin, queryKey: getAdminListUsersQueryKey() } });
  
  const approveTopup = useApproveTopup();
  const rejectTopup = useRejectTopup();
  const updateUser = useAdminUpdateUser();
  const adjustCredits = useAdminAdjustCredits();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleApprove = (id: number) => {
    approveTopup.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getAdminListTopupsQueryKey() });
          toast({ title: "Top-up Approved", description: "Credits have been added to the user's account." });
        },
        onError: (error) => {
          toast({ title: "Approval Failed", description: error.data?.error || "Unknown error occurred", variant: "destructive" });
        }
      }
    );
  };

  const handleReject = (id: number) => {
    rejectTopup.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getAdminListTopupsQueryKey() });
          toast({ title: "Top-up Rejected", description: "The request has been rejected." });
        },
        onError: (error) => {
          toast({ title: "Rejection Failed", description: error.data?.error || "Unknown error occurred", variant: "destructive" });
        }
      }
    );
  };

  const handleBanToggle = (userId: number, currentBanned: boolean) => {
    updateUser.mutate(
      { id: userId, data: { banned: !currentBanned } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
          toast({ title: `User ${!currentBanned ? "Banned" : "Unbanned"}`, description: "Status updated successfully." });
        },
        onError: (error) => {
          toast({ title: "Update Failed", description: error.data?.error || "Unknown error occurred", variant: "destructive" });
        }
      }
    );
  };

  const [creditsInput, setCreditsInput] = useState<{ [key: number]: string }>({});

  const handleSetCredits = (userId: number) => {
    const val = Number(creditsInput[userId]);
    if (isNaN(val)) return;
    adjustCredits.mutate(
      { id: userId, data: { credits: val } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
          toast({ title: "Credits Updated", description: "User balance has been adjusted." });
        },
        onError: (error) => {
          toast({ title: "Update Failed", description: error.data?.error || "Unknown error occurred", variant: "destructive" });
        }
      }
    );
  };

  const totalUsers = users?.length || 0;
  const totalCredits = users?.reduce((acc, u) => acc + (u.credits || 0), 0) || 0;
  const bannedUsers = users?.filter(u => u.banned).length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-tight text-destructive flex items-center gap-2">
          <ShieldAlert className="w-8 h-8" /> ADMIN TERMINAL
        </h1>
        <p className="text-muted-foreground font-mono text-sm">Manage platform operations and user requests</p>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-card/50 border border-border/50">
          <TabsTrigger value="users" className="font-mono data-[state=active]:text-destructive data-[state=active]:bg-destructive/10"><Users className="w-4 h-4 mr-2"/> USERS</TabsTrigger>
          <TabsTrigger value="payments" className="font-mono data-[state=active]:text-destructive data-[state=active]:bg-destructive/10"><CreditCard className="w-4 h-4 mr-2"/> PAYMENTS</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono text-muted-foreground">TOTAL USERS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-mono font-bold">{totalUsers}</div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono text-muted-foreground">TOTAL CREDITS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-mono font-bold text-primary">{totalCredits}</div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono text-muted-foreground">BANNED USERS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-mono font-bold text-destructive">{bannedUsers}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="font-mono text-xs">ID</TableHead>
                    <TableHead className="font-mono text-xs">USERNAME</TableHead>
                    <TableHead className="font-mono text-xs">EMAIL</TableHead>
                    <TableHead className="font-mono text-xs">CREDITS</TableHead>
                    <TableHead className="font-mono text-xs">TRADES</TableHead>
                    <TableHead className="font-mono text-xs">STATUS</TableHead>
                    <TableHead className="font-mono text-xs">ROLE</TableHead>
                    <TableHead className="font-mono text-xs">JOINED</TableHead>
                    <TableHead className="font-mono text-xs text-right">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map(u => (
                    <TableRow key={u.id} className="border-border/50 hover:bg-card">
                      <TableCell className="font-mono text-xs text-muted-foreground">#{u.id}</TableCell>
                      <TableCell className="font-mono font-medium">{u.username}</TableCell>
                      <TableCell className="font-mono text-xs">{u.email}</TableCell>
                      <TableCell className="font-mono font-bold text-primary">{u.credits}</TableCell>
                      <TableCell className="font-mono">{u.totalTrades}</TableCell>
                      <TableCell>
                        {u.banned ? (
                          <Badge variant="outline" className="font-mono text-destructive border-destructive/20 text-[10px]">BANNED</Badge>
                        ) : (
                          <Badge variant="outline" className="font-mono text-primary border-primary/20 text-[10px]">ACTIVE</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {u.isAdmin ? (
                          <Badge variant="outline" className="font-mono text-amber-500 border-amber-500/20 text-[10px]">ADMIN</Badge>
                        ) : (
                          <Badge variant="outline" className="font-mono text-muted-foreground border-border text-[10px]">USER</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="font-mono h-7 text-xs px-2">
                              <Edit3 className="w-3 h-3 mr-1" /> CREDITS
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-sm border-border bg-card">
                            <DialogHeader>
                              <DialogTitle className="font-mono">Set User Credits</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                              <Label className="font-mono text-xs text-muted-foreground uppercase">New Balance</Label>
                              <Input 
                                type="number" 
                                className="font-mono mt-2" 
                                placeholder={u.credits.toString()}
                                value={creditsInput[u.id] || ""}
                                onChange={(e) => setCreditsInput({...creditsInput, [u.id]: e.target.value})}
                              />
                            </div>
                            <DialogFooter>
                              <Button 
                                className="font-mono" 
                                onClick={() => handleSetCredits(u.id)}
                                disabled={adjustCredits.isPending}
                              >
                                {adjustCredits.isPending ? "SAVING..." : "SET CREDITS"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          size="sm" 
                          variant={u.banned ? "default" : "destructive"} 
                          className="font-mono h-7 text-xs px-2"
                          onClick={() => handleBanToggle(u.id, u.banned)}
                          disabled={updateUser.isPending}
                        >
                          <Ban className="w-3 h-3 mr-1" /> {u.banned ? "UNBAN" : "BAN"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!users || users.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground font-mono">No users found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="font-mono text-xs">USER</TableHead>
                    <TableHead className="font-mono text-xs">PACKAGE</TableHead>
                    <TableHead className="font-mono text-xs">AMOUNT</TableHead>
                    <TableHead className="font-mono text-xs">TX HASH</TableHead>
                    <TableHead className="font-mono text-xs">DATE</TableHead>
                    <TableHead className="font-mono text-xs text-right">ACTION</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topups?.map((req) => (
                    <TableRow key={req.id} className="border-border/50 hover:bg-card">
                      <TableCell className="font-mono">
                        <div className="font-bold">{req.username}</div>
                        <div className="text-xs text-muted-foreground">{req.email}</div>
                      </TableCell>
                      <TableCell className="font-mono font-medium">{req.credits} CRD</TableCell>
                      <TableCell className="font-mono">
                        {req.currency === 'usdt' ? `$${req.usdAmount || 0} USDT` : `${req.tonAmount} TON`}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground max-w-[150px] truncate">
                        {req.txHash}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground text-xs">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {req.status === 'pending' ? (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="font-mono border-primary text-primary hover:bg-primary/20 h-7 px-2 text-xs"
                              onClick={() => handleApprove(req.id)}
                              disabled={approveTopup.isPending || rejectTopup.isPending}
                            >
                              APPROVE
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="font-mono border-destructive text-destructive hover:bg-destructive/20 h-7 px-2 text-xs"
                              onClick={() => handleReject(req.id)}
                              disabled={approveTopup.isPending || rejectTopup.isPending}
                            >
                              REJECT
                            </Button>
                          </>
                        ) : (
                          <Badge variant="outline" className={`font-mono text-[10px] ${req.status === 'approved' ? 'text-primary border-primary/20' : 'text-destructive border-destructive/20'}`}>
                            {req.status === 'approved' ? <CheckCircle className="w-3 h-3 mr-1"/> : <XCircle className="w-3 h-3 mr-1"/>}
                            {req.status.toUpperCase()}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!topups || topups.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground font-mono">No payment requests found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
