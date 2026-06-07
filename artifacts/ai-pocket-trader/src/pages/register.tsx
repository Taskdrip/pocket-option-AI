import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister } from "@workspace/api-client-react";
import { setAuthToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  email: z.string().email(),
  username: z.string().min(2),
  password: z.string().min(6),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    registerMutation.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          setAuthToken(data.token, data.user);
          setLocation("/dashboard");
        },
        onError: (error) => {
          toast({
            title: "Registration Failed",
            description: error.data?.error || "Unknown error occurred",
            variant: "destructive",
          });
        },
      }
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-primary/20 shadow-xl shadow-primary/5">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-mono text-center tracking-tight">NEW_OPERATOR</CardTitle>
          <CardDescription className="text-center font-mono text-xs uppercase">
            Provision new trading terminal credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs text-muted-foreground uppercase">Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="trader@network.com" className="font-mono bg-card" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs text-muted-foreground uppercase">Operator Alias</FormLabel>
                    <FormControl>
                      <Input placeholder="phantom_01" className="font-mono bg-card" {...field} />
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
                    <FormLabel className="font-mono text-xs text-muted-foreground uppercase">Passphrase</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" className="font-mono bg-card" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full font-mono uppercase tracking-widest mt-6" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? "Provisioning..." : "Generate Keys"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-border/50 pt-6">
          <div className="text-sm font-mono text-muted-foreground">
            Already provisioned? <Link href="/login" className="text-primary hover:underline">Initialize session</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
