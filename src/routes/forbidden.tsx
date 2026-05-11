import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/forbidden")({
  component: Forbidden,
});

function Forbidden() {
  const { signOut } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md text-center glass-card p-8 rounded-2xl">
        <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h1 className="text-3xl font-bold">403 — Access Denied</h1>
        <p className="text-muted-foreground mt-2">
          Your account doesn't have permission to view that page. Ask an admin to grant you the right role.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild><Link to="/admin">Go to dashboard</Link></Button>
          <Button variant="outline" onClick={() => signOut()}>Sign out</Button>
        </div>
      </div>
    </div>
  );
}
