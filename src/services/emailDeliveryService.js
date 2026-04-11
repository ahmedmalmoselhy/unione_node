import nodemailer from 'nodemailer';

let cachedTransporter;

function toBoolean(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === undefined || value === null) {
    return false;
  }

  const normalized = String(value).trim().toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(normalized);
}

function createTransporter() {
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const port = Number(process.env.EMAIL_PORT || process.env.SMTP_PORT || 587);

  if (!host) {
    // Default to JSON transport for local/dev runs when SMTP is not configured.
    return nodemailer.createTransport({ jsonTransport: true });
  }

  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASSWORD || process.env.SMTP_PASSWORD;

  return nodemailer.createTransport({
    host,
    port,
    secure: toBoolean(process.env.EMAIL_SECURE) || port === 465,
    auth: user ? { user, pass } : undefined,
  });
}

function getTransporter() {
  if (!cachedTransporter) {
    cachedTransporter = createTransporter();
  }
  return cachedTransporter;
}

function normalizeRecipients(recipients) {
  const unique = new Set();
  for (const recipient of recipients || []) {
    if (!recipient) {
      continue;
    }
    const email = String(recipient).trim().toLowerCase();
    if (email) {
      unique.add(email);
    }
  }
  return [...unique];
}

export async function sendBulkEmails(messages = []) {
  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM || 'no-reply@unione.local';
  let sent = 0;
  let failed = 0;

  for (const message of messages) {
    const recipients = normalizeRecipients(Array.isArray(message.to) ? message.to : [message.to]);
    if (!recipients.length || !message.subject || !message.text) {
      continue;
    }

    try {
      await transporter.sendMail({
        from,
        to: recipients,
        subject: message.subject,
        text: message.text,
      });
      sent += 1;
    } catch (error) {
      failed += 1;
      // Email failures are non-fatal for business workflows.
      console.error('Email delivery failed:', error?.message || error);
    }
  }

  return { sent, failed };
}

export default {
  sendBulkEmails,
};
