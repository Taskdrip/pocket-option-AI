import { useGetMe } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Calendar, Shield, Cpu } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Settings() {
  const { data: user } = useGetMe();

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
      </div>
    </div>
  );
}
