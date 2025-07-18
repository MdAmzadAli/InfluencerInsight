import { storage } from './storage';
import cron from 'node-cron';
import type { ScheduledPost } from '@shared/schema';
import EmailService from './email-service';

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
    const scheduledTime = new Date(post.scheduledDate).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

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

    // Send email notification for scheduled post
    try {
      const user = await storage.getUser(userId);
      if (user && user.email) {
        const emailService = EmailService.getInstance();
        const postContent = `${post.headline}\n\n${post.caption}\n\n${post.hashtags}`;
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
    // Check for posts to notify every minute
    cron.schedule('* * * * *', async () => {
      try {
        const now = new Date();
        const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
        
        // TODO: In a real production app, you'd get all active users
        // For this demo, we'll check if we have any scheduled tasks with user info
        // and also handle the dynamic user system
        
        console.log(`🔍 Notification scheduler checking at ${now.toLocaleTimeString()}`);
        
        // Check existing scheduled tasks for ones that are ready
        for (const [postId, task] of this.scheduledTasks.entries()) {
          if (task.userId && task.scheduledDate <= now) {
            // This task should have already fired, but let's double check
            const scheduledPosts = await storage.getUserScheduledPosts(task.userId);
            const post = scheduledPosts.find(p => p.id === postId);
            
            if (post && post.status === 'scheduled') {
              console.log(`⚠️ Found overdue post ${postId} for user ${task.userId}, firing notification now`);
              
              // Fire the notification immediately
              try {
                task.destroy(); // Clear the timeout
                this.scheduledTasks.delete(postId);
                
                // Send the notification
                console.log('\n🚨 POST PUBLISHING REMINDER (OVERDUE)');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log(`👤 User: ${task.userId}`);
                console.log(`⏰ Was scheduled for: ${task.scheduledDate.toLocaleString()}`);
                console.log(`📝 Headline: "${post.headline}"`);
                console.log(`📄 Caption: ${post.caption}`);
                console.log(`🏷️  Hashtags: ${post.hashtags}`);
                if (post.ideas) {
                  console.log(`💡 Strategy: ${post.ideas}`);
                }
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
                
                // Update post status
                await storage.updateScheduledPost(postId, { status: 'reminded' });
              } catch (error) {
                console.error('Error handling overdue notification:', error);
              }
            }
          }
        }
        
      } catch (error) {
        console.error('Error in notification scheduler:', error);
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