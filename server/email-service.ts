import { TransactionalEmailsApi, SendSmtpEmail } from '@getbrevo/brevo';

// Initialize Brevo client
let apiInstance: TransactionalEmailsApi;

function initializeBrevoClient() {
  if (!apiInstance) {
    apiInstance = new TransactionalEmailsApi();
    apiInstance.setApiKey(TransactionalEmailsApi.ApiKeyAuth, process.env.BREVO_API_KEY || '');
  }
  return apiInstance;
}

export interface EmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export class EmailService {
  private static instance: EmailService;
  private fromEmail: string;
  private fromName: string;

  private constructor() {
    this.fromEmail = process.env.BREVO_FROM_EMAIL || 'noreply@instageideas.com';
    this.fromName = process.env.BREVO_FROM_NAME || 'InstaGenIdeas';
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!process.env.BREVO_API_KEY) {
        console.warn('Brevo API key not configured. Email not sent.');
        return false;
      }

      const api = initializeBrevoClient();

      const sendSmtpEmail = new SendSmtpEmail();
      sendSmtpEmail.sender = { 
        email: this.fromEmail, 
        name: this.fromName 
      };
      sendSmtpEmail.to = [{ 
        email: options.to 
      }];
      sendSmtpEmail.subject = options.subject;
      sendSmtpEmail.htmlContent = options.htmlContent;
      if (options.textContent) {
        sendSmtpEmail.textContent = options.textContent;
      }

      const response = await api.sendTransacEmail(sendSmtpEmail);
      console.log('Email sent successfully:', JSON.stringify(response));
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
    const subject = 'Welcome to InstaGenIdeas!';
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #e91e63; text-align: center;">Welcome to InstaGenIdeas!</h1>
            <p>Hi ${firstName},</p>
            <p>Welcome to InstaGenIdeas! We're excited to help you create amazing Instagram content with AI-powered tools.</p>
            <h2 style="color: #e91e63;">What you can do:</h2>
            <ul>
              <li>🎯 Generate content ideas based on trending topics</li>
              <li>📊 Analyze your competitors' content</li>
              <li>📅 Schedule your posts</li>
              <li>💡 Get AI-powered content suggestions</li>
            </ul>
            <p>Ready to get started? <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/dashboard" style="color: #e91e63;">Visit your dashboard</a> to begin creating viral content!</p>
            <p>Happy creating!<br>The InstaGenIdeas Team</p>
          </div>
        </body>
      </html>
    `;
    
    const textContent = `
      Hi ${firstName},
      
      Welcome to InstaGenIdeas! We're excited to help you create amazing Instagram content with AI-powered tools.
      
      What you can do:
      - Generate content ideas based on trending topics
      - Analyze your competitors' content  
      - Schedule your posts
      - Get AI-powered content suggestions
      
      Ready to get started? Visit your dashboard to begin creating viral content!
      
      Happy creating!
      The InstaGenIdeas Team
    `;

    return this.sendEmail({
      to: email,
      subject,
      htmlContent,
      textContent
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
    const subject = 'Reset Your InstaGenIdeas Password';
    
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #e91e63; text-align: center;">Reset Your Password</h1>
            <p>You requested a password reset for your InstaGenIdeas account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #e91e63; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p><a href="${resetUrl}" style="color: #e91e63;">${resetUrl}</a></p>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <p>The InstaGenIdeas Team</p>
          </div>
        </body>
      </html>
    `;
    
    const textContent = `
      You requested a password reset for your InstaGenIdeas account.
      
      Click this link to reset your password: ${resetUrl}
      
      This link will expire in 1 hour for security reasons.
      
      If you didn't request this password reset, please ignore this email.
      
      The InstaGenIdeas Team
    `;

    return this.sendEmail({
      to: email,
      subject,
      htmlContent,
      textContent
    });
  }

  async sendOTPEmail(email: string, otp: string): Promise<boolean> {
    const subject = 'Your InstaGenIdeas Verification Code';
    
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #e91e63; text-align: center;">Verify Your Email</h1>
            <p>Welcome to InstaGenIdeas! Please use the verification code below to complete your signup:</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px; display: inline-block;">
                <h2 style="color: #e91e63; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h2>
              </div>
            </div>
            <p>This code will expire in 10 minutes for security reasons.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            <p>The InstaGenIdeas Team</p>
          </div>
        </body>
      </html>
    `;
    
    const textContent = `
      Welcome to InstaGenIdeas!
      
      Your verification code is: ${otp}
      
      This code will expire in 10 minutes for security reasons.
      
      If you didn't request this code, please ignore this email.
      
      The InstaGenIdeas Team
    `;

    return this.sendEmail({
      to: email,
      subject,
      htmlContent,
      textContent
    });
  }

  async sendRegistrationSuccessEmail(email: string, firstName: string): Promise<boolean> {
    const subject = 'Welcome to InstaGenIdeas - Registration Complete!';
    
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #e91e63; text-align: center;">🎉 Registration Complete!</h1>
            <p>Hi ${firstName},</p>
            <p>Congratulations! Your InstaGenIdeas account has been successfully created. You're now ready to start creating amazing Instagram content with AI-powered tools.</p>
            <h2 style="color: #e91e63;">What you can do:</h2>
            <ul>
              <li>🎯 Generate content ideas based on trending topics</li>
              <li>📊 Analyze your competitors' content</li>
              <li>📅 Schedule your posts</li>
              <li>💡 Get AI-powered content suggestions</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/dashboard" style="background-color: #e91e63; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Start Creating Content</a>
            </div>
            <p>Happy creating!<br>The InstaGenIdeas Team</p>
          </div>
        </body>
      </html>
    `;
    
    const textContent = `
      Hi ${firstName},
      
      Congratulations! Your InstaGenIdeas account has been successfully created. You're now ready to start creating amazing Instagram content with AI-powered tools.
      
      What you can do:
      - Generate content ideas based on trending topics
      - Analyze your competitors' content  
      - Schedule your posts
      - Get AI-powered content suggestions
      
      Visit your dashboard to begin creating viral content: ${process.env.FRONTEND_URL || 'http://localhost:5000'}/dashboard
      
      Happy creating!
      The InstaGenIdeas Team
    `;

    return this.sendEmail({
      to: email,
      subject,
      htmlContent,
      textContent
    });
  }

  async sendScheduledPostReminder(email: string, postContent: string, scheduledTime: string): Promise<boolean> {
    const subject = 'Your Scheduled Post is Ready!';
    
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #e91e63; text-align: center;">Your Post is Ready!</h1>
            <p>It's time to publish your scheduled Instagram post!</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #e91e63;">Scheduled for: ${scheduledTime}</h3>
              <p><strong>Content:</strong></p>
              <p>${postContent}</p>
            </div>
            <p>Don't forget to:</p>
            <ul>
              <li>📱 Open Instagram</li>
              <li>📸 Upload your image/video</li>
              <li>📝 Copy and paste your caption</li>
              <li>🚀 Publish your post</li>
            </ul>
            <p>Happy posting!<br>The InstaGenIdeas Team</p>
          </div>
        </body>
      </html>
    `;
    
    const textContent = `
      It's time to publish your scheduled Instagram post!
      
      Scheduled for: ${scheduledTime}
      
      Content:
      ${postContent}
      
      Don't forget to:
      - Open Instagram
      - Upload your image/video
      - Copy and paste your caption
      - Publish your post
      
      Happy posting!
      The InstaGenIdeas Team
    `;

    return this.sendEmail({
      to: email,
      subject,
      htmlContent,
      textContent
    });
  }
}

export default EmailService;