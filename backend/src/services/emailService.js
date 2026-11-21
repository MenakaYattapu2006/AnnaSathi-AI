// Brevo Transactional Email & OTP Delivery Service
import * as brevo from '@getbrevo/brevo';
import { config } from '../config/index.js';

let apiInstance = null;

if (config.brevo.apiKey) {
  apiInstance = new brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, config.brevo.apiKey);
} else {
  console.warn('⚠️  BREVO_API_KEY is not configured. Transactional emails will be simulated in the console.');
}

/**
 * Send a six-digit verification OTP email to a user.
 * @param {string} toEmail - Recipient email
 * @param {string} otp - Plaintext 6-digit OTP (transient, only exists during transmission)
 * @param {'register' | 'login' | 'reset_password'} purpose
 */
export async function sendOtpEmail(toEmail, otp, purpose = 'login') {
  const subjectMap = {
    register: 'AnnaSathi AI - Verify Your Account Registration',
    login: 'AnnaSathi AI - Your Login Verification Code',
    reset_password: 'AnnaSathi AI - Password Reset Code',
  };

  const subject = subjectMap[purpose] || 'AnnaSathi AI Security Verification Code';

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #166534; margin-top: 0;">AnnaSathi AI</h2>
      <p style="color: #475569; font-size: 16px;">Hello,</p>
      <p style="color: #475569; font-size: 15px;">Your one-time security verification code is:</p>
      <div style="background-color: #f0fdf4; border: 1px dashed #22c55e; border-radius: 6px; padding: 16px; text-align: center; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #15803d; font-family: monospace;">${otp}</span>
      </div>
      <p style="color: #64748b; font-size: 13px;">This code expires in <strong>10 minutes</strong>. If you did not request this action on AnnaSathi AI, please disregard this email.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 11px;">AnnaSathi AI – Food Donation & Hunger Prevention Network.</p>
    </div>
  `;

  if (apiInstance && config.brevo.apiKey) {
    try {
      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = htmlContent;
      sendSmtpEmail.sender = {
        name: config.brevo.senderName,
        email: config.brevo.senderEmail,
      };
      sendSmtpEmail.to = [{ email: toEmail }];

      const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
      const messageId = data?.body?.messageId || data?.messageId;
      return { success: true, messageId };
    } catch (err) {
      console.error('Brevo API delivery error:', err?.response?.body || err.message);
      // In development fallback to console logging so local workflows don't stall
      if (!config.isProduction) {
        console.log(`[DEV EMAIL SIMULATOR] To: ${toEmail} | Subject: ${subject} | Code: ${otp}`);
        return { success: true, simulated: true };
      }
      throw new Error(`Failed to deliver OTP via Brevo: ${err.message}`);
    }
  }

  // Development/Test simulated output
  console.log(`\n📬 [DEV EMAIL SIMULATOR] To: ${toEmail}`);
  console.log(`   Subject: ${subject}`);
  console.log(`   Verification Code: ${otp} (Valid for 10 min)\n`);
  return { success: true, simulated: true };
}

/**
 * Send arbitrary transactional notification emails (e.g. food accepted, pickup alert).
 */
export async function sendNotificationEmail(toEmail, subject, message) {
  if (apiInstance && config.brevo.apiKey) {
    try {
      const sendSmtpEmail = new brevo.SendSmtpEmail();
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = `
        <div style="font-family: sans-serif; padding: 20px;">
          <h3 style="color: #166534;">AnnaSathi AI Notification</h3>
          <p>${message}</p>
        </div>
      `;
      sendSmtpEmail.sender = {
        name: config.brevo.senderName,
        email: config.brevo.senderEmail,
      };
      sendSmtpEmail.to = [{ email: toEmail }];
      await apiInstance.sendTransacEmail(sendSmtpEmail);
      return { success: true };
    } catch (err) {
      console.error('Brevo notification delivery error:', err.message);
      return { success: false, error: err.message };
    }
  }

  console.log(`[DEV NOTIFICATION EMAIL] To: ${toEmail} | Subject: ${subject} | ${message}`);
  return { success: true, simulated: true };
}
