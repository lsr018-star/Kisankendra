"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface CartItem {
  productId: string;
  productName: string;
  packSize: string;
  pricePaise: number;
  qty: number;
  tileColor: string;
  initials: string;
}

interface CartCtx {
  items: CartItem[];
  count: number;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (productId: string, packSize: string) => void;
  setQty: (productId: string, packSize: string, qty: number) => void;
  clear: () => void;
}

const Ctx = createContext<CartCtx>({
  items: [],
  count: 0,
  add: () => {},
  remove: () => {},
  setQty: () => {},
  clear: () => {},
});

const KEY = "kk_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      // ignore corrupt cart
    }
  }, []);

  const persist = (next: CartItem[]) => {
    setItems(next);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  };

  const add: CartCtx["add"] = (item, qty = 1) => {
    const existing = items.find((i) => i.productId === item.productId && i.packSize === item.packSize);
    if (existing) {
      persist(items.map((i) => (i === existing ? { ...i, qty: i.qty + qty } : i)));
    } else {
      persist([...items, { ...item, qty }]);
    }
  };

  const remove: CartCtx["remove"] = (productId, packSize) => {
    persist(items.filter((i) => !(i.productId === productId && i.packSize === packSize)));
  };

  const setQty: CartCtx["setQty"] = (productId, packSize, qty) => {
    if (qty <= 0) return remove(productId, packSize);
    persist(items.map((i) => (i.productId === productId && i.packSize === packSize ? { ...i, qty } : i)));
  };

  const clear = () => persist([]);

  return (
    <Ctx.Provider value={{ items, count: items.reduce((s, i) => s + i.qty, 0), add, remove, setQty, clear }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart(): CartCtx {
  return useContext(Ctx);
}
