import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { setAuthToken, clearAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, AlertOctagon, Terminal } from "lucide-react";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState("");
  const login = useLogin();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "admin@aipockettrader.com", password: "Admin@2024!" },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setError("");
    login.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          if (data.user.isAdmin) {
            setAuthToken(data.token, data.user);
            setLocation("/admin");
          } else {
            clearAuth();
            setError("Access denied. Not an admin account.");
          }
        },
        onError: (err) => {
          setError(err.data?.error || "Login failed. Check your credentials.");
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(220,38,38,0.08)_0%,_transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <ShieldAlert className="w-12 h-12 text-destructive mx-auto animate-pulse" />
          <h1 className="text-3xl font-mono font-bold tracking-tighter text-destructive">RESTRICTED ACCESS</h1>
          <p className="text-muted-foreground font-mono text-sm tracking-widest uppercase">Admin Control Protocol v2</p>
        </div>

        <Card className="border-destructive/50 bg-card/50 backdrop-blur shadow-[0_0_30px_rgba(220,38,38,0.12)]">
          <CardHeader className="pb-4">
            <CardTitle className="font-mono text-lg flex items-center gap-2">
              <Terminal className="w-4 h-4 text-destructive" />
              <span>SYSTEM_LOGIN</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs uppercase text-muted-foreground">Operator Email</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-admin-email"
                          placeholder="admin@system.local"
                          className="font-mono bg-background/50 border-destructive/30 focus-visible:ring-destructive/50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-xs uppercase text-muted-foreground">Access Code</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-admin-password"
                          type="password"
                          placeholder="••••••••"
                          className="font-mono bg-background/50 border-destructive/30 focus-visible:ring-destructive/50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/50 rounded flex items-center gap-2 text-destructive text-sm font-mono">
                    <AlertOctagon className="w-4 h-4 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                <Button
                  data-testid="button-admin-login"
                  type="submit"
                  className="w-full font-mono uppercase tracking-wider bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={login.isPending}
                >
                  {login.isPending ? "AUTHORIZING..." : "INITIATE SESSION"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="border-amber-500/30 bg-amber-500/5 backdrop-blur">
          <CardContent className="p-4 space-y-3">
            <div className="text-xs font-mono text-amber-400/80 uppercase tracking-widest mb-2 flex items-center gap-2">
              <ShieldAlert className="w-3 h-3" /> Default Admin Credentials
            </div>
            <div className="font-mono text-sm flex justify-between items-center">
              <span className="text-muted-foreground">Email:</span>
              <code className="text-amber-300 text-xs bg-amber-500/10 px-2 py-1 rounded">admin@aipockettrader.com</code>
            </div>
            <div className="font-mono text-sm flex justify-between items-center">
              <span className="text-muted-foreground">Password:</span>
              <code className="text-amber-300 text-xs bg-amber-500/10 px-2 py-1 rounded">Admin@2024!</code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
