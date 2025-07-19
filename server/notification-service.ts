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
  async sendImmediateScheduleNotification(userId: string, post: ScheduledPost): Promise<void> {
    // Get user's timezone for proper time display
    const user = await storage.getUser(userId);
    const userTimezone = user?.timezone || 'UTC';
    const scheduledTime = getNotificationTimeDisplay(new Date(post.scheduledDate), userTimezone);

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

    // Send email notification for scheduled post with user's dynamic timezone
    try {
      if (user && user.email) {
        const emailService = EmailService.getInstance();
        // Use the new separate email function with proper formatting
        await emailService.sendPostDueReminder(
          user.email,
          post.headline,
          post.caption,
          post.hashtags,
          post.ideas || '',
          scheduledTime,
          'scheduled' // Status when initially scheduling
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
          
          // Get current post status to check completion
          let currentPost = null;
          try {
            const scheduledPosts = await storage.getUserScheduledPosts(userId);
            currentPost = scheduledPosts.find(p => p.id === postId);
          } catch (dbError) {
            console.log('Database connection issue, using cached post data');
          }
          
          // Use cached post data if database fails
          const post = currentPost || postData;
          
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
            
            // Send email notification with proper timezone and status
            try {
              const emailService = EmailService.getInstance();
              const userTimezone = user.timezone || 'UTC';
              const localScheduledTime = getNotificationTimeDisplay(scheduledDate, userTimezone);
              
              // Check current status for appropriate message
              const postStatus = currentPost?.status || 'scheduled';
              
              await emailService.sendPostDueReminder(
                user.email, 
                post.headline,
                post.caption, 
                post.hashtags,
                post.ideas || '',
                localScheduledTime,
                postStatus
              );
              console.log(`📧 Post reminder email sent to ${user.email}`);
              
              // Update status if post exists in database
              if (currentPost) {
                await storage.updateScheduledPost(postId, { status: 'reminded' });
              }
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
          // No scheduled tasks to check, skip completely
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
                const user = await storage.getUser(task.userId);
                if (user && user.email) {
                  const emailService = EmailService.getInstance();
                  const userTimezone = user.timezone || 'UTC'; // Use user's dynamic timezone
                  const localScheduledTime = getNotificationTimeDisplay(task.scheduledDate, userTimezone);
                  
                  // Use cached post data if available
                  const post = task.postData;
                  if (post) {
                    await emailService.sendPostDueReminder(
                      user.email,
                      post.headline,
                      post.caption,
                      post.hashtags,
                      post.ideas || '',
                      localScheduledTime,
                      'scheduled' // Assume still scheduled since it's overdue
                    );
                    console.log(`📧 Post reminder email sent to ${user.email}`);
                  } else {
                    // Last resort fallback
                    await emailService.sendPostDueReminder(
                      user.email,
                      'Your scheduled post',
                      'Your scheduled Instagram post is ready to publish!',
                      '',
                      '',
                      localScheduledTime,
                      'scheduled'
                    );
                    console.log(`📧 Fallback reminder email sent to ${user.email}`);
                  }
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