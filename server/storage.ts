import { db } from './db';
import { users, contentIdeas, scheduledPosts, indianHolidays } from '../shared/schema';
import { eq, desc, gte, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import type { User, ContentIdea, ScheduledPost, IndianHoliday } from '../shared/schema';

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

export interface InsertContentIdea {
  userId: number;
  headline: string;
  caption: string;
  hashtags: string;
  ideas: string;
  generationType: string;
  isSaved?: boolean;
  sourceUrl?: string;
}

export interface InsertScheduledPost {
  userId: number;
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
  registerUser(user: RegisterUser): Promise<User>;
  loginUser(credentials: LoginUser): Promise<User | null>;
  getUser(id: number): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUserNiche(userId: number, niche: string, competitors?: string): Promise<User>;
  
  // Content Ideas operations
  createContentIdea(idea: InsertContentIdea): Promise<ContentIdea>;
  getUserContentIdeas(userId: number): Promise<ContentIdea[]>;
  getSavedContentIdeas(userId: number): Promise<ContentIdea[]>;
  updateContentIdeaSaved(ideaId: number, isSaved: boolean): Promise<void>;
  
  // Scheduled Posts operations
  createScheduledPost(post: InsertScheduledPost): Promise<ScheduledPost>;
  getUserScheduledPosts(userId: number): Promise<ScheduledPost[]>;
  updateScheduledPost(postId: number, updates: Partial<InsertScheduledPost>): Promise<ScheduledPost>;
  deleteScheduledPost(postId: number): Promise<void>;
  
  // Indian Holidays operations
  getUpcomingHolidays(limit?: number): Promise<IndianHoliday[]>;
  seedHolidays(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async registerUser(userData: RegisterUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const [user] = await db.insert(users).values({
      email: userData.email,
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      niche: userData.niche,
    }).returning();
    
    return user;
  }

  async loginUser(credentials: LoginUser): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, credentials.email));
    
    if (!user) return null;
    
    const isValidPassword = await bcrypt.compare(credentials.password, user.password);
    if (!isValidPassword) return null;
    
    return user;
  }

  async getUser(id: number): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || null;
  }

  async updateUserNiche(userId: number, niche: string, competitors?: string): Promise<User> {
    const [user] = await db.update(users)
      .set({ 
        niche, 
        competitors,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    
    return user;
  }

  // Content Ideas operations
  async createContentIdea(idea: InsertContentIdea): Promise<ContentIdea> {
    const [contentIdea] = await db.insert(contentIdeas).values(idea).returning();
    return contentIdea;
  }

  async getUserContentIdeas(userId: number): Promise<ContentIdea[]> {
    return await db.select().from(contentIdeas)
      .where(eq(contentIdeas.userId, userId))
      .orderBy(desc(contentIdeas.createdAt));
  }

  async getSavedContentIdeas(userId: number): Promise<ContentIdea[]> {
    return await db.select().from(contentIdeas)
      .where(sql`${contentIdeas.userId} = ${userId} AND ${contentIdeas.isSaved} = true`)
      .orderBy(desc(contentIdeas.createdAt));
  }

  async updateContentIdeaSaved(ideaId: number, isSaved: boolean): Promise<void> {
    await db.update(contentIdeas)
      .set({ isSaved })
      .where(eq(contentIdeas.id, ideaId));
  }

  // Scheduled Posts operations
  async createScheduledPost(post: InsertScheduledPost): Promise<ScheduledPost> {
    const [scheduledPost] = await db.insert(scheduledPosts).values(post).returning();
    return scheduledPost;
  }

  async getUserScheduledPosts(userId: number): Promise<ScheduledPost[]> {
    return await db.select().from(scheduledPosts)
      .where(eq(scheduledPosts.userId, userId))
      .orderBy(desc(scheduledPosts.scheduledDate));
  }

  async updateScheduledPost(postId: number, updates: Partial<InsertScheduledPost>): Promise<ScheduledPost> {
    const [scheduledPost] = await db.update(scheduledPosts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(scheduledPosts.id, postId))
      .returning();
    
    return scheduledPost;
  }

  async deleteScheduledPost(postId: number): Promise<void> {
    await db.delete(scheduledPosts).where(eq(scheduledPosts.id, postId));
  }

  // Indian Holidays operations
  async getUpcomingHolidays(limit = 10): Promise<IndianHoliday[]> {
    const now = new Date().toISOString().split('T')[0];
    return await db.select().from(indianHolidays)
      .where(gte(indianHolidays.date, now))
      .orderBy(indianHolidays.date)
      .limit(limit);
  }

  async seedHolidays(): Promise<void> {
    const holidays: InsertIndianHoliday[] = [
      {
        name: "Diwali",
        date: "2024-11-01",
        description: "Festival of Lights",
        category: "religious"
      },
      {
        name: "Holi",
        date: "2025-03-14",
        description: "Festival of Colors",
        category: "religious"
      },
      {
        name: "Independence Day",
        date: "2025-08-15",
        description: "India's Independence Day",
        category: "national"
      },
      {
        name: "Republic Day",
        date: "2025-01-26",
        description: "India's Republic Day",
        category: "national"
      },
      {
        name: "Eid ul-Fitr",
        date: "2025-03-31",
        description: "Festival marking the end of Ramadan",
        category: "religious"
      },
      {
        name: "Christmas",
        date: "2024-12-25",
        description: "Celebration of the birth of Jesus Christ",
        category: "religious"
      },
      {
        name: "Dussehra",
        date: "2024-10-12",
        description: "Victory of good over evil",
        category: "religious"
      },
      {
        name: "Karva Chauth",
        date: "2024-10-20",
        description: "Festival of married women",
        category: "cultural"
      },
      {
        name: "Bhai Dooj",
        date: "2024-11-03",
        description: "Celebration of brother-sister bond",
        category: "cultural"
      },
      {
        name: "Makar Sankranti",
        date: "2025-01-14",
        description: "Harvest festival",
        category: "cultural"
      }
    ];

    // Insert holidays, ignoring duplicates
    try {
      await db.insert(indianHolidays).values(holidays);
    } catch (error) {
      // Ignore duplicate key errors
      console.log('Holidays already seeded');
    }
  }
}

export const storage = new DatabaseStorage();