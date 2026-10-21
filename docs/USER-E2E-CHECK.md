# Kisankendra — Boss ke liye End-to-End Check Guide (Codespaces private preview)

Taiyaar: 2026-10-21. Fresh verification (usi din, is workspace mein): `npm run build` PASS,
production server par API suite **41 passed / 0 failed**, home/catalogue/cart/login/
farmer/shop/admin/product — sab routes HTTP 200.

## App kholna (private link)
1. github.com/lsr018-star/Kisankendra → green **Code** button → **Codespaces** tab →
   **Create codespace on main**
2. 2–4 minute ruko — install + build + start apne aap hota hai (neeche terminal mein
   progress dikhega; beech mein kuch khule toh ghabrana mat, build chal raha hai).
3. Neeche **Ports** tab → port **3000** ("Kisankendra App") → globe 🌐 icon.
   Ye link sirf aapke GitHub login se khulta hai — bilkul private hai.

## 5-minute end-to-end check (teenon role, ek hi order)
**Step 1 — Farmer order kare:**
- Login: mobile `9876543210` / password `farmer123` (Ramesh Patel)
- Catalogue mein **HerbiClear Selective Herbicide (FasalRaksha, 400 ml, ₹549)** cart mein dalo
- Checkout: village **Seoni Malwa**, home delivery, COD
- Sahi result: order **Pending**, total **₹625.45** (₹549 + delivery ₹49 + tax ₹27.45),
  aur order **Verma Agro Centre** ko assigned — kyunki isi shop par iska stock (20) hai;
  Sharma Krishi Seva Kendra par stock 0 hai, isliye use nahi gaya. Yahi assignment logic hai.

**Step 2 — Shop order pura kare:**
- Logout → Shop login: `shopb@kisankendra.in` / `shop123` (Verma Agro Centre)
- Orders mein wahi order dikhega → status ek-ek karke badlo:
  Accepted → Processing → Ready for Dispatch → Out for Delivery → Delivered
- Sahi result: Inventory mein HerbiClear ka stock **20 → 19** ho jayega.

**Step 3 — Farmer tracking dekhe:**
- Phir se farmer login → My Orders — wahi order **Delivered** dikhna chahiye.

**Step 4 — Admin nazar:**
- Admin login: `admin@kisankendra.in` / `admin123` — dashboard par orders/shops/tickets
  ke counts aur wahi order dikhega. Ek Pending shop (New Agro Point) bhi dikhega —
  use assignments nahi milte, yahi sahi behaviour hai.

**Bonus 1-minute checks:** header mein Hindi toggle (choice reload ke baad bhi rehti hai);
Solution Box se ek test ticket bhejo — admin mein dikhega; Disease Finder mein "soybean"
search karke dekho.

## Dhyaan rahe
- Codespace 30 minute idle rahe toh auto-band ho jata hai; dobara kholne par app khud
  start ho jayega, data safe rehta hai. Kharcha ₹0 (GitHub free quota).
- Ye demo data hai: payments COD/manual mode mein hain, koi asli payment nahi hota.
- Vercel public deploy jaan-boojh kar baad ke liye rakha hai (Boss ke kehne par) —
  pehle ye private check, phir jab Boss kahen.
