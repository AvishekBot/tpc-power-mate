import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { fmtNPR, VAT_RATE } from "@/lib/format";
import { Search, Plus, Minus, Trash2, Printer, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { InvoicePrint, type InvoiceData } from "@/components/admin/invoice-print";

export const Route = createFileRoute("/admin/sales")({
  component: SalesPOS,
});

type Product = {
  id: string;
  name: string;
  brand: string | null;
  selling_price: number;
  stock_quantity: number;
  min_stock_threshold: number;
  images: string[] | null;
};

type CartLine = { product: Product; qty: number };
type PayMethod = "cash" | "digital" | "credit";

function SalesPOS() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [payMethod, setPayMethod] = useState<PayMethod>("cash");
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [digitalRef, setDigitalRef] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["pos-products", search],
    queryFn: async () => {
      let q = supabase.from("products").select("id,name,brand,selling_price,stock_quantity,min_stock_threshold,images")
        .eq("status", "active").order("name").limit(60);
      if (search.trim()) q = q.or(`name.ilike.%${search}%,brand.ilike.%${search}%,barcode.eq.${search}`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const subtotal = useMemo(() => cart.reduce((s, l) => s + l.qty * Number(l.product.selling_price), 0), [cart]);
  const discounted = Math.max(0, subtotal - (discount || 0));
  const vat = +(discounted * VAT_RATE).toFixed(2);
  const total = +(discounted + vat).toFixed(2);
  const change = payMethod === "cash" ? Math.max(0, (cashReceived || 0) - total) : 0;

  function addToCart(p: Product) {
    if (p.stock_quantity <= 0) { toast.error("Out of stock"); return; }
    setCart((c) => {
      const ex = c.find((x) => x.product.id === p.id);
      if (ex) {
        if (ex.qty + 1 > p.stock_quantity) { toast.error("Not enough stock"); return c; }
        return c.map((x) => x.product.id === p.id ? { ...x, qty: x.qty + 1 } : x);
      }
      return [...c, { product: p, qty: 1 }];
    });
  }
  function setQty(id: string, q: number) {
    setCart((c) => c.flatMap((l) => {
      if (l.product.id !== id) return [l];
      if (q <= 0) return [];
      if (q > l.product.stock_quantity) { toast.error("Not enough stock"); return [l]; }
      return [{ ...l, qty: q }];
    }));
  }
  function clearAll() {
    setCart([]); setDiscount(0); setCashReceived(0); setDigitalRef(""); setCustomerName(""); setCustomerPhone("");
  }

  async function checkout() {
    if (!user) return;
    if (cart.length === 0) { toast.error("Cart is empty"); return; }
    if (payMethod === "cash" && (cashReceived || 0) < total) { toast.error("Insufficient cash received"); return; }
    if (payMethod === "digital" && !digitalRef.trim()) { toast.error("Reference number required"); return; }
    if (payMethod === "credit" && (!customerName.trim() || !customerPhone.trim())) {
      toast.error("Customer name & phone required for credit"); return;
    }
    setSubmitting(true);
    try {
      const { data: sale, error: saleErr } = await supabase.from("sales").insert({
        staff_id: user.id,
        payment_method: payMethod,
        subtotal,
        discount_amount: discount || 0,
        vat_amount: vat,
        total_amount: total,
        cash_received: payMethod === "cash" ? cashReceived : null,
        change_given: payMethod === "cash" ? change : null,
        digital_reference: payMethod === "digital" ? digitalRef : null,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
      }).select().single();
      if (saleErr) throw saleErr;

      const items = cart.map((l) => ({
        sale_id: sale.id,
        product_id: l.product.id,
        product_name_snapshot: l.product.name,
        quantity: l.qty,
        unit_price: Number(l.product.selling_price),
        line_total: +(l.qty * Number(l.product.selling_price)).toFixed(2),
      }));
      const { error: itemsErr } = await supabase.from("sale_items").insert(items);
      if (itemsErr) throw itemsErr;

      const { data: prof } = await supabase
        .from("profiles").select("full_name").eq("user_id", user.id).maybeSingle();

      setInvoice({
        cashier_name: prof?.full_name || user.email || null,
        invoice_number: sale.invoice_number,
        sale_date: sale.sale_date,
        customer_name: sale.customer_name,
        customer_phone: sale.customer_phone,
        payment_method: sale.payment_method,
        cash_received: sale.cash_received,
        change_given: sale.change_given,
        digital_reference: sale.digital_reference,
        subtotal: Number(sale.subtotal),
        discount_amount: Number(sale.discount_amount),
        vat_amount: Number(sale.vat_amount),
        total_amount: Number(sale.total_amount),
        items,
      });
      toast.success(`Sale ${sale.invoice_number} completed`);
      clearAll();
      qc.invalidateQueries({ queryKey: ["pos-products"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (e: any) {
      toast.error(e.message ?? "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="grid lg:grid-cols-[1fr_420px] gap-4 h-[calc(100vh-7rem)]">
      {/* LEFT: products */}
      <div className="flex flex-col min-h-0">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name, brand, or scan barcode…"
            value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
        </div>
        <div className="flex-1 overflow-auto pr-1">
          {isLoading ? (
            <div className="text-sm text-muted-foreground p-8 text-center">Loading…</div>
          ) : products.length === 0 ? (
            <div className="text-sm text-muted-foreground p-8 text-center">No products found</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {products.map((p) => {
                const low = p.stock_quantity <= p.min_stock_threshold;
                const out = p.stock_quantity <= 0;
                return (
                  <button key={p.id} onClick={() => addToCart(p)} disabled={out}
                    className="text-left rounded-lg border border-border bg-card hover:border-primary/60 hover:shadow-[0_0_0_1px_hsl(var(--primary)/0.4)] transition disabled:opacity-50 disabled:cursor-not-allowed p-3">
                    <div className="aspect-square rounded-md bg-muted/40 mb-2 flex items-center justify-center overflow-hidden">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingCart className="h-8 w-8 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">{p.name}</div>
                    {p.brand && <div className="text-[11px] text-muted-foreground">{p.brand}</div>}
                    <div className="flex items-center justify-between mt-1">
                      <div className="text-sm font-bold text-primary">{fmtNPR(p.selling_price)}</div>
                      <Badge variant={out ? "destructive" : low ? "secondary" : "outline"} className="text-[10px]">
                        {out ? "Out" : `Stock ${p.stock_quantity}`}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: cart */}
      <Card className="flex flex-col min-h-0">
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" /> Cart ({cart.length})
        </CardTitle></CardHeader>
        <CardContent className="flex-1 flex flex-col gap-3 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-auto -mx-2 px-2 space-y-2">
            {cart.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">Click a product to add</div>
            ) : cart.map((l) => (
              <div key={l.product.id} className="flex items-center gap-2 border border-border rounded-md p-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{l.product.name}</div>
                  <div className="text-xs text-muted-foreground">{fmtNPR(l.product.selling_price)} × {l.qty}</div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(l.product.id, l.qty - 1)}><Minus className="h-3 w-3" /></Button>
                  <Input className="w-12 h-7 text-center px-1" type="number" value={l.qty}
                    onChange={(e) => setQty(l.product.id, parseInt(e.target.value || "0"))} />
                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(l.product.id, l.qty + 1)}><Plus className="h-3 w-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setQty(l.product.id, 0)}><Trash2 className="h-3 w-3" /></Button>
                </div>
                <div className="w-20 text-right text-sm font-semibold">{fmtNPR(l.qty * Number(l.product.selling_price))}</div>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{fmtNPR(subtotal)}</span></div>
            <div className="flex justify-between items-center gap-2">
              <span>Discount</span>
              <Input type="number" min={0} className="h-7 w-28 text-right" value={discount}
                onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value || "0")))} />
            </div>
            <div className="flex justify-between"><span>VAT (13%)</span><span>{fmtNPR(vat)}</span></div>
            <div className="flex justify-between text-base font-bold text-primary border-t border-border pt-2">
              <span>Total</span><span>{fmtNPR(total)}</span>
            </div>
          </div>

          <Tabs value={payMethod} onValueChange={(v) => setPayMethod(v as PayMethod)}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="cash">Cash</TabsTrigger>
              <TabsTrigger value="digital">Digital</TabsTrigger>
              <TabsTrigger value="credit">Credit</TabsTrigger>
            </TabsList>
            <TabsContent value="cash" className="space-y-2 mt-2">
              <Label className="text-xs">Cash Received</Label>
              <Input type="number" min={0} value={cashReceived} onChange={(e) => setCashReceived(parseFloat(e.target.value || "0"))} />
              <div className="text-xs flex justify-between"><span>Change</span><span className="font-bold text-secondary">{fmtNPR(change)}</span></div>
            </TabsContent>
            <TabsContent value="digital" className="space-y-2 mt-2">
              <Label className="text-xs">Reference / Txn ID *</Label>
              <Input value={digitalRef} onChange={(e) => setDigitalRef(e.target.value)} placeholder="eSewa / Khalti / Bank ref" />
            </TabsContent>
            <TabsContent value="credit" className="space-y-2 mt-2">
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name *" />
              <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Customer phone *" />
            </TabsContent>
          </Tabs>

          <Button className="w-full" size="lg" onClick={checkout} disabled={submitting || cart.length === 0}>
            {submitting ? "Processing…" : `Charge ${fmtNPR(total)}`}
          </Button>
        </CardContent>
      </Card>

      {/* Invoice dialog */}
      <Dialog open={!!invoice} onOpenChange={(o) => !o && setInvoice(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>Invoice {invoice?.invoice_number}</DialogTitle></DialogHeader>
          <div ref={printRef} className="printable">
            {invoice && <InvoicePrint inv={invoice} />}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoice(null)}>Close</Button>
            <Button onClick={handlePrint}><Printer className="h-4 w-4 mr-1" /> Print</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
