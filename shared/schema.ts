import { pgTable, text, varchar, timestamp, serial, boolean, date, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  niche: varchar('niche', { length: 100 }),
  competitors: text('competitors'), // JSON string of competitor usernames
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Content Ideas table
export const contentIdeas = pgTable('content_ideas', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  headline: text('headline').notNull(),
  caption: text('caption').notNull(),
  hashtags: text('hashtags').notNull(),
  ideas: text('ideas').notNull(),
  generationType: varchar('generation_type', { length: 50 }).notNull(),
  isSaved: boolean('is_saved').default(false),
  sourceUrl: text('source_url'), // Instagram post URL if from competitor analysis
  createdAt: timestamp('created_at').defaultNow(),
});

// Scheduled Posts table
export const scheduledPosts = pgTable('scheduled_posts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  contentIdeaId: integer('content_idea_id').references(() => contentIdeas.id),
  headline: text('headline').notNull(),
  caption: text('caption').notNull(),
  hashtags: text('hashtags').notNull(),
  ideas: text('ideas'),
  scheduledDate: timestamp('scheduled_date').notNull(),
  status: varchar('status', { length: 20 }).default('TODO'), // TODO, IN_PROGRESS, IN_REVIEW, DONE
  isCustom: boolean('is_custom').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Indian Holidays table
export const indianHolidays = pgTable('indian_holidays', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  date: date('date').notNull(),
  description: text('description'),
  category: varchar('category', { length: 50 }),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  contentIdeas: many(contentIdeas),
  scheduledPosts: many(scheduledPosts),
}));

export const contentIdeasRelations = relations(contentIdeas, ({ one, many }) => ({
  user: one(users, {
    fields: [contentIdeas.userId],
    references: [users.id],
  }),
  scheduledPosts: many(scheduledPosts),
}));

export const scheduledPostsRelations = relations(scheduledPosts, ({ one }) => ({
  user: one(users, {
    fields: [scheduledPosts.userId],
    references: [users.id],
  }),
  contentIdea: one(contentIdeas, {
    fields: [scheduledPosts.contentIdeaId],
    references: [contentIdeas.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type ContentIdea = typeof contentIdeas.$inferSelect;
export type InsertContentIdea = typeof contentIdeas.$inferInsert;
export type ScheduledPost = typeof scheduledPosts.$inferSelect;
export type InsertScheduledPost = typeof scheduledPosts.$inferInsert;
export type IndianHoliday = typeof indianHolidays.$inferSelect;
export type InsertIndianHoliday = typeof indianHolidays.$inferInsert;