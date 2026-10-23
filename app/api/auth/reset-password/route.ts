import { fail, json } from "@/lib/api-helpers";
import { createSessionToken, publicUser, SESSION_COOKIE } from "@/lib/auth";
import { resetPasswordWithOtp, OtpError } from "@/lib/password-reset";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const identifier = String(body?.identifier ?? "").trim();
  const otp = String(body?.otp ?? "").trim();
  const newPassword = String(body?.newPassword ?? "");
  if (!identifier || !/^\d{6}$/.test(otp)) {
    return fail("Enter your mobile/email and the 6-digit OTP", 422);
  }
  if (newPassword.length < 6) {
    return fail("New password must be at least 6 characters", 422);
  }

  try {
    const user = await resetPasswordWithOtp(identifier, otp, newPassword);
    // OTP login, as requested: a successful reset signs the user in
    // immediately with the same stateless token as a normal login.
    const token = createSessionToken(user.id);
    const res = json({ user: publicUser(user) });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 3600,
    });
    return res;
  } catch (e) {
    if (e instanceof OtpError) return fail(e.message, 401);
    throw e;
  }
}
