import { storage } from './storage';
import cron from 'node-cron';
import type { ScheduledPost } from '@shared/schema';
import EmailService from './email-service';
import { getNotificationTimeDisplay, isTimeToNotify } from './timezone-utils';

export interface NotificationService {
  schedulePostNotification(postId: number, scheduledDate: Date, userId?: string): void;
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

    // Send email notification for scheduled post with user's local timezone
    try {
      if (user && user.email) {
        const emailService = EmailService.getInstance();
        const postContent = `${post.headline}\n\n${post.caption}\n\n${post.hashtags}`;
        // Use the properly formatted local time for email display
        await emailService.sendScheduledPostReminder(user.email, postContent, scheduledTime);
        console.log(`📧 Email notification sent to ${user.email}`);
      }
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }

  schedulePostNotification(postId: number, scheduledDate: Date, userId?: string): void {
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
          // Get the specific user's scheduled posts
          if (!userId) {
            console.error('No user ID provided for post notification');
            return;
          }
          
          const scheduledPosts = await storage.getUserScheduledPosts(userId);
          const post = scheduledPosts.find(p => p.id === postId);
          
          if (post && post.status === 'scheduled') {
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
            
            // Send email notification for the reminder
            try {
              const user = await storage.getUser(userId);
              if (user && user.email) {
                const emailService = EmailService.getInstance();
                const userTimezone = user.timezone || 'UTC';
                const localScheduledTime = getNotificationTimeDisplay(new Date(post.scheduledDate), userTimezone);
                const postContent = `${post.headline}\n\n${post.caption}\n\n${post.hashtags}`;
                
                await emailService.sendScheduledPostReminder(user.email, postContent, localScheduledTime);
                console.log(`📧 Post reminder email sent to ${user.email}`);
              }
            } catch (emailError) {
              console.error('Failed to send post reminder email:', emailError);
            }
            
            // Update post status to 'reminded'
            await storage.updateScheduledPost(postId, { status: 'reminded' });
          }
        } catch (error) {
          console.error('Error sending post notification:', error);
        }
        
        this.scheduledTasks.delete(postId);
      }, timeDiff);
      
      this.scheduledTasks.set(postId, { 
        destroy: () => clearTimeout(timeoutId),
        userId,
        scheduledDate 
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
              
              // Send email notification for post publishing reminder
              try {
                const user = await storage.getUser(task.userId);
                if (user && user.email) {
                  const emailService = EmailService.getInstance();
                  const userTimezone = user.timezone || 'UTC';
                  const localScheduledTime = getNotificationTimeDisplay(task.scheduledDate, userTimezone);
                  
                  // Get the actual post content - try to fetch from storage
                  try {
                    const scheduledPosts = await storage.getUserScheduledPosts(task.userId);
                    const post = scheduledPosts.find(p => p.id === postId);
                    
                    if (post) {
                      const postContent = `${post.headline}\n\n${post.caption}\n\n${post.hashtags}`;
                      await emailService.sendScheduledPostReminder(user.email, postContent, localScheduledTime);
                      console.log(`📧 Post reminder email sent to ${user.email}`);
                    } else {
                      // Fallback if post not found
                      await emailService.sendScheduledPostReminder(user.email, 'Your scheduled post is ready to publish!', localScheduledTime);
                      console.log(`📧 Fallback reminder email sent to ${user.email}`);
                    }
                  } catch (dbError) {
                    // If database fails, send a basic reminder
                    console.error('Database error, sending fallback email:', dbError);
                    await emailService.sendScheduledPostReminder(user.email, 'Your scheduled post is ready to publish!', localScheduledTime);
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