import { storage } from './storage';
import cron from 'node-cron';
import type { ScheduledPost } from '@shared/schema';
import EmailService from './email-service';
import { getNotificationTimeDisplay, isTimeToNotify } from './timezone-utils';

export interface NotificationService {
  schedulePostNotification(postId: number, scheduledDate: Date, userId?: string, postData?: any): void;
  sendImmediateScheduleNotification(userId: string, post: ScheduledPost): Promise<void>;
  startNotificationScheduler(): void;
  stopNotificationScheduler(): void;
}

class BasicNotificationService implements NotificationService {
  private scheduledTasks: Map<number, any> = new Map();

  // Send immediate notification when a post is scheduled
  async sendImmediateScheduleNotification(userId: string, post: ScheduledPost, userInputTime?: string): Promise<void> {
    // Get user for email
    const user = await storage.getUser(userId);
    // Use the exact time user entered, or fall back to converted time
    const scheduledTime = userInputTime || getNotificationTimeDisplay(new Date(post.scheduledDate), user?.timezone || 'UTC');

    console.log('\n🔔 POST SCHEDULED NOTIFICATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👤 User: ${userId}`);
    console.log(`📅 Scheduled for: ${scheduledTime}`);
    console.log(`📝 Headline: ${post.headline}`);
    console.log(`📄 Caption: ${post.caption}`);
    console.log(`🏷️  Hashtags: ${post.hashtags}`);
    if (post.ideas) {
      console.log(`💡 Strategy: ${post.ideas}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Send email notification for successful scheduling
    try {
      if (user && user.email) {
        const emailService = EmailService.getInstance();
        // Use the scheduling confirmation email
        await emailService.sendPostScheduledConfirmation(
          user.email,
          post.headline,
          post.caption,
          post.hashtags,
          post.ideas || '',
          scheduledTime
        );
        console.log(`📧 Email notification sent to ${user.email}`);
      }
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }

  schedulePostNotification(postId: number, scheduledDate: Date, userId?: string, postData?: any): void {
    // Cancel existing notification if any
    if (this.scheduledTasks.has(postId)) {
      this.scheduledTasks.get(postId)?.destroy();
      this.scheduledTasks.delete(postId);
    }

    // Schedule new notification
    const now = new Date();
    const timeDiff = scheduledDate.getTime() - now.getTime();
    
    if (timeDiff > 0) {
      const timeoutId = setTimeout(async () => {
        try {
          if (!userId) {
            console.error('No user ID provided for post notification');
            return;
          }
          
          // Get user info for email
          const user = await storage.getUser(userId);
          if (!user) {
            console.error('User not found for notification');
            return;
          }
          
          // Use cached post data to avoid database dependency completely
          const post = postData;
          
          if (post) {
            console.log('\n🚨 POST PUBLISHING REMINDER');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`👤 User: ${userId}`);
            console.log(`⏰ Time to publish: "${post.headline}"`);
            console.log(`📄 Caption: ${post.caption}`);
            console.log(`🏷️  Hashtags: ${post.hashtags}`);
            if (post.ideas) {
              console.log(`💡 Strategy: ${post.ideas}`);
            }
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            
            // Send reminder email notification (don't show time, just message and details)
            try {
              const emailService = EmailService.getInstance();
              
              // Check current status for appropriate message
              const postStatus = 'scheduled'; // Use cached status to avoid database
              
              await emailService.sendPostDueReminder(
                user.email, 
                post.headline,
                post.caption, 
                post.hashtags,
                post.ideas || '',
                '', // Don't show time for reminder emails
                postStatus
              );
              console.log(`📧 Post reminder email sent to ${user.email}`);
            } catch (emailError) {
              console.error('Failed to send post reminder email:', emailError);
            }
          }
        } catch (error) {
          console.error('Error sending post notification:', error);
        }
        
        this.scheduledTasks.delete(postId);
      }, timeDiff);
      
      this.scheduledTasks.set(postId, { 
        destroy: () => clearTimeout(timeoutId),
        userId,
        scheduledDate,
        postData // Store post data to avoid database dependency
      });
    }
  }

  startNotificationScheduler(): void {
    // Check for posts to notify every 5 minutes to reduce database load
    cron.schedule('0 */5 * * * *', async () => {
      try {
        const now = new Date();
        console.log(`🔍 Notification scheduler checking at ${now.toLocaleTimeString()}`);
        
        // Only process scheduled tasks, completely avoid database queries in scheduler
        // to prevent Prisma connection errors
        if (this.scheduledTasks.size === 0) {
          // No scheduled tasks to check, skip completely and don't make any database calls
          return;
        }
        
        // Process only in-memory scheduled tasks without database queries
        for (const [postId, task] of this.scheduledTasks.entries()) {
          if (task.userId && task.scheduledDate <= now) {
            
            // Fire notification without database verification to prevent Prisma errors
            try {
              task.destroy(); // Clear the timeout
              this.scheduledTasks.delete(postId);
              
              // Send the notification
              console.log('\n🚨 POST PUBLISHING REMINDER (OVERDUE)');
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.log(`👤 User: ${task.userId}`);
              console.log(`⏰ Was scheduled for: ${task.scheduledDate.toLocaleString()}`);
              console.log(`📝 Post ID: ${postId}`);
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
              
              // Send email notification with cached data to avoid database errors
              try {
                // Skip user lookup to avoid database connection - use cached data only
                if (task.postData && task.postData.userEmail) {
                  const emailService = EmailService.getInstance();
                  // For reminder emails, don't show time - just message and details
                  
                  const post = task.postData;
                  await emailService.sendPostDueReminder(
                    task.postData.userEmail,
                    post.headline || 'Your scheduled post',
                    post.caption || 'Your scheduled Instagram post is ready to publish!',
                    post.hashtags || '',
                    post.ideas || '',
                    '', // Don't show time for reminder emails
                    'scheduled' // Assume still scheduled since it's overdue
                  );
                  console.log(`📧 Post reminder email sent to ${task.postData.userEmail}`);
                } else {
                  console.log('No cached user data available for email notification');
                }
              } catch (emailError) {
                console.error('Failed to send post reminder email:', emailError);
              }
              
            } catch (error) {
              console.error('Error handling overdue notification:', error);
              // Remove problematic task
              this.scheduledTasks.delete(postId);
            }
          }
        }
        
      } catch (error) {
        console.error('Error in notification scheduler:', error);
        // Continue running despite errors
      }
    });
    
    console.log('📱 Notification scheduler started');
  }

  stopNotificationScheduler(): void {
    // Clear all scheduled tasks
    this.scheduledTasks.forEach(task => task.destroy());
    this.scheduledTasks.clear();
    console.log('📱 Notification scheduler stopped');
  }
}

export const notificationService = new BasicNotificationService();