// src/services/email.service.js
import nodemailer from 'nodemailer';
import { config } from '../config/env.js';
import { InternalError } from '../utils/AppError.js';

const transporter = nodemailer.createTransport({
  host:   config.email.host,
  port:   config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

export const EmailService = {
  async sendPasswordReset(to, name, resetToken) {
    const resetUrl = `${config.clientUrl}/reset-password?token=${resetToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hi ${name},</p>
        <p>We received a request to reset your SmartExpense password.</p>
        <p>Click the button below to reset it. This link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">
          Reset Password
        </a>
        <p>Or copy this link into your browser:</p>
        <p style="word-break:break-all;color:#6B7280;">${resetUrl}</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>— The SmartExpense Team</p>
      </div>
    `;

    const text = `Hi ${name},\n\nReset your SmartExpense password here (expires in 1 hour):\n${resetUrl}\n\nIf you didn't request this, ignore this email.`;

    try {
      await transporter.sendMail({
        from:    `"SmartExpense" <${config.email.from}>`,
        to,
        subject: 'Reset your SmartExpense password',
        text,
        html,
      });
    } catch (err) {
      console.error('Email delivery failed:', err.message);
      throw InternalError('Failed to send password reset email. Please try again.');
    }
  },
};
