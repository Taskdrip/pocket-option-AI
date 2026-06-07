import { useListTrades, useGetTradeStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp } from "lucide-react";

export default function History() {
  const { data: trades } = useListTrades();
  const { data: stats } = useGetTradeStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-tight">TRADE HISTORY</h1>
        <p className="text-muted-foreground font-mono text-sm">Detailed ledger of all executions</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground font-mono">TOTAL TRADES</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{stats?.totalTrades || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground font-mono">WIN RATE</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{stats?.winRate?.toFixed(1) || 0}%</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground font-mono">WINS / LOSSES</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-primary inline">{stats?.wins || 0}</div>
            <span className="text-muted-foreground mx-1">/</span>
            <div className="text-2xl font-bold font-mono text-destructive inline">{stats?.losses || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground font-mono">CREDITS SPENT</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{stats?.creditsSpent || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardContent className="p-0">
          {!trades || trades.length === 0 ? (
             <div className="text-center py-12 text-muted-foreground font-mono text-sm">
             No trading history available
           </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="font-mono text-xs w-[100px]">ID</TableHead>
                  <TableHead className="font-mono text-xs">ASSET</TableHead>
                  <TableHead className="font-mono text-xs">TIMEFRAME</TableHead>
                  <TableHead className="font-mono text-xs">DIRECTION</TableHead>
                  <TableHead className="font-mono text-xs">AMOUNT</TableHead>
                  <TableHead className="font-mono text-xs">RESULT</TableHead>
                  <TableHead className="font-mono text-xs text-right">DATE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.map((trade) => (
                  <TableRow key={trade.id} className="border-border/50 hover:bg-card">
                    <TableCell className="font-mono text-xs text-muted-foreground">#{trade.id}</TableCell>
                    <TableCell className="font-mono font-medium">{trade.asset}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">{trade.timeframe}</TableCell>
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
