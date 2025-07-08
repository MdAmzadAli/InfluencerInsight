import {
  users,
  contentIdeas,
  scheduledPosts,
  indianHolidays,
  type User,
  type UpsertUser,
  type ContentIdea,
  type InsertContentIdea,
  type ScheduledPost,
  type InsertScheduledPost,
  type IndianHoliday,
  type InsertIndianHoliday,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
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
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserNiche(userId: string, niche: string, competitors?: string): Promise<User> {
    const [user] = await db
      .update(users)
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
    const [contentIdea] = await db
      .insert(contentIdeas)
      .values(idea)
      .returning();
    return contentIdea;
  }

  async getUserContentIdeas(userId: string): Promise<ContentIdea[]> {
    return await db
      .select()
      .from(contentIdeas)
      .where(eq(contentIdeas.userId, userId))
      .orderBy(desc(contentIdeas.createdAt));
  }

  async getSavedContentIdeas(userId: string): Promise<ContentIdea[]> {
    return await db
      .select()
      .from(contentIdeas)
      .where(and(eq(contentIdeas.userId, userId), eq(contentIdeas.isSaved, true)))
      .orderBy(desc(contentIdeas.createdAt));
  }

  async updateContentIdeaSaved(ideaId: number, isSaved: boolean): Promise<void> {
    await db
      .update(contentIdeas)
      .set({ isSaved })
      .where(eq(contentIdeas.id, ideaId));
  }

  // Scheduled Posts operations
  async createScheduledPost(post: InsertScheduledPost): Promise<ScheduledPost> {
    // Handle null contentIdeaId
    const postData = {
      ...post,
      contentIdeaId: post.contentIdeaId || undefined
    };
    
    const [scheduledPost] = await db
      .insert(scheduledPosts)
      .values(postData)
      .returning();
    return scheduledPost;
  }

  async getUserScheduledPosts(userId: string): Promise<ScheduledPost[]> {
    return await db
      .select()
      .from(scheduledPosts)
      .where(eq(scheduledPosts.userId, userId))
      .orderBy(desc(scheduledPosts.scheduledDate));
  }

  async updateScheduledPost(postId: number, updates: Partial<InsertScheduledPost>): Promise<ScheduledPost> {
    const [post] = await db
      .update(scheduledPosts)
      .set(updates)
      .where(eq(scheduledPosts.id, postId))
      .returning();
    return post;
  }

  async deleteScheduledPost(postId: number): Promise<void> {
    await db
      .delete(scheduledPosts)
      .where(eq(scheduledPosts.id, postId));
  }

  // Indian Holidays operations
  async getUpcomingHolidays(limit = 10): Promise<IndianHoliday[]> {
    const now = new Date();
    return await db
      .select()
      .from(indianHolidays)
      .where(eq(indianHolidays.date, now)) // This should be gte but keeping simple for now
      .limit(limit);
  }

  async seedHolidays(): Promise<void> {
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

    await db.insert(indianHolidays).values(holidays).onConflictDoNothing();
  }
}

export const storage = new DatabaseStorage();
