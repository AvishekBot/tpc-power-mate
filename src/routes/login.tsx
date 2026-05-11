import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/admin" });
  }, [loading, user, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = mode === "signin"
      ? await signIn(email, password)
      : await signUp(email, password, fullName);
    setSubmitting(false);
    if (res.error) toast.error(res.error);
    else if (mode === "signup") toast.success("Account created. Signing in…");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(ellipse_at_top,_color-mix(in_oklab,_var(--primary)_18%,_transparent),_transparent_60%)]">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="h-14 w-14 rounded-2xl glass-card flex items-center justify-center mb-3">
            <Zap className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gradient-cyan">T.P.C Power Solutions</h1>
          <p className="text-xs text-muted-foreground mt-1">Bharatpur-2, Kshetrapur, Chitwan</p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>{mode === "signin" ? "Sign in" : "Create account"}</CardTitle>
            <CardDescription>
              {mode === "signin" ? "Access the admin dashboard" : "First registered user becomes admin"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "signin" ? "Sign in" : "Create account"}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              {mode === "signin" ? (
                <>No account? <button className="text-primary hover:underline" onClick={() => setMode("signup")}>Sign up</button></>
              ) : (
                <>Have an account? <button className="text-primary hover:underline" onClick={() => setMode("signin")}>Sign in</button></>
              )}
            </div>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground mt-4">
          <Link to="/" className="hover:text-primary">← Back home</Link>
        </p>
      </div>
    </div>
  );
}
