import nodemailer from "nodemailer";

export function getSmtpConfig() {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    return null;
  }
  return {
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: SMTP_SECURE === "true",
    user: SMTP_USER.trim().toLowerCase(),
    password: SMTP_PASSWORD,
  };
}

export async function sendExternalEmail({ fromName, fromEmail, to, subject, text }) {
  const config = getSmtpConfig();
  if (!config) {
    const error = new Error("External email is not configured. Add the SMTP settings to server/.env.");
    error.code = "SMTP_NOT_CONFIGURED";
    throw error;
  }
  if (config.user !== fromEmail.trim().toLowerCase()) {
    const error = new Error("The signed-in email must match the authenticated SMTP account.");
    error.code = "SMTP_SENDER_MISMATCH";
    throw error;
  }
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.password },
  });
  return transporter.sendMail({
    from: { name: fromName, address: fromEmail },
    replyTo: fromEmail,
    to,
    subject,
    text,
  });
}