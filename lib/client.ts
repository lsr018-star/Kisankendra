export async function api<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    credentials: "same-origin",
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : `Request failed (${res.status})`);
  }
  return data as T;
}

export interface SessionUser {
  id: string;
  role: "farmer" | "shop_owner" | "shop_staff" | "admin";
  name: string;
  email?: string;
  mobile: string;
  shopId?: string;
  permissions: string[];
  language: "en" | "hi";
  village?: string;
}

export async function fetchMe(): Promise<{ user: SessionUser; shop?: { id: string; name: string; status: string } } | null> {
  try {
    return await api("/api/auth/me");
  } catch {
    return null;
  }
}
