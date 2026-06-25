import { env } from "../config/env";
import { AppError } from "../utils/app-error";

let resendClient: import("resend").Resend | undefined;

async function getResend() {
  if (!env.RESEND_API_KEY) {
    throw new AppError(503, "Email service is not configured", "EMAIL_NOT_CONFIGURED");
  }
  if (!resendClient) {
    const { Resend } = await import("resend");
    resendClient = new Resend(env.RESEND_API_KEY);
  }
  return resendClient;
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string): Promise<void> {
  const resend = await getResend();
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: "Reset your MathHub password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6c3fe4;">Password Reset Request</h2>
        <p>Hi ${name},</p>
        <p>We received a request to reset your MathHub password. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background: #6c3fe4; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Reset Password
          </a>
        </p>
        <p style="color: #888; font-size: 13px;">If you didn't request this, you can safely ignore this email. Your password won't be changed.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #aaa; font-size: 12px;">MathHub &mdash; Your Mathematical Sanctuary</p>
      </div>
    `,
  });
  if (error) {
    throw new AppError(502, "Failed to send reset email", "EMAIL_SEND_FAILED");
  }
}
