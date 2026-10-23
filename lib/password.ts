import crypto from "crypto";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(candidate, "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function uid(prefix = ""): string {
  return prefix + crypto.randomBytes(9).toString("hex");
}

export function newToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// --- Stateless signed session tokens -------------------------------------
// On serverless (Vercel) every function instance has its own in-memory /
// /tmp store, so a server-side session row created by the login request is
// invisible to the instance serving the next request — the user gets
// bounced back to login. A signed token carries its own proof: any
// instance sharing SESSION_SECRET can verify it and load the user by id
// (seed user ids are fixed strings, identical on every instance).
// Trade-off, accepted for this tier: logout clears the cookie but cannot
// revoke a copied token before its expiry.
const SESSION_TTL_MS = 7 * 24 * 3600 * 1000;

function sessionSecret(): string | null {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  // Local development convenience only. Production MUST set SESSION_SECRET;
  // without it login fails loudly instead of issuing forgeable tokens.
  if (process.env.NODE_ENV !== "production") return "kisankendra-dev-secret";
  return null;
}

export function createSessionToken(userId: string): string {
  const secret = sessionSecret();
  if (!secret) throw new Error("SESSION_SECRET is not set");
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = `v1.${userId}.${exp}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string): string | null {
  const secret = sessionSecret();
  if (!secret) return null;
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") return null;
  const [, userId, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!userId || !Number.isFinite(exp) || exp < Date.now()) return null;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`v1.${userId}.${expStr}`)
    .digest("hex");
  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return userId;
}
