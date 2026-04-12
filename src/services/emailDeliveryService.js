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

/**
 * Send bulk emails
 * @param {Array} messages - Array of email messages
 * @returns {object} Sent and failed counts
 */
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
      console.error(`Failed to send email to ${recipients.join(', ')}: ${error.message}`);
    }
  }

  return { sent, failed };
}

/**
 * Send single email
 * @param {object} options - Email options
 * @returns {Promise<object>} Email result
 */
export async function sendEmail({ to, subject, text, html }) {
  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM || 'no-reply@unione.local';
  const recipients = normalizeRecipients(Array.isArray(to) ? to : [to]);

  if (!recipients.length || !subject || !text) {
    throw new Error('Invalid email parameters');
  }

  return transporter.sendMail({
    from,
    to: recipients,
    subject,
    text,
    html: html || text,
  });
}

/**
 * Send announcement email
 * @param {number} userId - User ID
 * @param {object} announcement - Announcement data
 */
export async function sendAnnouncementEmail(userId, announcement) {
  const db = require('../config/knex.js').default;
  
  const user = await db('users').where('id', userId).first();
  if (!user || !user.email) return;

  const subject = `📢 New Announcement: ${announcement.title}`;
  const text = `
Dear ${user.first_name} ${user.last_name},

A new announcement has been published:

Title: ${announcement.title}
Type: ${announcement.type}
Message: ${announcement.body}

Please log in to your UniOne account for more details.

Best regards,
UniOne Team
  `.trim();

  return sendEmail({
    to: user.email,
    subject,
    text,
  });
}

/**
 * Send exam schedule email
 * @param {number} userId - User ID
 * @param {object} examSchedule - Exam schedule data
 */
export async function sendExamScheduleEmail(userId, examSchedule) {
  const db = require('../config/knex.js').default;
  
  const user = await db('users').where('id', userId).first();
  if (!user || !user.email) return;

  const subject = `📅 Exam Schedule Published`;
  const text = `
Dear ${user.first_name} ${user.last_name},

The exam schedule has been published:

Date: ${examSchedule.exam_date}
Time: ${examSchedule.start_time} - ${examSchedule.end_time}
Location: ${examSchedule.location || 'TBD'}

Please check your UniOne account for the complete schedule.

Best regards,
UniOne Team
  `.trim();

  return sendEmail({
    to: user.email,
    subject,
    text,
  });
}

/**
 * Send grade published email
 * @param {number} userId - User ID
 * @param {object} grade - Grade data
 */
export async function sendGradePublishedEmail(userId, grade) {
  const db = require('../config/knex.js').default;
  
  const user = await db('users').where('id', userId).first();
  if (!user || !user.email) return;

  const subject = `📊 Your Grade is Available`;
  const text = `
Dear ${user.first_name} ${user.last_name},

Your grade has been published:

Course: ${grade.course_name || 'Course'}
Grade: ${grade.letter_grade || grade.total || 'Available'}
Total: ${grade.total || 'N/A'}/100

Please log in to your UniOne account to view your complete grade report.

Best regards,
UniOne Team
  `.trim();

  return sendEmail({
    to: user.email,
    subject,
    text,
  });
}

/**
 * Send waitlist promotion email
 * @param {number} userId - User ID
 * @param {object} enrollment - Enrollment data
 */
export async function sendWaitlistPromotedEmail(userId, enrollment) {
  const db = require('../config/knex.js').default;
  
  const user = await db('users').where('id', userId).first();
  if (!user || !user.email) return;

  const subject = `✅ You've Been Enrolled!`;
  const text = `
Dear ${user.first_name} ${user.last_name},

Great news! A spot has opened up and you have been enrolled in:

Course: ${enrollment.course_name || 'Course'}
Section: ${enrollment.section_id}
Term: ${enrollment.term_name || 'Current Term'}

You are now officially enrolled. Please check your UniOne account for course details and schedule.

Best regards,
UniOne Team
  `.trim();

  return sendEmail({
    to: user.email,
    subject,
    text,
  });
}

/**
 * Send enrollment confirmation email
 * @param {number} userId - User ID
 * @param {object} enrollment - Enrollment data
 */
export async function sendEnrollmentConfirmationEmail(userId, enrollment) {
  const db = require('../config/knex.js').default;
  
  const user = await db('users').where('id', userId).first();
  if (!user || !user.email) return;

  const subject = `✅ Enrollment Confirmed`;
  const text = `
Dear ${user.first_name} ${user.last_name},

Your enrollment has been confirmed:

Course: ${enrollment.course_name || 'Course'}
Section: ${enrollment.section_id}
Term: ${enrollment.term_name || 'Current Term'}

Please check your UniOne account for the complete course schedule and details.

Best regards,
UniOne Team
  `.trim();

  return sendEmail({
    to: user.email,
    subject,
    text,
  });
}

export default {
  sendBulkEmails,
  sendEmail,
  sendAnnouncementEmail,
  sendExamScheduleEmail,
  sendGradePublishedEmail,
  sendWaitlistPromotedEmail,
  sendEnrollmentConfirmationEmail,
};
