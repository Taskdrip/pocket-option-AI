import { useAuth } from "@/lib/auth";
import { useAdminListUsers, useAdminListTopups, useApproveTopup, useRejectTopup, useAdminAdjustCredits, useAdminUpdateUser } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

export default function Admin() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (!user?.isAdmin) {
    setLocation("/");
    return null;
  }

  const { data: users, isLoading: usersLoading } = useAdminListUsers();
  const { data: topups, isLoading: topupsLoading } = useAdminListTopups();
  
  const approveTopup = useApproveTopup();
  const rejectTopup = useRejectTopup();

  const handleApprove = (id: number) => {
    approveTopup.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Approved", description: "Topup approved and credits added." });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/topups"] });
      }
    });
  };

  const handleReject = (id: number) => {
    rejectTopup.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Rejected", description: "Topup request rejected." });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/topups"] });
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-destructive">Admin Console</h1>
        <p className="text-muted-foreground">God-mode access. Proceed with caution.</p>
      </div>

      <Tabs defaultValue="topups" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="topups">Pending Topups</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="topups" className="mt-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Topup Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>TX Hash</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topupsLoading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
                    ) : topups && topups.length > 0 ? (
                      topups.map(t => (
                        <TableRow key={t.id}>
                          <TableCell>
                            <div className="font-medium">{t.username}</div>
                            <div className="text-xs text-muted-foreground">{t.email}</div>
                          </TableCell>
                          <TableCell className="font-mono">{t.credits} CR</TableCell>
                          <TableCell className="font-mono">${t.usdAmount}</TableCell>
                          <TableCell className="font-mono text-xs max-w-[150px] truncate" title={t.txHash}>{t.txHash}</TableCell>
                          <TableCell>
                            <Badge variant={t.status === 'pending' ? 'default' : t.status === 'approved' ? 'outline' : 'destructive'} 
                                   className={t.status === 'approved' ? 'text-primary border-primary/20 bg-primary/10' : ''}>
                              {t.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {t.status === 'pending' && (
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" className="h-8 border-primary text-primary" onClick={() => handleApprove(t.id)} disabled={approveTopup.isPending}>
                                  Approve
                                </Button>
                                <Button size="sm" variant="outline" className="h-8 border-destructive text-destructive" onClick={() => handleReject(t.id)} disabled={rejectTopup.isPending}>
                                  Reject
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={6} className="text-center py-8">No requests found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users" className="mt-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>All Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Trades</TableHead>
                      <TableHead>Bot</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersLoading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
                    ) : users && users.length > 0 ? (
                      users.map(u => (
                        <TableRow key={u.id}>
                          <TableCell className="font-mono text-muted-foreground">#{u.id}</TableCell>
                          <TableCell>
                            <div className="font-medium">{u.username}</div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </TableCell>
                          <TableCell className="font-mono">{u.credits}</TableCell>
                          <TableCell className="font-mono">{u.totalTrades}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={u.botActive ? "border-primary text-primary" : "text-muted-foreground"}>
                              {u.botActive ? "ON" : "OFF"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {u.banned ? (
                              <Badge variant="destructive">BANNED</Badge>
                            ) : u.isAdmin ? (
                              <Badge variant="default" className="bg-destructive text-destructive-foreground">ADMIN</Badge>
                            ) : (
                              <Badge variant="outline" className="border-primary/20 text-primary">ACTIVE</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={6} className="text-center py-8">No users found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
