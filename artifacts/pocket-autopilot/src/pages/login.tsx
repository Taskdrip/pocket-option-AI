import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Cpu, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <Link href="/" className="absolute top-8 left-8 flex items-center space-x-2 text-muted-foreground hover:text-foreground">
        <Cpu className="w-5 h-5" />
        <span className="font-display font-bold tracking-widest text-sm">BACK</span>
      </Link>

      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight mb-2">SYSTEM ACCESS</h1>
          <p className="text-muted-foreground">Enter your credentials to initialize the terminal.</p>
        </div>

        <div className="bg-card border border-border p-8 rounded-xl shadow-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-display tracking-widest text-xs uppercase text-muted-foreground">Email</FormLabel>
                    <FormControl>
                      <Input placeholder="trader@system.com" className="bg-background/50 h-12" {...field} />
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
                    <FormLabel className="font-display tracking-widest text-xs uppercase text-muted-foreground">Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" className="bg-background/50 h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-12 font-bold tracking-wide" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "INITIALIZE LOGIN"}
              </Button>
            </form>
          </Form>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          No access credentials? <Link href="/register" className="text-primary hover:underline font-bold">Request Access</Link>
        </div>
      </div>
    </div>
  );
}
