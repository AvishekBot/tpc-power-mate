import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtNPR, fmtDateTime } from "@/lib/format";
import {
  TrendingUp, TrendingDown, ShoppingCart, Package, Wrench, Wallet, AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function startOfDay(d = new Date()) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function startOfMonth(d = new Date()) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function startOfPrevMonth(d = new Date()) { return new Date(d.getFullYear(), d.getMonth()-1, 1); }

async function fetchDashboard() {
  const today = startOfDay().toISOString();
  const monthStart = startOfMonth().toISOString();
  const prevMonthStart = startOfPrevMonth().toISOString();
  const monthEnd = startOfMonth().toISOString(); // exclusive upper for prev

  const [todaySales, monthSales, prevMonthSales, products, lowStockList, recentSales] = await Promise.all([
    supabase.from("sales").select("total_amount").eq("status", "completed").gte("sale_date", today),
    supabase.from("sales").select("total_amount").eq("status", "completed").gte("sale_date", monthStart),
    supabase.from("sales").select("total_amount").eq("status", "completed").gte("sale_date", prevMonthStart).lt("sale_date", monthEnd),
    supabase.from("products").select("id, stock_quantity, min_stock_threshold").eq("status", "active"),
    supabase.from("products").select("id, name, brand, stock_quantity, min_stock_threshold").eq("status", "active").order("stock_quantity", { ascending: true }).limit(8),
    supabase.from("sales").select("id, invoice_number, customer_name, total_amount, payment_method, sale_date, status").order("sale_date", { ascending: false }).limit(8),
  ]);

  const sumAmt = (rows: { total_amount: number }[] | null) =>
    (rows ?? []).reduce((s, r) => s + Number(r.total_amount ?? 0), 0);

  const productRows = products.data ?? [];
  const lowStockCount = productRows.filter(p => (p.stock_quantity ?? 0) <= (p.min_stock_threshold ?? 0)).length;

  return {
    todayTotal: sumAmt(todaySales.data),
    monthTotal: sumAmt(monthSales.data),
    prevMonthTotal: sumAmt(prevMonthSales.data),
    totalProducts: productRows.length,
    totalUnits: productRows.reduce((s, p) => s + (p.stock_quantity ?? 0), 0),
    lowStockCount,
    pendingRepairs: 0, // repair_jobs table not in Phase 1 schema yet
    lowStock: (lowStockList.data ?? []).filter(p => (p.stock_quantity ?? 0) <= (p.min_stock_threshold ?? 0)),
    recentSales: recentSales.data ?? [],
  };
}

function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard, enabled: !!user });

  const monthDelta = data ? data.monthTotal - data.prevMonthTotal : 0;
  const monthPct = data && data.prevMonthTotal > 0
    ? (monthDelta / data.prevMonthTotal) * 100 : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">A live snapshot of today's shop activity.</p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<ShoppingCart className="h-5 w-5" />}
          label="Today's Sales"
          value={isLoading ? null : fmtNPR(data!.todayTotal)}
          accent="primary"
        />
        <StatCard
          icon={<Package className="h-5 w-5" />}
          label="Products in Stock"
          value={isLoading ? null : `${data!.totalProducts} SKUs`}
          sub={isLoading ? null : (
            <span className={data!.lowStockCount > 0 ? "text-destructive font-medium" : "text-muted-foreground"}>
              {data!.lowStockCount > 0 ? `${data!.lowStockCount} low-stock` : "All healthy"}
            </span>
          )}
        />
        <StatCard
          icon={<Wrench className="h-5 w-5" />}
          label="Pending Repairs"
          value={isLoading ? null : String(data!.pendingRepairs)}
          sub={<span className="text-muted-foreground">Coming in Phase 2</span>}
        />
        <StatCard
          icon={<Wallet className="h-5 w-5" />}
          label="This Month Revenue"
          value={isLoading ? null : fmtNPR(data!.monthTotal)}
          sub={isLoading ? null : (
            <span className="inline-flex items-center gap-1 text-xs">
              {monthDelta >= 0 ? <TrendingUp className="h-3 w-3 text-success" /> : <TrendingDown className="h-3 w-3 text-destructive" />}
              <span className={monthDelta >= 0 ? "text-success" : "text-destructive"}>
                {monthPct === null ? (monthDelta >= 0 ? "+" : "") + fmtNPR(monthDelta) : `${monthPct >= 0 ? "+" : ""}${monthPct.toFixed(1)}%`}
              </span>
              <span className="text-muted-foreground">vs last month</span>
            </span>
          )}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>Latest invoices across all staff</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : data!.recentSales.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No sales yet. Create your first invoice from Sales / POS.</p>
            ) : (
              <div className="divide-y divide-border">
                {data!.recentSales.map(s => (
                  <div key={s.id} className="flex items-center justify-between py-2.5 gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{s.invoice_number}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {s.customer_name || "Walk-in"} · {fmtDateTime(s.sale_date)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold">{fmtNPR(Number(s.total_amount))}</div>
                      <Badge variant={s.status === "completed" ? "secondary" : "outline"} className="text-[10px] uppercase">
                        {s.payment_method}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Low Stock Alerts
            </CardTitle>
            <CardDescription>Items at or below threshold</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : data!.lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Everything is well stocked. ✓</p>
            ) : (
              <ul className="space-y-2">
                {data!.lowStock.map(p => (
                  <li key={p.id} className="flex items-center justify-between text-sm">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{p.name}</div>
                      {p.brand && <div className="text-xs text-muted-foreground truncate">{p.brand}</div>}
                    </div>
                    <Badge variant="destructive" className="shrink-0">
                      {p.stock_quantity} / {p.min_stock_threshold}
                    </Badge>
                  </li>
                ))}
                <li className="pt-2">
                  <Link to="/admin/inventory" className="text-xs text-primary hover:underline">View inventory →</Link>
                </li>
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon, label, value, sub, accent,
}: { icon: React.ReactNode; label: string; value: string | null; sub?: React.ReactNode; accent?: "primary" }) {
  return (
    <Card className="glass-card">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
          <span className={`h-9 w-9 rounded-lg flex items-center justify-center ${accent === "primary" ? "bg-primary/15 text-primary" : "bg-accent text-accent-foreground"}`}>
            {icon}
          </span>
        </div>
        {value === null ? <Skeleton className="h-7 w-24" /> : <div className="text-2xl font-bold tracking-tight">{value}</div>}
        {sub && <div className="mt-1 text-xs">{sub}</div>}
      </CardContent>
    </Card>
  );
}
