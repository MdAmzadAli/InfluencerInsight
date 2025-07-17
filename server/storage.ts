import { db } from './db';
import bcrypt from 'bcryptjs';
import type { User, ContentIdea, ScheduledPost, IndianHoliday, Feedback, Rating, AdminOTP, UsageTracking, TokenUsage, InsertFeedback, InsertRating, InsertAdminOTP, InsertUsageTracking, InsertTokenUsage } from '../shared/schema';
import { competitorPostCache } from './cache-manager';
import { ApifyTrendingPost } from './apify-scraper';

export interface RegisterUser {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  niche?: string;
}

export interface LoginUser {
  email: string;
  password: string;
}

export interface UpsertUser {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
}

export interface InsertContentIdea {
  userId: string;
  headline: string;
  caption: string;
  hashtags: string;
  ideas: string;
  generationType: string;
  isSaved?: boolean;
  sourceUrl?: string;
}

export interface InsertScheduledPost {
  userId: string;
  contentIdeaId?: number | null;
  headline: string;
  caption: string;
  hashtags: string;
  ideas?: string | null;
  scheduledDate: Date;
  isCustom?: boolean;
  status?: string;
}

export interface InsertIndianHoliday {
  name: string;
  date: string;
  description?: string | null;
  category?: string | null;
}

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUserNiche(userId: string, niche: string, competitors?: string): Promise<User>;
  canChangeCompetitors(userId: string): Promise<{ canChange: boolean; hoursRemaining?: number }>;
  canChangeNiche(userId: string): Promise<{ canChange: boolean; hoursRemaining?: number }>;
  registerUser(user: RegisterUser): Promise<User>;
  loginUser(credentials: LoginUser): Promise<User | null>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Content Ideas operations
  createContentIdea(idea: InsertContentIdea): Promise<ContentIdea>;
  getUserContentIdeas(userId: string): Promise<ContentIdea[]>;
  getSavedContentIdeas(userId: string): Promise<ContentIdea[]>;
  updateContentIdeaSaved(ideaId: number, isSaved: boolean): Promise<void>;
  updateContentIdea(ideaId: number, updates: Partial<InsertContentIdea>): Promise<ContentIdea>;
  
  // Scheduled Posts operations
  createScheduledPost(post: InsertScheduledPost): Promise<ScheduledPost>;
  getUserScheduledPosts(userId: string): Promise<ScheduledPost[]>;
  updateScheduledPost(postId: number, updates: Partial<InsertScheduledPost>): Promise<ScheduledPost>;
  deleteScheduledPost(postId: number): Promise<void>;
  
  // Indian Holidays operations
  getUpcomingHolidays(limit?: number): Promise<IndianHoliday[]>;
  seedHolidays(): Promise<void>;
  
  // Competitor Post Cache operations
  getCachedCompetitorPosts(userId: string): Promise<ApifyTrendingPost[]>;
  setCachedCompetitorPosts(userId: string, posts: ApifyTrendingPost[]): Promise<void>;
  clearExpiredCompetitorPosts(userId: string): Promise<void>;
  
  // Feedback operations
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  getAllFeedback(): Promise<Feedback[]>;
  
  // Rating operations
  createRating(rating: InsertRating): Promise<Rating>;
  getAllRatings(): Promise<Rating[]>;
  
  // Admin OTP operations
  createAdminOTP(otp: InsertAdminOTP): Promise<AdminOTP>;
  verifyAdminOTP(email: string, otp: string): Promise<boolean>;

  // Usage Tracking operations
  getTodayUsage(userId: string): Promise<UsageTracking | null>;
  incrementGenerations(userId: string): Promise<UsageTracking>;
  incrementRefineMessages(userId: string): Promise<UsageTracking>;
  canGenerateContent(userId: string): Promise<{ canGenerate: boolean; remaining: number }>;
  canRefineContent(userId: string): Promise<{ canRefine: boolean; remaining: number }>;
  resetDailyUsage(userId: string): Promise<UsageTracking>;
  
  // Token usage operations
  getUserTokenUsage(userId: string, date?: Date): Promise<TokenUsage | null>;
  canUseTokens(userId: string, tokensNeeded: number): Promise<{ canUse: boolean; tokensRemaining: number; tokensUsed: number; dailyLimit: number }>;
  canGenerateIdeas(userId: string): Promise<{ canGenerate: boolean; ideasRemaining: number; ideasGenerated: number; dailyLimit: number }>;
  trackTokenUsage(userId: string, tokensUsed: number, ideasGenerated?: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | null> {
    return await db.user.findUnique({
      where: { id }
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await db.user.findUnique({
      where: { email }
    });
  }

  async updateUserNiche(userId: string, niche: string, competitors?: string): Promise<User> {
    const user = await db.user.findUnique({
      where: { id: userId }
    });
    
    const updateData: any = { 
      niche, 
      updatedAt: new Date() 
    };
    
    // If competitors are being updated, check 24-hour restriction
    if (competitors !== undefined && competitors !== user?.competitors) {
      const now = new Date();
      const lastChanged = user?.competitorsLastChanged;
      
      if (lastChanged) {
        const hoursSinceLastChange = (now.getTime() - lastChanged.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastChange < 24) {
          const hoursRemaining = Math.ceil(24 - hoursSinceLastChange);
          throw new Error(`You can only change competitors once per 24 hours. Please wait ${hoursRemaining} more hours.`);
        }
      }
      
      updateData.competitors = competitors;
      updateData.competitorsLastChanged = now;
    }
    
    return await db.user.update({
      where: { id: userId },
      data: updateData
    });
  }

  async registerUser(userData: RegisterUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    return await db.user.create({
      data: {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        niche: userData.niche,
        // Note: We don't store passwords in Replit Auth, but keeping for compatibility
      }
    });
  }

  async loginUser(credentials: LoginUser): Promise<User | null> {
    const user = await db.user.findUnique({
      where: { email: credentials.email }
    });
    
    if (!user) return null;
    
    // For compatibility, we'll just return the user if found
    // In a real app, you'd verify the password here
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    return await db.user.upsert({
      where: { id: userData.id },
      update: {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImageUrl: userData.profileImageUrl,
        updatedAt: new Date()
      },
      create: {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImageUrl: userData.profileImageUrl,
      }
    });
  }

  async canChangeCompetitors(userId: string): Promise<{ canChange: boolean; hoursRemaining?: number }> {
    const user = await db.user.findUnique({
      where: { id: userId }
    });
    
    if (!user?.competitorsLastChanged) {
      return { canChange: true };
    }
    
    const now = new Date();
    const hoursSinceLastChange = (now.getTime() - user.competitorsLastChanged.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLastChange >= 24) {
      return { canChange: true };
    }
    
    return { 
      canChange: false, 
      hoursRemaining: Math.ceil(24 - hoursSinceLastChange) 
    };
  }

  async canChangeNiche(userId: string): Promise<{ canChange: boolean; hoursRemaining?: number }> {
    const user = await db.user.findUnique({
      where: { id: userId }
    });
    
    if (!user?.nicheLastChanged) {
      return { canChange: true };
    }
    
    const now = new Date();
    const hoursSinceLastChange = (now.getTime() - user.nicheLastChanged.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLastChange >= 6) {
      return { canChange: true };
    }
    
    return { 
      canChange: false, 
      hoursRemaining: Math.ceil(6 - hoursSinceLastChange) 
    };
  }

  // Content Ideas operations
  async createContentIdea(idea: InsertContentIdea): Promise<ContentIdea> {
    return await db.contentIdea.create({
      data: {
        userId: idea.userId,
        headline: idea.headline,
        caption: idea.caption,
        hashtags: idea.hashtags,
        ideas: idea.ideas,
        generationType: idea.generationType,
        isSaved: idea.isSaved || false,
      }
    });
  }

  async getUserContentIdeas(userId: string): Promise<ContentIdea[]> {
    return await db.contentIdea.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getSavedContentIdeas(userId: string): Promise<ContentIdea[]> {
    return await db.contentIdea.findMany({
      where: { 
        userId,
        isSaved: true 
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateContentIdeaSaved(ideaId: number, isSaved: boolean): Promise<void> {
    await db.contentIdea.update({
      where: { id: ideaId },
      data: { isSaved }
    });
  }

  async updateContentIdea(ideaId: number, updates: Partial<InsertContentIdea>): Promise<ContentIdea> {
    return await db.contentIdea.update({
      where: { id: ideaId },
      data: updates
    });
  }

  // Scheduled Posts operations
  async createScheduledPost(post: InsertScheduledPost): Promise<ScheduledPost> {
    return await db.scheduledPost.create({
      data: {
        userId: post.userId,
        contentIdeaId: post.contentIdeaId ? Number(post.contentIdeaId) : null,
        headline: post.headline,
        caption: post.caption,
        hashtags: post.hashtags,
        ideas: post.ideas,
        scheduledDate: post.scheduledDate,
        isCustom: post.isCustom || false,
        status: post.status || 'scheduled',
      }
    });
  }

  async getUserScheduledPosts(userId: string): Promise<ScheduledPost[]> {
    return await db.scheduledPost.findMany({
      where: { userId },
      orderBy: { scheduledDate: 'asc' }
    });
  }

  async updateScheduledPost(postId: number, updates: Partial<InsertScheduledPost>): Promise<ScheduledPost> {
    return await db.scheduledPost.update({
      where: { id: postId },
      data: updates
    });
  }

  async deleteScheduledPost(postId: number): Promise<void> {
    await db.scheduledPost.delete({
      where: { id: postId }
    });
  }

  // Indian Holidays operations
  async getUpcomingHolidays(limit = 10): Promise<IndianHoliday[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return await db.indianHoliday.findMany({
      where: {
        date: {
          gte: today
        }
      },
      orderBy: { date: 'asc' },
      take: limit
    });
  }

  async seedHolidays(): Promise<void> {
    const holidays = [
      { name: 'Republic Day', date: new Date('2025-01-26'), description: 'National holiday celebrating the adoption of the Constitution of India', category: 'National' },
      { name: 'Holi', date: new Date('2025-03-14'), description: 'Festival of colors', category: 'Religious' },
      { name: 'Independence Day', date: new Date('2025-08-15'), description: 'National holiday celebrating independence from British rule', category: 'National' },
      { name: 'Diwali', date: new Date('2025-10-20'), description: 'Festival of lights', category: 'Religious' },
      { name: 'Dussehra', date: new Date('2025-10-02'), description: 'Victory of good over evil', category: 'Religious' },
      { name: 'Gandhi Jayanti', date: new Date('2025-10-02'), description: 'Birth anniversary of Mahatma Gandhi', category: 'National' },
      { name: 'Eid al-Fitr', date: new Date('2025-03-30'), description: 'Festival marking the end of Ramadan', category: 'Religious' },
      { name: 'Eid al-Adha', date: new Date('2025-06-06'), description: 'Festival of sacrifice', category: 'Religious' },
      { name: 'Christmas', date: new Date('2025-12-25'), description: 'Christian festival celebrating the birth of Jesus Christ', category: 'Religious' },
      { name: 'Karva Chauth', date: new Date('2025-10-13'), description: 'Hindu festival observed by married women', category: 'Religious' },
    ];

    for (const holiday of holidays) {
      const existing = await db.indianHoliday.findFirst({
        where: { name: holiday.name }
      });
      
      if (!existing) {
        await db.indianHoliday.create({
          data: holiday
        });
      }
    }
  }

  // Competitor Post Cache operations
  async getCachedCompetitorPosts(userId: string): Promise<ApifyTrendingPost[]> {
    return await competitorPostCache.getCachedPosts(userId);
  }

  async setCachedCompetitorPosts(userId: string, posts: ApifyTrendingPost[]): Promise<void> {
    await competitorPostCache.setCachedPosts(userId, posts);
  }

  async clearExpiredCompetitorPosts(userId: string): Promise<void> {
    await competitorPostCache.clearExpiredCache();
  }

  // Feedback operations
  async createFeedback(feedback: InsertFeedback): Promise<Feedback> {
    return await db.feedback.create({
      data: feedback
    });
  }

  async getAllFeedback(): Promise<Feedback[]> {
    return await db.feedback.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  // Rating operations
  async createRating(rating: InsertRating): Promise<Rating> {
    return await db.rating.create({
      data: rating
    });
  }

  async getAllRatings(): Promise<Rating[]> {
    return await db.rating.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  // Admin OTP operations
  async createAdminOTP(otp: InsertAdminOTP): Promise<AdminOTP> {
    return await db.adminOTP.create({
      data: otp
    });
  }

  async verifyAdminOTP(email: string, otp: string): Promise<boolean> {
    const record = await db.adminOTP.findFirst({
      where: {
        email,
        otp,
        isUsed: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (record) {
      await db.adminOTP.update({
        where: { id: record.id },
        data: { isUsed: true }
      });
      return true;
    }

    return false;
  }

  // Usage Tracking operations
  async getTodayUsage(userId: string): Promise<UsageTracking | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return await db.usageTracking.findFirst({
      where: {
        userId,
        date: today
      }
    });
  }

  async incrementGenerations(userId: string): Promise<UsageTracking> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return await db.usageTracking.upsert({
      where: {
        userId_date: {
          userId,
          date: today
        }
      },
      create: {
        userId,
        date: today,
        generationsUsed: 1,
        refineMessagesUsed: 0,
        generationLimit: 2,
        refineMessageLimit: 30
      },
      update: {
        generationsUsed: {
          increment: 1
        },
        updatedAt: new Date()
      }
    });
  }

  async incrementRefineMessages(userId: string): Promise<UsageTracking> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return await db.usageTracking.upsert({
      where: {
        userId_date: {
          userId,
          date: today
        }
      },
      create: {
        userId,
        date: today,
        generationsUsed: 0,
        refineMessagesUsed: 1,
        generationLimit: 2,
        refineMessageLimit: 30
      },
      update: {
        refineMessagesUsed: {
          increment: 1
        },
        updatedAt: new Date()
      }
    });
  }

  async canGenerateContent(userId: string): Promise<{ canGenerate: boolean; remaining: number }> {
    const usage = await this.getTodayUsage(userId);
    
    if (!usage) {
      return { canGenerate: true, remaining: 2 };
    }
    
    const remaining = usage.generationLimit - usage.generationsUsed;
    return { 
      canGenerate: remaining > 0, 
      remaining: Math.max(0, remaining) 
    };
  }

  async canRefineContent(userId: string): Promise<{ canRefine: boolean; remaining: number }> {
    const usage = await this.getTodayUsage(userId);
    
    if (!usage) {
      return { canRefine: true, remaining: 30 };
    }
    
    const remaining = usage.refineMessageLimit - usage.refineMessagesUsed;
    return { 
      canRefine: remaining > 0, 
      remaining: Math.max(0, remaining) 
    };
  }

  async resetDailyUsage(userId: string): Promise<UsageTracking> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return await db.usageTracking.upsert({
      where: {
        userId_date: {
          userId,
          date: today
        }
      },
      create: {
        userId,
        date: today,
        generationsUsed: 0,
        refineMessagesUsed: 0,
        generationLimit: 2,
        refineMessageLimit: 30
      },
      update: {
        generationsUsed: 0,
        refineMessagesUsed: 0,
        resetAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  // Token usage operations
  async getUserTokenUsage(userId: string, date?: Date): Promise<TokenUsage | null> {
    const targetDate = date || new Date();
    targetDate.setHours(0, 0, 0, 0);
    
    return await db.tokenUsage.findUnique({
      where: {
        userId_usageDate: {
          userId,
          usageDate: targetDate
        }
      }
    });
  }

  async canUseTokens(userId: string, tokensNeeded: number): Promise<{ canUse: boolean; tokensRemaining: number; tokensUsed: number; dailyLimit: number }> {
    const dailyLimit = 100000; // 100,000 tokens per day (~$0.03 with Gemini 2.5 Flash pricing)
    const usage = await this.getUserTokenUsage(userId);
    
    const tokensUsed = usage?.tokensUsed || 0;
    const tokensRemaining = dailyLimit - tokensUsed;
    
    return {
      canUse: tokensRemaining >= tokensNeeded,
      tokensRemaining,
      tokensUsed,
      dailyLimit
    };
  }

  async canGenerateIdeas(userId: string): Promise<{ canGenerate: boolean; ideasRemaining: number; ideasGenerated: number; dailyLimit: number }> {
    const dailyLimit = 20; // 20 ideas per day
    const usage = await this.getUserTokenUsage(userId);
    
    const ideasGenerated = usage?.ideasGenerated || 0;
    const ideasRemaining = dailyLimit - ideasGenerated;
    
    return {
      canGenerate: ideasRemaining > 0,
      ideasRemaining,
      ideasGenerated,
      dailyLimit
    };
  }

  async trackTokenUsage(userId: string, tokensUsed: number, ideasGenerated?: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    await db.tokenUsage.upsert({
      where: {
        userId_usageDate: {
          userId,
          usageDate: today
        }
      },
      create: {
        userId,
        usageDate: today,
        tokensUsed,
        ideasGenerated: ideasGenerated || 0
      },
      update: {
        tokensUsed: {
          increment: tokensUsed
        },
        ideasGenerated: {
          increment: ideasGenerated || 0
        },
        updatedAt: new Date()
      }
    });
  }
}

export const storage = new DatabaseStorage();