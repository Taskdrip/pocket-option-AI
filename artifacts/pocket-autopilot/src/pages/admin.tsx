import { useAdminListUsers, useAdminListTopups, useAdminUpdateUser, useAdminAdjustCredits, useApproveTopup, useRejectTopup } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getAdminListUsersQueryKey, getAdminListTopupsQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";
import { ShieldAlert, Users, CreditCard } from "lucide-react";
import { useState } from "react";

export default function Admin() {
  const { data: users } = useAdminListUsers();
  const { data: topups } = useAdminListTopups();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateUser = useAdminUpdateUser();
  const adjustCredits = useAdminAdjustCredits();
  const approveTopup = useApproveTopup();
  const rejectTopup = useRejectTopup();

  const [editingCredits, setEditingCredits] = useState<{id: number, amount: string} | null>(null);

  const handleBanToggle = (id: number, banned: boolean) => {
    updateUser.mutate({ id, data: { banned } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() })
    });
  };

  const handleAdminToggle = (id: number, isAdmin: boolean) => {
    updateUser.mutate({ id, data: { isAdmin } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() })
    });
  };

  const handleCreditsSave = (id: number) => {
    if (!editingCredits || editingCredits.id !== id) return;
    const amount = Number(editingCredits.amount);
    if (isNaN(amount)) return;
    
    adjustCredits.mutate({ id, data: { credits: amount } }, {
      onSuccess: () => {
        setEditingCredits(null);
        queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
        toast({ title: "Credits updated successfully" });
      }
    });
  };

  const handleTopup = (id: number, action: 'approve' | 'reject') => {
    const mut = action === 'approve' ? approveTopup : rejectTopup;
    mut.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListTopupsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
        toast({ title: `Topup ${action}d` });
      }
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight text-destructive flex items-center gap-2">
          <ShieldAlert className="w-8 h-8" /> OVERSEER ROOT ACCESS
        </h1>
        <p className="text-muted-foreground text-sm">System administration and compliance matrix.</p>
      </div>

      <div className="grid gap-8">
        {/* Pending Topups */}
        <Card className="bg-card border-destructive/30">
          <CardHeader>
            <CardTitle className="font-display tracking-wider flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" /> Pending Topup Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-background/50 border-b border-border font-display tracking-wider">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Package / USD</th>
                    <th className="px-4 py-3">TX Hash</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!topups || topups.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Queue clear. No pending requests.</td></tr>
                  ) : (
                    topups.map(t => (
                      <tr key={t.id} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="px-4 py-3 font-bold">{t.username} <div className="text-xs font-normal text-muted-foreground">{t.email}</div></td>
                        <td className="px-4 py-3">{t.package} ({t.currency.toUpperCase()}) <br/><span className="text-success">${t.usdAmount}</span></td>
                        <td className="px-4 py-3 font-mono text-xs max-w-[200px] truncate" title={t.txHash}>{t.txHash}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{format(new Date(t.createdAt), "dd/MM HH:mm")}</td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <Button size="sm" variant="outline" className="text-success hover:bg-success hover:text-success-foreground" onClick={() => handleTopup(t.id, 'approve')}>Approve</Button>
                          <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => handleTopup(t.id, 'reject')}>Reject</Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* User Directory */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-display tracking-wider flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> User Matrix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-background/50 border-b border-border font-display tracking-wider">
                  <tr>
                    <th className="px-4 py-3">ID/User</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Credits</th>
                    <th className="px-4 py-3 text-center">Banned</th>
                    <th className="px-4 py-3 text-center">Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.map(u => (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="font-bold">{u.username} <span className="text-xs text-muted-foreground ml-2">#{u.id}</span></div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs space-y-1">
                          <div>Bot: <span className={u.botActive ? "text-success font-bold" : "text-muted-foreground"}>{u.botActive ? "ON" : "OFF"}</span></div>
                          <div className="text-muted-foreground">Trades: {u.totalTrades}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {editingCredits?.id === u.id ? (
                          <div className="flex items-center gap-2 max-w-[150px]">
                            <Input 
                              type="number" 
                              className="h-8 text-xs bg-background" 
                              value={editingCredits.amount}
                              onChange={(e) => setEditingCredits({id: u.id, amount: e.target.value})}
                            />
                            <Button size="sm" className="h-8 px-2" onClick={() => handleCreditsSave(u.id)}>Save</Button>
                          </div>
                        ) : (
                          <div 
                            className="font-mono cursor-pointer hover:text-primary transition-colors inline-block"
                            onClick={() => setEditingCredits({id: u.id, amount: u.credits.toString()})}
                            title="Click to edit"
                          >
                            ${u.credits.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Switch checked={u.banned} onCheckedChange={(v) => handleBanToggle(u.id, v)} className="data-[state=checked]:bg-destructive" />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Switch checked={u.isAdmin} onCheckedChange={(v) => handleAdminToggle(u.id, v)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
