import { User, ContentIdea, ScheduledPost, IndianHoliday, Feedback, Rating, AdminOTP, UsageTracking, TokenUsage } from '@prisma/client';

// Export Prisma types
export type { User, ContentIdea, ScheduledPost, IndianHoliday, Feedback, Rating, AdminOTP, UsageTracking, TokenUsage };

// Custom insert types for forms and API
export type InsertUser = {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  niche?: string | null;
  nicheLastChanged?: Date | null;
  competitors?: string | null;
  competitorsLastChanged?: Date | null;
};

export type InsertTokenUsage = {
  userId: string;
  usageDate: Date;
  tokensUsed?: number;
  ideasGenerated?: number;
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

export type RegisterUser = {
  email: string;
  password: string;
  firstName?: string | null;
  lastName?: string | null;
  niche?: string | null;
};

export type LoginUser = {
  email: string;
  password: string;
};

export type UpsertUser = {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
};

export type InsertCompetitorPostCache = {
  userId: string;
  postId: string;
  username: string;
  caption?: string | null;
  hashtags: string[];
  likes: number;
  comments: number;
  imageUrl?: string | null;
  postUrl: string;
  profileUrl: string;
  timestamp: Date;
  engagement: number;
  expiresAt: Date;
};

export type CompetitorPostCache = {
  id: number;
  userId: string;
  postId: string;
  username: string;
  caption?: string | null;
  hashtags: string[];
  likes: number;
  comments: number;
  imageUrl?: string | null;
  postUrl: string;
  profileUrl: string;
  timestamp: Date;
  engagement: number;
  cachedAt: Date;
  expiresAt: Date;
};

export type InsertFeedback = {
  userId?: string;
  email?: string;
  message: string;
  category?: string;
};

export type InsertRating = {
  userId: string;
  rating: number;
  comment?: string;
  context?: string;
};

export type InsertAdminOTP = {
  email: string;
  otp: string;
  expiresAt: Date;
};

export type InsertUsageTracking = {
  userId: string;
  date: Date;
  generationsUsed?: number;
  refineMessagesUsed?: number;
  generationLimit?: number;
  refineMessageLimit?: number;
};