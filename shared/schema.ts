import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  niche: text("niche"),
  competitors: text("competitors"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contentIdeas = pgTable("content_ideas", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  headline: text("headline").notNull(),
  caption: text("caption").notNull(),
  hashtags: text("hashtags").notNull(),
  ideas: text("ideas").notNull(),
  generationType: varchar("generation_type", { length: 20 }).notNull(), // 'date', 'competitor', 'trending'
  isSaved: boolean("is_saved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const scheduledPosts = pgTable("scheduled_posts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  contentIdeaId: integer("content_idea_id").references(() => contentIdeas.id),
  headline: text("headline").notNull(),
  caption: text("caption").notNull(),
  hashtags: text("hashtags").notNull(),
  ideas: text("ideas"),
  scheduledDate: timestamp("scheduled_date").notNull(),
  isCustom: boolean("is_custom").default(false),
  status: varchar("status", { length: 20 }).default("scheduled"), // 'scheduled', 'published', 'cancelled'
  createdAt: timestamp("created_at").defaultNow(),
});

export const indianHolidays = pgTable("indian_holidays", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  date: timestamp("date").notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }), // 'religious', 'national', 'cultural'
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertContentIdea = typeof contentIdeas.$inferInsert;
export type ContentIdea = typeof contentIdeas.$inferSelect;

export type InsertScheduledPost = typeof scheduledPosts.$inferInsert;
export type ScheduledPost = typeof scheduledPosts.$inferSelect;

export type InsertIndianHoliday = typeof indianHolidays.$inferInsert;
export type IndianHoliday = typeof indianHolidays.$inferSelect;

export const insertContentIdeaSchema = createInsertSchema(contentIdeas).omit({
  id: true,
  createdAt: true,
});

export const insertScheduledPostSchema = createInsertSchema(scheduledPosts).omit({
  id: true,
  createdAt: true,
}).extend({
  scheduledDate: z.string().transform((str) => new Date(str)),
  contentIdeaId: z.number().optional().nullable(),
});

export const updateUserSchema = createInsertSchema(users).pick({
  niche: true,
  competitors: true,
});
