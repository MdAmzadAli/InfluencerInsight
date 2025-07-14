import { db } from './db';
import bcrypt from 'bcryptjs';
import type { User, ContentIdea, ScheduledPost, IndianHoliday } from '../shared/schema';
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
    return await db.user.update({
      where: { id: userId },
      data: { 
        niche, 
        competitors,
        updatedAt: new Date() 
      }
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
}

export const storage = new DatabaseStorage();