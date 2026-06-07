import { useState } from "react";
import { useGetMe, useUpdatePocketOption, getGetMeQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Calendar, Shield, Cpu, Link as LinkIcon, Unlink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { data: user } = useGetMe();
  const updatePocket = useUpdatePocketOption();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [pocketId, setPocketId] = useState("");

  const handleConnectPocket = () => {
    if (!pocketId.trim()) return;
    updatePocket.mutate(
      { data: { pocketOptionId: pocketId } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          toast({ title: "Connected", description: "Pocket Option account linked successfully." });
          setPocketId("");
        },
        onError: (err) => {
          toast({ title: "Error", description: err.data?.error || "Failed to connect", variant: "destructive" });
        }
      }
    );
  };

  const handleDisconnectPocket = () => {
    updatePocket.mutate(
      { data: { pocketOptionId: "" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          toast({ title: "Disconnected", description: "Pocket Option account removed." });
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-tight">SETTINGS</h1>
        <p className="text-muted-foreground font-mono text-sm">Account profile and preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="font-mono text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Operator Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground font-mono uppercase">Username</div>
              <div className="font-mono font-medium text-lg">{user?.username}</div>
            </div>
            
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground font-mono uppercase flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email Address
              </div>
              <div className="font-mono">{user?.email}</div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-muted-foreground font-mono uppercase flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Registration Date
              </div>
              <div className="font-mono text-sm">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </div>
            </div>

            {user?.isAdmin && (
              <div className="pt-2">
                <Badge variant="outline" className="font-mono border-destructive text-destructive bg-destructive/10">
                  <Shield className="w-3 h-3 mr-1" /> ADMIN PRIVILEGES ACTIVE
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="font-mono text-lg flex items-center gap-2">
                <Cpu className="w-5 h-5 text-primary" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border border-border bg-background rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-mono text-sm font-bold">API Connection</div>
                  <div className="font-mono text-xs text-muted-foreground">Main network link</div>
                </div>
                <Badge variant="outline" className="font-mono border-primary text-primary bg-primary/10">
                  ONLINE
                </Badge>
              </div>
              
              <div className="p-4 border border-border bg-background rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-mono text-sm font-bold">Auto-Trading Bot</div>
                  <div className="font-mono text-xs text-muted-foreground">Execution engine</div>
                </div>
                <Badge variant="outline" className={`font-mono ${user?.botActive ? 'border-primary text-primary bg-primary/10' : 'border-muted text-muted-foreground bg-muted/10'}`}>
                  {user?.botActive ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="font-mono text-lg flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-primary" />
                Pocket Option Integration
              </CardTitle>
              <CardDescription className="font-mono text-xs">
                Connect your Pocket Option account to enable signal mirroring
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {user?.pocketOptionId ? (
                <div className="space-y-4">
                  <div className="p-4 border border-primary/50 bg-primary/5 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-mono text-sm font-bold flex items-center gap-2">
                        POCKET OPTION
                        <Badge variant="outline" className="font-mono border-primary text-primary text-[10px] h-5">CONNECTED</Badge>
                      </div>
                      <div className="font-mono text-xs text-muted-foreground mt-1">ID: {user.pocketOptionId}</div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full font-mono text-destructive border-destructive/50 hover:bg-destructive/10" 
                    onClick={handleDisconnectPocket}
                    disabled={updatePocket.isPending}
                  >
                    <Unlink className="w-4 h-4 mr-2" /> DISCONNECT ACCOUNT
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="font-mono text-xs text-muted-foreground uppercase">Pocket Option Account ID</label>
                    <Input 
                      className="font-mono bg-background" 
                      placeholder="e.g. 12345678" 
                      value={pocketId}
                      onChange={(e) => setPocketId(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full font-mono" 
                    onClick={handleConnectPocket}
                    disabled={updatePocket.isPending || !pocketId.trim()}
                  >
                    <LinkIcon className="w-4 h-4 mr-2" /> CONNECT ACCOUNT
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
