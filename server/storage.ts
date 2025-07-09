import { prisma } from "./db";
import type { 
  User, 
  ContentIdea, 
  ScheduledPost, 
  IndianHoliday 
} from "@prisma/client";

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
  date: Date;
  description?: string | null;
  category?: string | null;
}

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | null>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserNiche(userId: string, niche: string, competitors?: string): Promise<User>;
  
  // Content Ideas operations
  createContentIdea(idea: InsertContentIdea): Promise<ContentIdea>;
  getUserContentIdeas(userId: string): Promise<ContentIdea[]>;
  getSavedContentIdeas(userId: string): Promise<ContentIdea[]>;
  updateContentIdeaSaved(ideaId: number, isSaved: boolean): Promise<void>;
  
  // Scheduled Posts operations
  createScheduledPost(post: InsertScheduledPost): Promise<ScheduledPost>;
  getUserScheduledPosts(userId: string): Promise<ScheduledPost[]>;
  updateScheduledPost(postId: number, updates: Partial<InsertScheduledPost>): Promise<ScheduledPost>;
  deleteScheduledPost(postId: number): Promise<void>;
  
  // Indian Holidays operations
  getUpcomingHolidays(limit?: number): Promise<IndianHoliday[]>;
  seedHolidays(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | null> {
    if (!process.env.DATABASE_URL) {
      throw new Error('Database not initialized. Please check your DATABASE_URL environment variable.');
    }
    
    return await prisma.user.findUnique({
      where: { id }
    });
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (!process.env.DATABASE_URL) {
      throw new Error('Database not initialized. Please check your DATABASE_URL environment variable.');
    }
    
    return await prisma.user.upsert({
      where: { id: userData.id },
      update: {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImageUrl: userData.profileImageUrl,
        updatedAt: new Date(),
      },
      create: userData,
    });
  }

  async updateUserNiche(userId: string, niche: string, competitors?: string): Promise<User> {
    if (!process.env.DATABASE_URL) {
      throw new Error('Database not initialized. Please check your DATABASE_URL environment variable.');
    }
    
    return await prisma.user.update({
      where: { id: userId },
      data: { 
        niche, 
        competitors,
        updatedAt: new Date() 
      }
    });
  }

  // Content Ideas operations
  async createContentIdea(idea: InsertContentIdea): Promise<ContentIdea> {
    if (!process.env.DATABASE_URL) {
      throw new Error('Database not initialized. Please check your DATABASE_URL environment variable.');
    }
    
    return await prisma.contentIdea.create({
      data: idea
    });
  }

  async getUserContentIdeas(userId: string): Promise<ContentIdea[]> {
    if (!process.env.DATABASE_URL) {
      throw new Error('Database not initialized. Please check your DATABASE_URL environment variable.');
    }
    
    return await prisma.contentIdea.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getSavedContentIdeas(userId: string): Promise<ContentIdea[]> {
    if (!process.env.DATABASE_URL) {
      throw new Error('Database not initialized. Please check your DATABASE_URL environment variable.');
    }
    
    return await prisma.contentIdea.findMany({
      where: { 
        userId,
        isSaved: true 
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateContentIdeaSaved(ideaId: number, isSaved: boolean): Promise<void> {
    if (!process.env.DATABASE_URL) {
      throw new Error('Database not initialized. Please check your DATABASE_URL environment variable.');
    }
    
    await prisma.contentIdea.update({
      where: { id: ideaId },
      data: { isSaved }
    });
  }

  // Scheduled Posts operations
  async createScheduledPost(post: InsertScheduledPost): Promise<ScheduledPost> {
    if (!process.env.DATABASE_URL) {
      throw new Error('Database not initialized. Please check your DATABASE_URL environment variable.');
    }
    
    return await prisma.scheduledPost.create({
      data: post
    });
  }

  async getUserScheduledPosts(userId: string): Promise<ScheduledPost[]> {
    if (!process.env.DATABASE_URL) {
      throw new Error('Database not initialized. Please check your DATABASE_URL environment variable.');
    }
    
    return await prisma.scheduledPost.findMany({
      where: { userId },
      orderBy: { scheduledDate: 'desc' }
    });
  }

  async updateScheduledPost(postId: number, updates: Partial<InsertScheduledPost>): Promise<ScheduledPost> {
    if (!process.env.DATABASE_URL) {
      throw new Error('Database not initialized. Please check your DATABASE_URL environment variable.');
    }
    
    return await prisma.scheduledPost.update({
      where: { id: postId },
      data: updates
    });
  }

  async deleteScheduledPost(postId: number): Promise<void> {
    if (!process.env.DATABASE_URL) {
      throw new Error('Database not initialized. Please check your DATABASE_URL environment variable.');
    }
    
    await prisma.scheduledPost.delete({
      where: { id: postId }
    });
  }

  // Indian Holidays operations
  async getUpcomingHolidays(limit = 10): Promise<IndianHoliday[]> {
    if (!process.env.DATABASE_URL) {
      throw new Error('Database not initialized. Please check your DATABASE_URL environment variable.');
    }
    
    const now = new Date();
    return await prisma.indianHoliday.findMany({
      where: {
        date: {
          gte: now
        }
      },
      orderBy: { date: 'asc' },
      take: limit
    });
  }

  async seedHolidays(): Promise<void> {
    if (!process.env.DATABASE_URL) {
      console.warn('Database not initialized - skipping holiday seeding');
      return;
    }
    
    const holidays: InsertIndianHoliday[] = [
      {
        name: "Diwali",
        date: new Date("2024-11-01"),
        description: "Festival of Lights",
        category: "religious"
      },
      {
        name: "Holi",
        date: new Date("2025-03-14"),
        description: "Festival of Colors",
        category: "religious"
      },
      {
        name: "Independence Day",
        date: new Date("2025-08-15"),
        description: "India's Independence Day",
        category: "national"
      },
      {
        name: "Republic Day",
        date: new Date("2025-01-26"),
        description: "India's Republic Day",
        category: "national"
      },
      {
        name: "Eid ul-Fitr",
        date: new Date("2025-03-31"),
        description: "Festival marking the end of Ramadan",
        category: "religious"
      },
      {
        name: "Christmas",
        date: new Date("2024-12-25"),
        description: "Celebration of the birth of Jesus Christ",
        category: "religious"
      },
      {
        name: "Dussehra",
        date: new Date("2024-10-12"),
        description: "Victory of good over evil",
        category: "religious"
      },
      {
        name: "Karva Chauth",
        date: new Date("2024-10-20"),
        description: "Festival of married women",
        category: "cultural"
      },
      {
        name: "Bhai Dooj",
        date: new Date("2024-11-03"),
        description: "Celebration of brother-sister bond",
        category: "cultural"
      },
      {
        name: "Makar Sankranti",
        date: new Date("2025-01-14"),
        description: "Harvest festival",
        category: "cultural"
      }
    ];

    // Use createMany with skipDuplicates to avoid conflicts
    await prisma.indianHoliday.createMany({
      data: holidays,
      skipDuplicates: true
    });
  }
}

export const storage = new DatabaseStorage();