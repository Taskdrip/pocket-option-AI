import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLogin } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const { login: setAuthContext } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { data: { email, password } },
      {
        onSuccess: (res) => {
          setAuthContext(res.token);
          toast({ title: "Welcome back", description: "Logged in successfully." });
          setLocation("/dashboard");
        },
        onError: (err: any) => {
          toast({ 
            title: "Login failed", 
            description: err.response?.data?.error || "Invalid credentials", 
            variant: "destructive" 
          });
        }
      }
    );
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md bg-card p-8 rounded-2xl border border-border/50 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Command Center</h1>
          <p className="text-muted-foreground">Enter your credentials to access the AI</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
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
            <Label htmlFor="password">Password</Label>
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
            disabled={loginMutation.isPending}
            data-testid="button-login"
          >
            {loginMutation.isPending ? "INITIALIZING..." : "INITIATE SEQUENCE"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Don't have clearance? <Link href="/register" className="text-primary hover:underline font-medium">Request Access</Link>
        </div>
      </div>
    </div>
  );
}
