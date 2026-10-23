// Forgot-password OTP flow tests. Run against a fresh-seeded server:
//   BASE=http://127.0.0.1:3200 node scripts/test-otp.mjs
const BASE = process.env.BASE || "http://127.0.0.1:3200";
let passed = 0, failed = 0;
function check(name, cond, extra = "") {
  if (cond) { passed++; console.log(`  PASS ${name}`); }
  else { failed++; console.log(`  FAIL ${name} ${extra}`); }
}
async function call(path, { method = "GET", body, cookie } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { /* html error page */ }
  const setCookie = res.headers.get("set-cookie") || "";
  return { status: res.status, data, cookie: setCookie.split(";")[0] };
}

const FARMER = "9876543210"; // Ramesh Patel, password farmer123 on fresh seed
const SHOPB = "shopb@kisankendra.in"; // password shop123 on fresh seed

console.log("== Forgot-password OTP flow ==");

// 1. Unknown identifier: generic 200, no OTP leaked
let r = await call("/api/auth/forgot-password", { method: "POST", body: { identifier: "9000000099" } });
check("unknown identifier -> 200 generic, no demoOtp", r.status === 200 && !r.data?.demoOtp, JSON.stringify(r.data));

// 2. Farmer requests OTP -> demo OTP returned (demo mode)
r = await call("/api/auth/forgot-password", { method: "POST", body: { identifier: FARMER } });
check("farmer forgot -> 200 + 6-digit demoOtp", r.status === 200 && /^\d{6}$/.test(r.data?.demoOtp || ""), JSON.stringify(r.data));
const farmerOtp = r.data.demoOtp;

// 3. Immediate resend -> cooldown 429
r = await call("/api/auth/forgot-password", { method: "POST", body: { identifier: FARMER } });
check("immediate resend -> 429 cooldown", r.status === 429, `got ${r.status}`);

// 4. Wrong OTP -> 401
r = await call("/api/auth/reset-password", { method: "POST", body: { identifier: FARMER, otp: "000000", newPassword: "newpass123" } });
check("wrong OTP -> 401", r.status === 401, `got ${r.status}`);

// 5. Short new password -> 422 (before OTP is consumed)
r = await call("/api/auth/reset-password", { method: "POST", body: { identifier: FARMER, otp: farmerOtp, newPassword: "abc" } });
check("short password -> 422", r.status === 422, `got ${r.status}`);

// 6. Correct OTP -> 200, session cookie set, user returned
r = await call("/api/auth/reset-password", { method: "POST", body: { identifier: FARMER, otp: farmerOtp, newPassword: "newpass123" } });
check("correct OTP -> 200 + user + cookie", r.status === 200 && r.data?.user?.name === "Ramesh Patel" && r.cookie.includes("kk_session"), `got ${r.status} ${JSON.stringify(r.data)}`);
const sessionCookie = r.cookie;

// 7. Auto-login works: /api/auth/me with the reset cookie
r = await call("/api/auth/me", { cookie: sessionCookie });
check("me with reset cookie -> Ramesh Patel", r.status === 200 && r.data?.user?.name === "Ramesh Patel", `got ${r.status}`);

// 8. OTP cannot be reused
r = await call("/api/auth/reset-password", { method: "POST", body: { identifier: FARMER, otp: farmerOtp, newPassword: "another123" } });
check("OTP reuse -> 401", r.status === 401, `got ${r.status}`);

// 9. Old password dead, new password works
r = await call("/api/auth/login", { method: "POST", body: { identifier: FARMER, password: "farmer123" } });
check("old password -> 401", r.status === 401, `got ${r.status}`);
r = await call("/api/auth/login", { method: "POST", body: { identifier: FARMER, password: "newpass123" } });
check("new password -> 200", r.status === 200, `got ${r.status}`);

// 10. Shop owner by email: full round trip
r = await call("/api/auth/forgot-password", { method: "POST", body: { identifier: SHOPB } });
check("shop forgot -> demoOtp", r.status === 200 && /^\d{6}$/.test(r.data?.demoOtp || ""), JSON.stringify(r.data));
const shopOtp = r.data.demoOtp;
r = await call("/api/auth/reset-password", { method: "POST", body: { identifier: SHOPB, otp: shopOtp, newPassword: "shopnew123" } });
check("shop reset -> 200 + Verma Agro Centre owner", r.status === 200 && r.data?.user?.shopId === "shop_b", `got ${r.status} ${JSON.stringify(r.data)}`);
r = await call("/api/auth/login", { method: "POST", body: { identifier: SHOPB, password: "shopnew123" } });
check("shop new password login -> 200", r.status === 200, `got ${r.status}`);

console.log(`==== OTP SUMMARY: ${passed} passed, ${failed} failed ====`);
process.exit(failed ? 1 : 0);
