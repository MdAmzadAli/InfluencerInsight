import { storage } from './storage';
import cron from 'node-cron';

export interface NotificationService {
  schedulePostNotification(postId: number, scheduledDate: Date): void;
  startNotificationScheduler(): void;
  stopNotificationScheduler(): void;
}

class BasicNotificationService implements NotificationService {
  private scheduledTasks: Map<number, any> = new Map();

  schedulePostNotification(postId: number, scheduledDate: Date): void {
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
          const scheduledPosts = await storage.getUserScheduledPosts('demo-user-123');
          const post = scheduledPosts.find(p => p.id === postId);
          
          if (post && post.status === 'scheduled') {
            console.log(`🔔 POST REMINDER: It's time to post "${post.headline}"!`);
            console.log(`Caption: ${post.caption.substring(0, 100)}...`);
            console.log(`Hashtags: ${post.hashtags}`);
            
            // Update post status to 'reminded'
            await storage.updateScheduledPost(postId, { status: 'reminded' });
          }
        } catch (error) {
          console.error('Error sending post notification:', error);
        }
        
        this.scheduledTasks.delete(postId);
      }, timeDiff);
      
      this.scheduledTasks.set(postId, { destroy: () => clearTimeout(timeoutId) });
    }
  }

  startNotificationScheduler(): void {
    // Check for posts to notify every minute
    cron.schedule('* * * * *', async () => {
      try {
        const now = new Date();
        const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
        
        // Get all scheduled posts (this is a simplified version for demo)
        const scheduledPosts = await storage.getUserScheduledPosts('demo-user-123');
        
        for (const post of scheduledPosts) {
          if (post.status === 'scheduled' && 
              post.scheduledDate <= fiveMinutesFromNow && 
              post.scheduledDate > now) {
            
            if (!this.scheduledTasks.has(post.id)) {
              this.schedulePostNotification(post.id, post.scheduledDate);
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