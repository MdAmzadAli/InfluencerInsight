import { User, ContentIdea, ScheduledPost, IndianHoliday } from '@prisma/client';

// Export Prisma types
export type { User, ContentIdea, ScheduledPost, IndianHoliday };

// Custom insert types for forms and API
export type InsertUser = {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  niche?: string | null;
  competitors?: string | null;
};

export type InsertContentIdea = {
  userId: string;
  headline: string;
  caption: string;
  hashtags: string;
  ideas: string;
  generationType: string;
  isSaved?: boolean;
};

export type InsertScheduledPost = {
  userId: string;
  contentIdeaId?: number | null;
  headline: string;
  caption: string;
  hashtags: string;
  ideas?: string | null;
  scheduledDate: Date;
  isCustom?: boolean;
  status?: string;
};

export type InsertIndianHoliday = {
  name: string;
  date: Date;
  description?: string | null;
  category?: string | null;
};