const { Resend } = require("resend");
const env = require("../config/env");
const logger = require("../utils/logger");

const resend = env.email.resendApiKey ? new Resend(env.email.resendApiKey) : null;

/**
 * Sends via Resend when RESEND_API_KEY is configured; otherwise logs the code to the server
 * console instead (local dev without an API key). Never throws — callers must not fail an
 * otherwise-successful request (registration, resend, forgot-password) just because the email
 * provider had a transient issue; the user still has the "Resend code" recovery path.
 */
async function sendEmail({ to, subject, html, logFallbackLabel, logFallbackCode }) {
  if (!resend) {
    logger.info(`[DEV EMAIL] ${logFallbackLabel} for ${to}: ${logFallbackCode}`);
    return;
  }
  try {
    const { error } = await resend.emails.send({ from: env.email.from, to, subject, html });
    if (error) logger.error(`Failed to send email to ${to}: ${JSON.stringify(error)}`);
  } catch (err) {
    logger.error(`Failed to send email to ${to}: ${err.message}`);
  }
}

function codeEmailHtml({ heading, fullName, code, bodyText, expiryText }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #0f172a;">${heading}</h2>
      <p style="color: #334155;">Hi ${fullName || "there"},</p>
      <p style="color: #334155;">${bodyText}</p>
      <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
        <span style="font-size: 28px; font-weight: bold; letter-spacing: 8px; color: #0f172a;">${code}</span>
      </div>
      <p style="color: #64748b; font-size: 13px;">${expiryText}</p>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;
}

async function sendOtpEmail({ to, fullName, otp }) {
  await sendEmail({
    to,
    subject: "Verify your CMS account",
    html: codeEmailHtml({
      heading: "Verify your email",
      fullName,
      code: otp,
      bodyText: "Enter this code to verify your account and finish creating it.",
      expiryText: "This code expires in 10 minutes.",
    }),
    logFallbackLabel: "Verification code",
    logFallbackCode: otp,
  });
}

async function sendPasswordResetEmail({ to, fullName, code }) {
  await sendEmail({
    to,
    subject: "Reset your CMS password",
    html: codeEmailHtml({
      heading: "Reset your password",
      fullName,
      code,
      bodyText: "Enter this code to reset your password.",
      expiryText: "This code expires in 15 minutes.",
    }),
    logFallbackLabel: "Password reset code",
    logFallbackCode: code,
  });
}

module.exports = { sendOtpEmail, sendPasswordResetEmail };
