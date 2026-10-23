import { cookies } from "next/headers";
import { loadStore, saveStore } from "@/lib/db";
import { json } from "@/lib/api-helpers";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  // Signed session tokens are stateless: clearing the cookie below is what
  // logs the user out on this device. Legacy server-side rows are also
  // removed when present.
  const store = loadStore();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    store.sessions = store.sessions.filter((s) => s.token !== token);
    saveStore();
  }
  const res = json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
