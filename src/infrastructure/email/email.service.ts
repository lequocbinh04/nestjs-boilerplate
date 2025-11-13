import { EnvConfig } from '@config/env.config';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { getPasswordResetEmailTemplate } from './templates/password-reset-email';
import { getVerificationEmailTemplate } from './templates/verification-email';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null;
  private fromEmail: string;

  constructor(private configService: ConfigService<EnvConfig>) {
    const apiKey = this.configService.get('RESEND_API_KEY', { infer: true });
    this.fromEmail =
      this.configService.get('RESEND_FROM_EMAIL', {
        infer: true,
      }) ?? '';

    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY not configured. Email service will not send emails.');
      this.resend = null;
    } else {
      this.resend = new Resend(apiKey);
    }
  }

  async sendVerificationEmail(toEmail: string, verificationToken: string): Promise<void> {
    if (!this.resend) {
      this.logger.warn(`Email sending disabled. Verification email for ${toEmail} not sent.`);
      return;
    }

    try {
      const verificationUrl = `${this.configService.get('APP_URL')}/auth/verify-email?token=${verificationToken}`;
      const html = getVerificationEmailTemplate(verificationUrl);

      await this.resend.emails.send({
        from: this.fromEmail,
        to: toEmail,
        subject: 'Verify Your Email Address',
        html,
      });

      this.logger.log(`Verification email sent to ${toEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${toEmail}:`, error);
      throw error;
    }
  }

  async sendPasswordResetEmail(toEmail: string, resetToken: string): Promise<void> {
    if (!this.resend) {
      this.logger.warn(`Email sending disabled. Password reset email for ${toEmail} not sent.`);
      return;
    }

    try {
      const resetUrl = `${this.configService.get('APP_URL')}/auth/reset-password?token=${resetToken}`;
      const html = getPasswordResetEmailTemplate(resetUrl);

      await this.resend.emails.send({
        from: this.fromEmail,
        to: toEmail,
        subject: 'Reset Your Password',
        html,
      });

      this.logger.log(`Password reset email sent to ${toEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${toEmail}:`, error);
      throw error;
    }
  }
}
