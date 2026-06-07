import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Cpu, Loader2, ArrowLeft, User, Mail, Lock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const PERKS = [
  "100 free trading credits on signup",
  "Live & demo account control",
  "AI signal dashboard access",
  "Full trade history & analytics",
];

export default function Register() {
  const [, setLocation] = useLocation();
  const { login: setAuth } = useAuth();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: "", email: "", password: "" },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    registerMutation.mutate({ data: values }, {
      onSuccess: (res) => {
        setAuth(res.token, res.user);
        setLocation("/dashboard");
      },
      onError: (err: any) => {
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: err?.response?.data?.error || "Something went wrong",
        });
      }
    });
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/3 w-[600px] h-[400px] bg-indigo-600/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-blue-600/6 rounded-full blur-[100px]" />
        <div style={{
          backgroundImage: `linear-gradient(rgba(59,130,246,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.02) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          position: 'absolute', inset: 0,
        }} />
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <Link href="/" className="absolute top-6 left-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="w-full max-w-sm space-y-8">
          <div className="flex items-center gap-2 justify-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center glow-blue">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl">Pocket<span className="text-gradient">Autopilot</span></span>
          </div>

          <div className="text-center">
            <h1 className="font-display text-3xl font-bold mb-2">Create account</h1>
            <p className="text-sm text-muted-foreground">Start automating your Pocket Option trades</p>
          </div>

          <div className="glass rounded-2xl p-7 border border-white/6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Username</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="traderx"
                            className="pl-10 h-11 bg-white/5 border-white/10 focus:border-blue-500/50"
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
                            placeholder="Min. 6 characters"
                            className="pl-10 h-11 bg-white/5 border-white/10 focus:border-blue-500/50"
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
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create free account"}
                </Button>
              </form>
            </Form>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              Log in
            </Link>
          </p>
        </div>
      </div>

      {/* Right perks panel */}
      <div className="hidden lg:flex lg:w-5/12 relative flex-col justify-center p-12 border-l border-white/5">
        <div className="space-y-8">
          <div>
            <h2 className="font-display text-3xl font-bold leading-tight mb-3">
              Get started with<br /><span className="text-gradient">100 free credits</span>
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              No credit card required. Connect your Pocket Option account in minutes and let the AI trade for you.
            </p>
          </div>
          <div className="space-y-3">
            {PERKS.map((perk) => (
              <div key={perk} className="flex items-center gap-3 text-sm">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-muted-foreground">{perk}</span>
              </div>
            ))}
          </div>
          <div className="p-5 glass rounded-xl border border-green-500/15">
            <div className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-2">Last 24 hours</div>
            <div className="font-display text-3xl font-bold text-green-400 mb-1">$482,130</div>
            <div className="text-xs text-muted-foreground">Total profits generated across all users</div>
          </div>
        </div>
      </div>
    </div>
  );
}
