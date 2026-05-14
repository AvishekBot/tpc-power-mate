import { fmtNPR, fmtDateTime } from "@/lib/format";
import { fmtBsDate } from "@/lib/nepali-date";

export type InvoiceItem = {
  product_name_snapshot: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export type InvoiceData = {
  invoice_number: string;
  sale_date: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  payment_method: string;
  cash_received?: number | null;
  change_given?: number | null;
  digital_reference?: string | null;
  subtotal: number;
  discount_amount: number;
  vat_amount: number;
  total_amount: number;
  cashier_name?: string | null;
  items: InvoiceItem[];
};

export function InvoicePrint({ inv }: { inv: InvoiceData }) {
  return (
    <div className="invoice-print bg-white text-black p-8 mx-auto" style={{ width: "210mm", minHeight: "auto", fontFamily: "system-ui, sans-serif" }}>
      <div className="text-center border-b-2 border-black pb-3 mb-4">
        <h1 className="text-2xl font-extrabold tracking-wide">T.P.C POWER SOLUTIONS</h1>
        <p className="text-sm">Bharatpur-2, Kshetrapur, Chitwan, Nepal</p>
        <p className="text-xs text-gray-700">UPS • Inverters • Solar • Stabilizers • Transformers • VFDs</p>
      </div>

      <div className="flex justify-between mb-4 text-sm">
        <div className="space-y-0.5">
          <div><span className="font-semibold">Invoice #:</span> {inv.invoice_number}</div>
          <div><span className="font-semibold">Date (AD):</span> {fmtDateTime(inv.sale_date)}</div>
          <div><span className="font-semibold">Date (BS):</span> {fmtBsDate(inv.sale_date)}</div>
          {inv.cashier_name && <div><span className="font-semibold">Cashier:</span> {inv.cashier_name}</div>}
        </div>
        <div className="text-right space-y-0.5">
          {inv.customer_name && <div><span className="font-semibold">Customer:</span> {inv.customer_name}</div>}
          {inv.customer_phone && <div><span className="font-semibold">Phone:</span> {inv.customer_phone}</div>}
          <div><span className="font-semibold">Payment:</span> {inv.payment_method.toUpperCase()}</div>
          {inv.digital_reference && <div className="text-xs">Ref: {inv.digital_reference}</div>}
        </div>
      </div>

      <table className="w-full text-sm border-collapse mb-4">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="text-left py-1.5">#</th>
            <th className="text-left py-1.5">Item</th>
            <th className="text-right py-1.5">Qty</th>
            <th className="text-right py-1.5">Unit (Rs)</th>
            <th className="text-right py-1.5">Total (Rs)</th>
          </tr>
        </thead>
        <tbody>
          {inv.items.map((it, i) => (
            <tr key={i} className="border-b border-gray-300">
              <td className="py-1.5">{i + 1}</td>
              <td className="py-1.5">{it.product_name_snapshot}</td>
              <td className="py-1.5 text-right">{it.quantity}</td>
              <td className="py-1.5 text-right">{Number(it.unit_price).toLocaleString("en-IN")}</td>
              <td className="py-1.5 text-right">{Number(it.line_total).toLocaleString("en-IN")}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-72 text-sm">
          <div className="flex justify-between py-1"><span>Subtotal</span><span>{fmtNPR(inv.subtotal)}</span></div>
          {inv.discount_amount > 0 && (
            <div className="flex justify-between py-1"><span>Discount</span><span>− {fmtNPR(inv.discount_amount)}</span></div>
          )}
          <div className="flex justify-between py-1"><span>VAT (13%)</span><span>{fmtNPR(inv.vat_amount)}</span></div>
          <div className="flex justify-between py-2 border-t-2 border-black font-extrabold text-base">
            <span>GRAND TOTAL</span><span>{fmtNPR(inv.total_amount)}</span>
          </div>
          {inv.payment_method === "cash" && inv.cash_received != null && (
            <>
              <div className="flex justify-between py-1"><span>Cash Received</span><span>{fmtNPR(inv.cash_received)}</span></div>
              <div className="flex justify-between py-1 font-semibold"><span>Change</span><span>{fmtNPR(inv.change_given ?? 0)}</span></div>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 border border-gray-400 rounded p-3 text-xs">
        <div className="font-semibold mb-1">Warranty & Terms</div>
        <ul className="list-disc pl-4 space-y-0.5 text-gray-800">
          <li>Warranty applies as per manufacturer terms from the date of this invoice.</li>
          <li>Goods once sold are not returnable except under warranty conditions.</li>
          <li>Physical damage, water damage, and unauthorized servicing void the warranty.</li>
          <li>This invoice must be presented for any warranty claim or service request.</li>
        </ul>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-6 text-xs">
        <div className="text-center">
          <div className="border-t border-black pt-1 mt-12">Customer Signature</div>
        </div>
        <div className="text-center">
          <div className="mx-auto w-32 h-20 border-2 border-dashed border-gray-500 rounded flex items-center justify-center text-[10px] text-gray-500">
            Stamp & Signature
          </div>
          <div className="mt-1">For T.P.C Power Solutions</div>
        </div>
      </div>

      <div className="text-center text-xs text-gray-600 mt-6 border-t pt-3">
        Thank you for your business! • धन्यवाद ।
      </div>
    </div>
  );
}
