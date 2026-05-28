import nodemailer from 'nodemailer';

class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
      port: Number(process.env.SMTP_PORT) || 2525,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });
  }

  async sendEmail(options: { to: string; subject: string; text: string; html?: string }) {
    const mailOptions = {
      from: `esparkPM <${process.env.SMTP_FROM || 'noreply@esparkpm.com'}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${options.to}`);
    } catch (err) {
      console.error('Email sending failed:', err);
    }
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${token}`;
    const message = `You are receiving this email because you (or someone else) have requested the reset of a password. Please click on the link to complete the process:\n\n${resetUrl}\n\nThis link is valid for 10 minutes.`;

    await this.sendEmail({
      to: email,
      subject: 'esparkPM Password Reset Request',
      text: message,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>Password Reset Request</h2>
          <p>You requested a password reset for your esparkPM account. Click the button below to set a new password:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #2563EB; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 15px 0;">Reset Password</a>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>This link will expire in 10 minutes.</p>
        </div>
      `
    });
  }

  async sendWelcomeEmail(email: string, name: string, tempPass: string) {
    const loginUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`;
    await this.sendEmail({
      to: email,
      subject: 'Welcome to esparkPM!',
      text: `Hello ${name},\n\nYour account has been created on esparkPM.\n\nLogin URL: ${loginUrl}\nTemporary Password: ${tempPass}\n\nPlease change your password upon logging in.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>Welcome to esparkPM, ${name}!</h2>
          <p>An administrator has created an account for you on the esparkPM platform.</p>
          <p><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
          <p><strong>Temporary Password:</strong> <code>${tempPass}</code></p>
          <p style="color: #D97706; font-weight: bold;">For security reasons, please change your password immediately after logging in.</p>
        </div>
      `
    });
  }
}

export default new EmailService();
