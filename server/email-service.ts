import { TransactionalEmailsApi, SendSmtpEmail } from '@getbrevo/brevo';

// Initialize Brevo client
let apiInstance: TransactionalEmailsApi;

function initializeBrevoClient() {
  if (!apiInstance) {
    apiInstance = new TransactionalEmailsApi();
    // Set API key using the correct authentication method
    if (process.env.BREVO_API_KEY && apiInstance.authentications.apiKey) {
      apiInstance.authentications.apiKey.apiKey = process.env.BREVO_API_KEY;
    }
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
      
      // Add headers to improve deliverability
      sendSmtpEmail.headers = {
        'X-Mailer': 'InstaGenIdeas-App',
        'X-Priority': '3',
        'List-Unsubscribe': '<mailto:unsubscribe@instageideas.com>'
      };

      const response = await api.sendTransacEmail(sendSmtpEmail);
      console.log('✅ Email sent successfully to:', options.to);
      console.log('📧 Response:', response.messageId || 'Success');
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

  async sendPasswordResetEmail(email: string, resetCode: string): Promise<boolean> {
    const subject = 'Reset Your InstaGenIdeas Password';
    
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Password Reset Request</h2>
            <p>You requested a password reset for your InstaGenIdeas account.</p>
            <p>Please use this verification code to reset your password:</p>
            <div style="text-align: center; margin: 20px 0;">
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; display: inline-block;">
                <h3 style="margin: 0; font-size: 24px; letter-spacing: 3px;">${resetCode}</h3>
              </div>
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <p>The InstaGenIdeas Team</p>
          </div>
        </body>
      </html>
    `;
    
    const textContent = `Password Reset Request

You requested a password reset for your InstaGenIdeas account.

Your reset code is: ${resetCode}

This code will expire in 10 minutes for security reasons.

If you didn't request this password reset, please ignore this email.

Best regards,
The InstaGenIdeas Team`;

    return this.sendEmail({
      to: email,
      subject,
      htmlContent,
      textContent
    });
  }

  async sendOTPEmail(email: string, otp: string): Promise<boolean> {
    const subject = 'Your InstaGenIdeas Verification Code';
    
    // Simplified HTML to reduce spam filtering
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Verify Your Email</h2>
            <p>Welcome to InstaGenIdeas! Please use this verification code to complete your signup:</p>
            <div style="text-align: center; margin: 20px 0;">
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; display: inline-block;">
                <h3 style="margin: 0; font-size: 24px; letter-spacing: 3px;">${otp}</h3>
              </div>
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            <p>Best regards,<br>The InstaGenIdeas Team</p>
          </div>
        </body>
      </html>
    `;
    
    const textContent = `Welcome to InstaGenIdeas!

Your verification code is: ${otp}

This code will expire in 10 minutes for security reasons.

If you didn't request this code, please ignore this email.

Best regards,
The InstaGenIdeas Team`;

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

  async sendPostScheduledConfirmation(email: string, headline: string, caption: string, hashtags: string, ideas: string, scheduledTime: string): Promise<boolean> {
    const subject = '✅ Your Post Has Been Scheduled Successfully!';
    
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4caf50; text-align: center;">🎉 Post Scheduled Successfully!</h1>
            <div style="background-color: #e8f5e8; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #2e7d32;"><strong>Great news!</strong> Your Instagram post has been scheduled successfully!</p>
            </div>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #e91e63; margin-top: 0;">📅 Scheduled for: ${scheduledTime}</h3>
              
              <div style="margin: 15px 0;">
                <h4 style="color: #333; margin-bottom: 5px;">📝 Headline:</h4>
                <p style="background-color: white; padding: 10px; border-radius: 4px; margin: 5px 0;">${headline}</p>
              </div>
              
              <div style="margin: 15px 0;">
                <h4 style="color: #333; margin-bottom: 5px;">📄 Caption:</h4>
                <p style="background-color: white; padding: 10px; border-radius: 4px; margin: 5px 0; white-space: pre-wrap;">${caption}</p>
              </div>
              
              ${hashtags ? `
              <div style="margin: 15px 0;">
                <h4 style="color: #333; margin-bottom: 5px;">🏷️ Hashtags:</h4>
                <p style="background-color: white; padding: 10px; border-radius: 4px; margin: 5px 0; color: #1976d2;">${hashtags}</p>
              </div>
              ` : ''}
              
              ${ideas ? `
              <div style="margin: 15px 0;">
                <h4 style="color: #333; margin-bottom: 5px;">💡 Strategy:</h4>
                <p style="background-color: white; padding: 10px; border-radius: 4px; margin: 5px 0; font-style: italic;">${ideas}</p>
              </div>
              ` : ''}
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0;">
              <h4 style="color: #856404; margin-top: 0;">⏰ What's Next?</h4>
              <p style="color: #856404; margin-bottom: 10px;">We'll send you a reminder when it's time to publish your post!</p>
              <ul style="color: #856404; margin: 5px 0;">
                <li>You'll receive an email reminder at your scheduled time</li>
                <li>The reminder will include all your post details</li>
                <li>Simply copy and paste to Instagram when ready</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #4caf50; font-size: 16px;">📱 Happy posting!</p>
            </div>
            
            <p>Best regards,<br>The InstaGenIdeas Team</p>
          </div>
        </body>
      </html>
    `;
    
    const textContent = `
      🎉 Post Scheduled Successfully!
      
      Great news! Your Instagram post has been scheduled successfully!
      
      Scheduled for: ${scheduledTime}
      
      Headline: ${headline}
      
      Caption: ${caption}
      
      ${hashtags ? `Hashtags: ${hashtags}` : ''}
      
      ${ideas ? `Strategy: ${ideas}` : ''}
      
      ⏰ What's Next?
      We'll send you a reminder when it's time to publish your post!
      
      - You'll receive an email reminder at your scheduled time
      - The reminder will include all your post details  
      - Simply copy and paste to Instagram when ready
      
      📱 Happy posting!
      
      Best regards,
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

  async sendPostDueReminder(email: string, headline: string, caption: string, hashtags: string, ideas: string, scheduledTime: string, postStatus: string): Promise<boolean> {
    // Determine subject and message based on post status
    let subject = '';
    let statusMessage = '';
    let statusColor = '#e91e63';

    switch (postStatus) {
      case 'completed':
      case 'done':
        subject = '🎉 Congratulations! Your scheduled post was published on time!';
        statusMessage = '🎉 <strong>Congratulations!</strong> Your post has been successfully published within the scheduled time!';
        statusColor = '#4caf50';
        break;
      case 'in_progress':
        subject = '⏰ Your scheduled post time has arrived - In Progress';
        statusMessage = '⏰ Your scheduled time has arrived and your post is currently <strong>in progress</strong>.';
        statusColor = '#ff9800';
        break;
      case 'under_review':
        subject = '👀 Your scheduled post time has arrived - Under Review';  
        statusMessage = '👀 Your scheduled time has arrived and your post is currently <strong>under review</strong>.';
        statusColor = '#2196f3';
        break;
      default:
        subject = '🚨 Your scheduled post time has arrived!';
        statusMessage = '🚨 Your scheduled time has arrived but your post is still <strong>not done</strong>. It\'s time to publish!';
        statusColor = '#f44336';
    }
    
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: ${statusColor}; text-align: center;">Post Publishing Reminder</h1>
            <div style="background-color: #f0f8ff; padding: 15px; border-left: 4px solid ${statusColor}; margin: 20px 0;">
              <p style="margin: 0; color: ${statusColor};">${statusMessage}</p>
            </div>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #e91e63; margin-top: 0;">📅 Scheduled for: ${scheduledTime}</h3>
              
              <div style="margin: 15px 0;">
                <h4 style="color: #333; margin-bottom: 5px;">📝 Headline:</h4>
                <p style="background-color: white; padding: 10px; border-radius: 4px; margin: 5px 0;">${headline}</p>
              </div>
              
              <div style="margin: 15px 0;">
                <h4 style="color: #333; margin-bottom: 5px;">📄 Caption:</h4>
                <p style="background-color: white; padding: 10px; border-radius: 4px; margin: 5px 0; white-space: pre-wrap;">${caption}</p>
              </div>
              
              ${hashtags ? `
              <div style="margin: 15px 0;">
                <h4 style="color: #333; margin-bottom: 5px;">🏷️ Hashtags:</h4>
                <p style="background-color: white; padding: 10px; border-radius: 4px; margin: 5px 0; color: #1976d2;">${hashtags}</p>
              </div>
              ` : ''}
              
              ${ideas ? `
              <div style="margin: 15px 0;">
                <h4 style="color: #333; margin-bottom: 5px;">💡 Strategy:</h4>
                <p style="background-color: white; padding: 10px; border-radius: 4px; margin: 5px 0; font-style: italic;">${ideas}</p>
              </div>
              ` : ''}
            </div>
            
            ${postStatus === 'completed' || postStatus === 'done' ? `
              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #4caf50; font-size: 18px; font-weight: bold;">🎊 Well done on maintaining your posting schedule! 🎊</p>
              </div>
            ` : `
              <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0;">
                <h4 style="color: #856404; margin-top: 0;">📋 Next Steps:</h4>
                <ul style="color: #856404;">
                  <li>📱 Open Instagram</li>
                  <li>📸 Upload your image/video</li>
                  <li>📝 Copy and paste your caption</li>
                  <li>🏷️ Add your hashtags</li>
                  <li>🚀 Publish your post</li>
                </ul>
              </div>
            `}
            
            <p>Best regards,<br>The InstaGenIdeas Team</p>
          </div>
        </body>
      </html>
    `;
    
    const textContent = `
      ${statusMessage.replace(/<[^>]*>/g, '')}
      
      Scheduled for: ${scheduledTime}
      
      Headline: ${headline}
      
      Caption: ${caption}
      
      ${hashtags ? `Hashtags: ${hashtags}` : ''}
      
      ${ideas ? `Strategy: ${ideas}` : ''}
      
      ${postStatus === 'completed' || postStatus === 'done' ? 
        'Well done on maintaining your posting schedule!' :
        `Next Steps:
        - Open Instagram
        - Upload your image/video  
        - Copy and paste your caption
        - Add your hashtags
        - Publish your post`
      }
      
      Best regards,
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