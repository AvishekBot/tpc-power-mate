import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtNPR, fmtDateTime } from "@/lib/format";
import { Search, Plus, Edit, Upload, AlertTriangle, History, Package } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/inventory")({
  component: Inventory,
});

type Product = {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  category_id: string | null;
  buying_price: number;
  selling_price: number;
  stock_quantity: number;
  min_stock_threshold: number;
  warranty_months: number | null;
  barcode: string | null;
  description: string | null;
  status: string;
  images: string[] | null;
};

type Category = { id: string; name: string };

const empty: Partial<Product> = {
  name: "", brand: "", model: "", category_id: null, buying_price: 0, selling_price: 0,
  stock_quantity: 0, min_stock_threshold: 5, warranty_months: 0, barcode: "", description: "", images: [],
};

function Inventory() {
  const [tab, setTab] = useState("products");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const qc = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["inv-products", search],
    queryFn: async () => {
      let q = supabase.from("products").select("*").order("name").limit(500);
      if (search.trim()) q = q.or(`name.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id,name").order("name");
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });

  const lowStock = useMemo(() => products.filter(p => p.stock_quantity <= p.min_stock_threshold), [products]);
  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c.name])), [categories]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-sm text-muted-foreground">{products.length} SKUs · {lowStock.length} low stock</p>
        </div>
        <Button onClick={() => setEditing({ ...empty })}><Plus className="h-4 w-4 mr-1" /> Add Product</Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="products"><Package className="h-4 w-4 mr-1" /> Products</TabsTrigger>
          <TabsTrigger value="low"><AlertTriangle className="h-4 w-4 mr-1" /> Low Stock ({lowStock.length})</TabsTrigger>
          <TabsTrigger value="movements"><History className="h-4 w-4 mr-1" /> Stock Log</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card>
            <CardHeader className="pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Buy</TableHead>
                      <TableHead className="text-right">Sell</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>
                    ) : products.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No products</TableCell></TableRow>
                    ) : products.map((p) => {
                      const low = p.stock_quantity <= p.min_stock_threshold;
                      return (
                        <TableRow key={p.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-9 w-9 rounded bg-muted/40 overflow-hidden flex items-center justify-center shrink-0">
                                {p.images?.[0] ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" /> : <Package className="h-4 w-4 text-muted-foreground/50" />}
                              </div>
                              <div>
                                <div className="font-medium">{p.name}</div>
                                <div className="text-xs text-muted-foreground">{[p.brand, p.model].filter(Boolean).join(" · ")}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">{p.category_id ? catMap[p.category_id] : "—"}</TableCell>
                          <TableCell className="text-right text-xs">{fmtNPR(p.buying_price)}</TableCell>
                          <TableCell className="text-right font-semibold">{fmtNPR(p.selling_price)}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={p.stock_quantity <= 0 ? "destructive" : low ? "secondary" : "outline"}>
                              {p.stock_quantity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost" onClick={() => setEditing(p)}><Edit className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low">
          <LowStockPanel items={lowStock} onEdit={setEditing} />
        </TabsContent>

        <TabsContent value="movements">
          <StockMovements />
        </TabsContent>
      </Tabs>

      {editing && (
        <ProductForm
          product={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["inv-products"] }); qc.invalidateQueries({ queryKey: ["pos-products"] }); }}
        />
      )}
    </div>
  );
}

function LowStockPanel({ items, onEdit }: { items: Product[]; onEdit: (p: Product) => void }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> Low Stock Report</CardTitle></CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">All stock levels healthy ✓</div>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Product</TableHead><TableHead className="text-right">Stock</TableHead><TableHead className="text-right">Threshold</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-right"><Badge variant="destructive">{p.stock_quantity}</Badge></TableCell>
                  <TableCell className="text-right text-muted-foreground">{p.min_stock_threshold}</TableCell>
                  <TableCell><Button size="sm" variant="outline" onClick={() => onEdit(p)}>Restock</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function StockMovements() {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["stock-movements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_movements")
        .select("id,created_at,movement_type,quantity_change,previous_stock,new_stock,reason,product_id,products(name)")
        .order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Stock Movement Log (last 200)</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>When</TableHead><TableHead>Product</TableHead><TableHead>Type</TableHead>
              <TableHead className="text-right">Change</TableHead><TableHead className="text-right">Before → After</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Loading…</TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No movements yet</TableCell></TableRow>
              ) : rows.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs whitespace-nowrap">{fmtDateTime(r.created_at)}</TableCell>
                  <TableCell className="text-sm">{r.products?.name ?? "—"}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{r.movement_type}</Badge></TableCell>
                  <TableCell className={`text-right font-semibold ${r.quantity_change < 0 ? "text-destructive" : "text-success"}`}>
                    {r.quantity_change > 0 ? "+" : ""}{r.quantity_change}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">{r.previous_stock} → {r.new_stock}</TableCell>
                  <TableCell className="text-xs">{r.reason ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function ProductForm({ product, categories, onClose, onSaved }: {
  product: Partial<Product>; categories: Category[]; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<Product>>(product);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const isNew = !product.id;
  const originalStock = product.stock_quantity ?? 0;

  function set<K extends keyof Product>(k: K, v: Product[K] | any) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      set("images", [...(form.images ?? []), data.publicUrl]);
      toast.success("Image uploaded");
    } catch (e: any) { toast.error(e.message ?? "Upload failed"); }
    finally { setUploading(false); }
  }

  async function save() {
    if (!form.name?.trim()) { toast.error("Name required"); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name!, brand: form.brand || null, model: form.model || null,
        category_id: form.category_id || null,
        buying_price: Number(form.buying_price || 0),
        selling_price: Number(form.selling_price || 0),
        stock_quantity: Number(form.stock_quantity || 0),
        min_stock_threshold: Number(form.min_stock_threshold || 5),
        warranty_months: Number(form.warranty_months || 0),
        barcode: form.barcode || null,
        description: form.description || null,
        images: form.images ?? [],
      };
      let productId = form.id;
      if (isNew) {
        const { data, error } = await supabase.from("products").insert(payload).select().single();
        if (error) throw error;
        productId = data.id;
        if (payload.stock_quantity > 0) {
          await supabase.from("stock_movements").insert({
            product_id: productId, movement_type: "purchase",
            quantity_change: payload.stock_quantity, previous_stock: 0, new_stock: payload.stock_quantity,
            reason: "Initial stock",
          });
        }
      } else {
        const { error } = await supabase.from("products").update(payload).eq("id", form.id!);
        if (error) throw error;
        const diff = payload.stock_quantity - originalStock;
        if (diff !== 0) {
          await supabase.from("stock_movements").insert({
            product_id: form.id!,
            movement_type: "adjustment",
            quantity_change: diff,
            previous_stock: originalStock,
            new_stock: payload.stock_quantity,
            reason: "Manual stock adjustment",
          });
        }
      }
      toast.success(isNew ? "Product created" : "Product updated");
      onSaved();
      onClose();
    } catch (e: any) { toast.error(e.message ?? "Save failed"); }
    finally { setSaving(false); }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader><DialogTitle>{isNew ? "Add Product" : "Edit Product"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Name *</Label><Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} /></div>
          <div><Label>Brand</Label><Input value={form.brand ?? ""} onChange={(e) => set("brand", e.target.value)} /></div>
          <div><Label>Model</Label><Input value={form.model ?? ""} onChange={(e) => set("model", e.target.value)} /></div>
          <div className="col-span-2">
            <Label>Category</Label>
            <Select value={form.category_id ?? "none"} onValueChange={(v) => set("category_id", v === "none" ? null : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— none —</SelectItem>
                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Buying Price (Rs)</Label><Input type="number" value={form.buying_price ?? 0} onChange={(e) => set("buying_price", e.target.value)} /></div>
          <div><Label>Selling Price (Rs)</Label><Input type="number" value={form.selling_price ?? 0} onChange={(e) => set("selling_price", e.target.value)} /></div>
          <div><Label>Stock Quantity</Label><Input type="number" value={form.stock_quantity ?? 0} onChange={(e) => set("stock_quantity", e.target.value)} /></div>
          <div><Label>Low Stock Threshold</Label><Input type="number" value={form.min_stock_threshold ?? 5} onChange={(e) => set("min_stock_threshold", e.target.value)} /></div>
          <div><Label>Warranty (months)</Label><Input type="number" value={form.warranty_months ?? 0} onChange={(e) => set("warranty_months", e.target.value)} /></div>
          <div><Label>Barcode</Label><Input value={form.barcode ?? ""} onChange={(e) => set("barcode", e.target.value)} /></div>
          <div className="col-span-2"><Label>Description</Label><Textarea rows={2} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} /></div>
          <div className="col-span-2">
            <Label>Images</Label>
            <div className="flex gap-2 flex-wrap mt-1">
              {(form.images ?? []).map((src, i) => (
                <div key={i} className="relative h-16 w-16 rounded overflow-hidden border border-border">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => set("images", (form.images ?? []).filter((_, idx) => idx !== i))}
                    className="absolute top-0 right-0 bg-destructive text-destructive-foreground text-[10px] px-1">×</button>
                </div>
              ))}
              <label className="h-16 w-16 rounded border border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-muted/30">
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                <Upload className="h-4 w-4 text-muted-foreground" />
              </label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving || uploading}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
