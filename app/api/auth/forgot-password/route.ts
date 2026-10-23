import { fail, json } from "@/lib/api-helpers";
import { requestPasswordOtp } from "@/lib/password-reset";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const identifier = String(body?.identifier ?? "").trim();
  if (!identifier) return fail("Enter your email or mobile number", 422);

  const r = await requestPasswordOtp(identifier).catch(() => ({ sent: false }) as const);
  if ("cooldownSeconds" in r && r.cooldownSeconds) {
    return fail(`Please wait ${r.cooldownSeconds} seconds before requesting a new OTP`, 429);
  }
  // Generic message either way (never reveals whether the account exists);
  // in demo mode the OTP itself is returned so the UI can display it.
  return json({
    ok: true,
    message: "If an account exists for this mobile number or email, an OTP has been sent.",
    ...("demoOtp" in r && r.demoOtp ? { demoMode: true, demoOtp: r.demoOtp } : {}),
  });
}
