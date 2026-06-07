import { useGetMe, useGetTradeStats, useListTrades } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Coins, Percent, Target, TrendingDown, TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: user } = useGetMe();
  const { data: stats } = useGetTradeStats();
  const { data: trades } = useListTrades();

  const recentTrades = trades?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-mono font-bold tracking-tight">DASHBOARD</h1>
          <p className="text-muted-foreground font-mono text-sm">Overview of your trading performance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-mono">WIN RATE</CardTitle>
            <Percent className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{stats?.winRate?.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">Overall success rate</p>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-mono">TOTAL TRADES</CardTitle>
            <Activity className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{stats?.totalTrades || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats?.wins || 0} wins, {stats?.losses || 0} losses</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-mono">AVAILABLE CREDITS</CardTitle>
            <Coins className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{user?.credits || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Used for manual & auto trades</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground font-mono">AUTO BOT</CardTitle>
            <Target className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {user?.botActive ? (
                <span className="text-primary">ACTIVE</span>
              ) : (
                <span className="text-muted-foreground">INACTIVE</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Auto-confirm: {user?.autoConfirm ? 'ON' : 'OFF'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="font-mono">RECENT ACTIVITY</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTrades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground font-mono text-sm">
              No trading activity found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="font-mono text-xs">ASSET</TableHead>
                  <TableHead className="font-mono text-xs">DIRECTION</TableHead>
                  <TableHead className="font-mono text-xs">AMOUNT</TableHead>
                  <TableHead className="font-mono text-xs">RESULT</TableHead>
                  <TableHead className="font-mono text-xs text-right">TIME</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTrades.map((trade) => (
                  <TableRow key={trade.id} className="border-border/50 hover:bg-card">
                    <TableCell className="font-mono font-medium">{trade.asset} ({trade.timeframe})</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`font-mono ${trade.direction === 'BUY' ? 'text-primary border-primary/20' : 'text-destructive border-destructive/20'}`}>
                        {trade.direction === 'BUY' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {trade.direction}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">${trade.amount}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`font-mono ${trade.result === 'win' ? 'text-primary border-primary/20' : 'text-destructive border-destructive/20'}`}>
                        {trade.result.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-right text-muted-foreground text-xs">
                      {new Date(trade.createdAt).toLocaleString()}
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
