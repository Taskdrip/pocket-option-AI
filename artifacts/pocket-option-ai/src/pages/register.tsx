import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useRegister } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const { login: setAuthContext } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const registerMutation = useRegister();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(
      { data: { username, email, password } },
      {
        onSuccess: (res) => {
          setAuthContext(res.token);
          toast({ title: "Registration complete", description: "100 FREE credits added to your account." });
          setLocation("/dashboard");
        },
        onError: (err: any) => {
          toast({ 
            title: "Registration failed", 
            description: err.response?.data?.error || "Could not create account", 
            variant: "destructive" 
          });
        }
      }
    );
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-card p-8 rounded-2xl border border-border/50 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary" />
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono mb-4 border border-primary/20">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            LIMITED OFFER
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Claim 100 Free Credits</h1>
          <p className="text-muted-foreground">Start automating your trades today.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Trader Alias</Label>
            <Input 
              id="username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
              data-testid="input-username"
              className="bg-background border-border/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              data-testid="input-email"
              className="bg-background border-border/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Secure Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              data-testid="input-password"
              className="bg-background border-border/50"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full font-mono font-bold" 
            disabled={registerMutation.isPending}
            data-testid="button-register"
          >
            {registerMutation.isPending ? "PROCESSING..." : "ACTIVATE ACCOUNT"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already active? <Link href="/login" className="text-primary hover:underline font-medium">Log In</Link>
        </div>
      </div>
    </div>
  );
}
