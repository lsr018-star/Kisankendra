import { randomInt } from "crypto";
import { loadStore, saveStore, audit } from "./db";
import { hashPassword, verifyPassword } from "./password";
import { pgEnabled, flushPgWrites, fetchUserByIdentifierFromPg } from "./pg";
import type { PasswordOtp, Store, User } from "./types";

// Forgot-password via OTP, for every role (farmer by mobile, shop/admin by
// email or mobile). The OTP is 6 digits, stored only as a hash, valid for
// 10 minutes, with at most 5 attempts and a 30-second resend cooldown.
//
// Delivery: until an SMS/email provider is configured (OTP_SMS_PROVIDER),
// the app runs in demo mode and the API returns the code so the UI can show
// it on screen — the same "demo mode" honesty as the payment layer. Setting
// OTP_SMS_PROVIDER is the switch a real gateway plugs into; the reset flow
// itself does not change.
//
// Storage note: OTP records are never deleted, only burned (attempts maxed
// and expiry zeroed). The Postgres layer upsert-merges and cannot delete
// rows, so a burned record is the tombstone that stops a used OTP from
// ever working again on any instance. One record per user, id otp_<userId>.

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 30 * 1000;

export function otpDemoMode(): boolean {
  return !process.env.OTP_SMS_PROVIDER;
}

async function findUser(store: Store, identifier: string): Promise<User | null> {
  const local = store.users.find(
    (u) => u.email?.toLowerCase() === identifier || u.mobile === identifier,
  );
  if (local) return local;
  if (pgEnabled()) {
    const fromPg = await fetchUserByIdentifierFromPg(identifier).catch(() => null);
    if (fromPg) {
      store.users.push(fromPg);
      return fromPg;
    }
  }
  return null;
}

async function persist(store: Store): Promise<void> {
  saveStore();
  if (pgEnabled()) await flushPgWrites();
}

function burn(record: PasswordOtp): void {
  record.attempts = OTP_MAX_ATTEMPTS;
  record.expiresAt = new Date(0).toISOString();
}

export interface RequestOtpResult {
  sent: boolean;
  demoOtp?: string;
  cooldownSeconds?: number;
}

export async function requestPasswordOtp(identifierRaw: string): Promise<RequestOtpResult> {
  const identifier = identifierRaw.trim().toLowerCase();
  const store = loadStore();
  const user = await findUser(store, identifier);
  if (!user) return { sent: false };

  const now = Date.now();
  const existing = store.passwordOtps.find((o) => o.userId === user.id);
  if (
    existing &&
    existing.attempts < OTP_MAX_ATTEMPTS &&
    new Date(existing.expiresAt).getTime() > now &&
    now - new Date(existing.createdAt).getTime() < OTP_RESEND_COOLDOWN_MS
  ) {
    const waited = Math.ceil(
      (OTP_RESEND_COOLDOWN_MS - (now - new Date(existing.createdAt).getTime())) / 1000,
    );
    return { sent: false, cooldownSeconds: waited };
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const record: PasswordOtp = {
    id: `otp_${user.id}`,
    userId: user.id,
    otpHash: hashPassword(code),
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + OTP_TTL_MS).toISOString(),
    attempts: 0,
  };
  const idx = store.passwordOtps.findIndex((o) => o.id === record.id);
  if (idx >= 0) store.passwordOtps[idx] = record;
  else store.passwordOtps.push(record);
  audit(store, user.id, user.role, "auth.otp.request", "user", user.id, "Password reset OTP requested");
  await persist(store);
  return { sent: true, demoOtp: otpDemoMode() ? code : undefined };
}

export class OtpError extends Error {}

export async function resetPasswordWithOtp(
  identifierRaw: string,
  codeRaw: string,
  newPassword: string,
): Promise<User> {
  const identifier = identifierRaw.trim().toLowerCase();
  const code = codeRaw.trim();
  const store = loadStore();
  const user = await findUser(store, identifier);
  if (!user) throw new OtpError("Invalid OTP. Please check and try again.");

  const record = store.passwordOtps.find((o) => o.userId === user.id);
  if (!record || record.attempts >= OTP_MAX_ATTEMPTS) {
    throw new OtpError("No valid OTP found. Please request a new OTP.");
  }
  if (new Date(record.expiresAt).getTime() < Date.now()) {
    burn(record);
    await persist(store);
    throw new OtpError("This OTP has expired. Please request a new OTP.");
  }

  record.attempts += 1;
  if (!verifyPassword(code, record.otpHash)) {
    if (record.attempts >= OTP_MAX_ATTEMPTS) burn(record);
    await persist(store);
    throw new OtpError("Invalid OTP. Please check and try again.");
  }

  user.passwordHash = hashPassword(newPassword);
  burn(record);
  audit(store, user.id, user.role, "auth.password.reset", "user", user.id, "Password reset via OTP");
  await persist(store);
  return user;
}
