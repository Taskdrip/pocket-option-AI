import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Cpu, Loader2, ArrowLeft, Lock, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { login: setAuth } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    loginMutation.mutate({ data: values }, {
      onSuccess: (res) => {
        setAuth(res.token, res.user);
        setLocation("/dashboard");
      },
      onError: (err: any) => {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: err?.response?.data?.error || "Invalid credentials",
        });
      }
    });
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-blue-600/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-600/6 rounded-full blur-[100px]" />
        <div style={{
          backgroundImage: `linear-gradient(rgba(59,130,246,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.02) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          position: 'absolute', inset: 0,
        }} />
      </div>

      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 border-r border-white/5">
        <Link href="/" className="flex items-center gap-2.5 w-fit">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center glow-blue">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl">Pocket<span className="text-gradient">Autopilot</span></span>
        </Link>

        <div className="space-y-8">
          <div>
            <h2 className="font-display text-4xl font-bold leading-tight mb-4">
              Welcome back,<br /><span className="text-gradient">Trader.</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed max-w-sm">
              Your AI trading engine is standing by. Log in to review signals, check account balances, and manage your autopilot strategy.
            </p>
          </div>

          {/* Live stats */}
          <div className="space-y-3">
            {[
              { label: "Win Rate (24h)", value: "82.4%", color: "text-green-400" },
              { label: "Trades Today", value: "1,243", color: "text-blue-400" },
              { label: "Active Bots", value: "14,820", color: "text-purple-400" },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between px-4 py-3 glass rounded-xl border border-white/5">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <span className={`font-display font-bold ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          © 2025 PocketAutopilot · Trading involves risk
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <Link href="/" className="absolute top-6 left-6 lg:hidden flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex items-center gap-2 justify-center mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="text-center">
            <h1 className="font-display text-3xl font-bold mb-2">Log in</h1>
            <p className="text-sm text-muted-foreground">Access your trading dashboard</p>
          </div>

          <div className="glass rounded-2xl p-7 border border-white/6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="you@example.com"
                            className="pl-10 h-11 bg-white/5 border-white/10 focus:border-blue-500/50"
                            data-testid="input-email"
                            {...field}
                          />
                        </div>
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
                      <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="password"
                            placeholder="••••••••"
                            className="pl-10 h-11 bg-white/5 border-white/10 focus:border-blue-500/50"
                            data-testid="input-password"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full h-11 font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-0 glow-blue mt-2"
                  disabled={loginMutation.isPending}
                  data-testid="button-submit"
                >
                  {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Log in"}
                </Button>
              </form>
            </Form>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link href="/register" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
