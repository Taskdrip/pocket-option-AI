import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useUpdatePocketOption, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pocketId, setPocketId] = useState("");
  
  const updatePocketOption = useUpdatePocketOption();
  const { data: currentUser } = useGetMe();
  const activeUser = currentUser || user;

  useEffect(() => {
    if (activeUser?.pocketOptionId) {
      setPocketId(activeUser.pocketOptionId);
    }
  }, [activeUser]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePocketOption.mutate(
      { data: { pocketOptionId: pocketId } },
      {
        onSuccess: (updatedUser) => {
          queryClient.setQueryData(getGetMeQueryKey(), updatedUser);
          toast({ title: "Settings Saved", description: "Pocket Option ID has been updated." });
        },
        onError: (err: any) => {
          toast({ title: "Update Failed", description: err.response?.data?.error || "Error saving settings", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and integrations.</p>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Broker Integration</CardTitle>
          <CardDescription>Connect your Pocket Option account to enable live trading execution.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="pocketId">Pocket Option UID</Label>
              <Input 
                id="pocketId" 
                value={pocketId} 
                onChange={(e) => setPocketId(e.target.value)} 
                placeholder="e.g. 12345678"
                className="font-mono bg-background"
                data-testid="input-pocket-id"
              />
              <p className="text-xs text-muted-foreground">You can find this in your Pocket Option profile settings.</p>
            </div>
            
            <Button 
              type="submit" 
              className="font-bold font-mono" 
              disabled={updatePocketOption.isPending}
              data-testid="button-save-settings"
            >
              {updatePocketOption.isPending ? "SAVING..." : "SAVE INTEGRATION"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm opacity-50">
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground font-mono mb-1">EMAIL</p>
              <p className="font-medium">{activeUser?.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-mono mb-1">USERNAME</p>
              <p className="font-medium">{activeUser?.username}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-mono mb-1">MEMBER SINCE</p>
              <p className="font-medium">{activeUser?.createdAt ? new Date(activeUser.createdAt).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-mono mb-1">STATUS</p>
              <p className="font-medium text-primary">ACTIVE</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
