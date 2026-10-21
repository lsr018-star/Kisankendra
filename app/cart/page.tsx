"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, fetchMe, type SessionUser } from "@/lib/client";
import { inr, pctOf } from "@/lib/money";
import { useLang } from "@/components/LanguageProvider";
import { useCart } from "@/components/CartProvider";
import { VILLAGES } from "@/lib/villages";

interface PlacedOrder {
  id: string;
  orderNo: string;
  status: string;
  totalPaise: number;
  shopId?: string;
  unassignedReason?: string;
}

export default function CartPage() {
  const { t } = useLang();
  const cart = useCart();
  const [me, setMe] = useState<SessionUser | null>(null);
  const [fee, setFee] = useState(4900);
  const [taxPct, setTaxPct] = useState(5);
  const [refundNote, setRefundNote] = useState("");
  const [form, setForm] = useState({
    customerName: "",
    mobile: "",
    village: "Seoni Malwa",
    addressLine: "",
    deliveryType: "home",
    instructions: "",
    paymentMethod: "COD",
  });
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);

  useEffect(() => {
    api<{ deliveryFeePaise: number; taxPct: number; refundNote: string }>("/api/config")
      .then((c) => {
        setFee(c.deliveryFeePaise);
        setTaxPct(c.taxPct);
        setRefundNote(c.refundNote);
      })
      .catch(() => {});
    fetchMe().then((r) => {
      if (r?.user) {
        setMe(r.user);
        setForm((f) => ({
          ...f,
          customerName: r.user.name,
          mobile: r.user.mobile,
          village: r.user.village ?? f.village,
        }));
      }
    });
  }, []);

  const itemsTotal = cart.items.reduce((s, i) => s + i.pricePaise * i.qty, 0);
  const tax = pctOf(itemsTotal, taxPct);
  const total = itemsTotal + (cart.items.length ? fee : 0) + tax;

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPlacing(true);
    try {
      const r = await api<{ order: PlacedOrder }>("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          items: cart.items.map((i) => ({ productId: i.productId, packSize: i.packSize, qty: i.qty })),
          ...form,
        }),
      });
      setPlaced(r.order);
      cart.clear();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order could not be placed");
    } finally {
      setPlacing(false);
    }
  };

  if (placed) {
    return (
      <div className="card mx-auto max-w-xl text-center">
        <h1 className="text-2xl font-bold text-leaf-800">Order placed successfully</h1>
        <p className="mt-2">
          Order number: <strong>{placed.orderNo}</strong>
        </p>
        <p className="mt-1">Total: <strong>{inr(placed.totalPaise)}</strong> ({form.paymentMethod === "COD" ? t("cod") : t("manualPay")})</p>
        {placed.status === "Unassigned" ? (
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-amber-900" role="status">
            {placed.unassignedReason ?? "No partner shop can fulfil this order right now."} Our team will try to
            assign a shop. You can cancel anytime from your orders.
          </p>
        ) : (
          <p className="mt-3 rounded-lg bg-leaf-50 p-3 text-leaf-800" role="status">
            Your order has been assigned to a nearby authorised partner shop. The shop will confirm and deliver.
          </p>
        )}
        <div className="mt-4 flex justify-center gap-3">
          <Link href={`/farmer/orders/${placed.id}`} className="btn-primary">{t("orderTracking")}</Link>
          <Link href="/catalogue" className="btn-secondary">{t("catalogue")}</Link>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="card text-center">
        <h1 className="text-xl font-bold">{t("cart")}</h1>
        <p className="mt-2 text-neutral-600">Your cart is empty.</p>
        <Link href="/catalogue" className="btn-primary mt-4">{t("viewProducts")}</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
      <section className="card self-start" aria-label="Cart items">
        <h1 className="text-xl font-bold text-leaf-900">{t("cart")}</h1>
        <ul className="mt-3 divide-y">
          {cart.items.map((i) => (
            <li key={i.productId + i.packSize} className="flex flex-wrap items-center gap-3 py-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg font-bold text-white" style={{ background: i.tileColor }} aria-hidden="true">
                {i.initials}
              </span>
              <span className="min-w-[160px] flex-1">
                <span className="block font-semibold">{i.productName}</span>
                <span className="text-sm text-neutral-600">{i.packSize} · {inr(i.pricePaise)}</span>
              </span>
              <label className="sr-only" htmlFor={`q-${i.productId}`}>{t("quantity")}</label>
              <input
                id={`q-${i.productId}`}
                type="number"
                min={1}
                className="input w-20"
                value={i.qty}
                onChange={(e) => cart.setQty(i.productId, i.packSize, Number(e.target.value) || 1)}
              />
              <span className="w-24 text-right font-bold">{inr(i.pricePaise * i.qty)}</span>
              <button className="btn-secondary" onClick={() => cart.remove(i.productId, i.packSize)}>
                {t("remove")}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card self-start" aria-label="Checkout">
        <h2 className="text-xl font-bold text-leaf-900">{t("checkout")}</h2>
        <dl className="mt-3 space-y-1 text-neutral-800">
          <div className="flex justify-between"><dt>{t("subtotal")}</dt><dd>{inr(itemsTotal)}</dd></div>
          <div className="flex justify-between"><dt>{t("deliveryFee")}</dt><dd>{inr(fee)}</dd></div>
          <div className="flex justify-between"><dt>{t("tax")} ({taxPct}%)</dt><dd>{inr(tax)}</dd></div>
          <div className="flex justify-between border-t pt-2 text-lg font-extrabold"><dt>{t("total")}</dt><dd>{inr(total)}</dd></div>
        </dl>
        <p className="mt-1 text-xs text-neutral-500">Prices are confirmed again by the shop at acceptance; if anything changes, you are informed before delivery. No silent price changes.</p>

        {!me ? (
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-amber-900">
            Please <Link href="/login?as=farmer" className="font-bold underline">{t("farmerLogin")}</Link> to place the order.
          </p>
        ) : me.role !== "farmer" ? (
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-amber-900">You are logged in as {me.role}. Marketplace orders need a farmer account.</p>
        ) : (
          <form onSubmit={placeOrder} className="mt-4 flex flex-col gap-3">
            <div>
              <label className="label" htmlFor="co-name">{t("fullName")}</label>
              <input id="co-name" required className="input" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="co-mobile">{t("mobile")}</label>
              <input id="co-mobile" required inputMode="numeric" className="input" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="co-village">{t("village")}</label>
              <select id="co-village" className="input" value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })}>
                {VILLAGES.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
                <option value="Other Village">Other Village (not listed)</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="co-addr">{t("address")}</label>
              <textarea id="co-addr" required className="input" rows={2} value={form.addressLine} onChange={(e) => setForm({ ...form, addressLine: e.target.value })} />
            </div>
            <fieldset>
              <legend className="label">{t("deliveryType")}</legend>
              <label className="mr-4 inline-flex items-center gap-2">
                <input type="radio" name="dt" checked={form.deliveryType === "home"} onChange={() => setForm({ ...form, deliveryType: "home" })} />
                {t("homeDelivery")}
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="radio" name="dt" checked={form.deliveryType === "field"} onChange={() => setForm({ ...form, deliveryType: "field" })} />
                {t("fieldDelivery")}
              </label>
            </fieldset>
            <div>
              <label className="label" htmlFor="co-ins">{t("instructions")}</label>
              <input id="co-ins" className="input" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
            </div>
            <fieldset>
              <legend className="label">{t("paymentMethod")}</legend>
              <label className="mr-4 inline-flex items-center gap-2">
                <input type="radio" name="pm" checked={form.paymentMethod === "COD"} onChange={() => setForm({ ...form, paymentMethod: "COD" })} />
                {t("cod")}
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="radio" name="pm" checked={form.paymentMethod === "Manual"} onChange={() => setForm({ ...form, paymentMethod: "Manual" })} />
                {t("manualPay")}
              </label>
              <p className="mt-1 text-xs text-neutral-500">Online payment will be enabled after the payment gateway and settlement model are set up. Until then, orders are confirmed manually — no card details are ever collected here.</p>
            </fieldset>
            {error && <p className="rounded-lg bg-red-50 p-3 text-red-800" role="alert">{error}</p>}
            <button type="submit" disabled={placing} className="btn-primary w-full">
              {placing ? "Placing order…" : t("placeOrder")}
            </button>
            {refundNote && <p className="text-xs text-neutral-500">{refundNote}</p>}
          </form>
        )}
      </section>
    </div>
  );
}
