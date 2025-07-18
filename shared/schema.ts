// Define our own types instead of using Prisma
export type User = {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  niche?: string | null;
  nicheLastChanged?: Date | null;
  competitors?: string | null;
  competitorsLastChanged?: Date | null;
  planType: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ContentIdea = {
  id: number;
  userId: string;
  headline: string;
  caption: string;
  hashtags: string;
  ideas: string;
  generationType: string;
  isSaved: boolean;
  createdAt: Date;
};

export type ScheduledPost = {
  id: number;
  userId: string;
  contentIdeaId?: number | null;
  headline: string;
  caption: string;
  hashtags: string;
  ideas?: string | null;
  scheduledDate: Date;
  isCustom: boolean;
  status: string;
  createdAt: Date;
};

export type IndianHoliday = {
  id: number;
  name: string;
  date: Date;
  description?: string | null;
  category?: string | null;
};

export type Feedback = {
  id: number;
  userId?: string | null;
  email?: string | null;
  message: string;
  category?: string | null;
  createdAt: Date;
};

export type Rating = {
  id: number;
  userId: string;
  rating: number;
  comment?: string | null;
  context?: string | null;
  createdAt: Date;
};

export type AdminOTP = {
  id: number;
  email: string;
  otp: string;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
};

export type UsageTracking = {
  id: number;
  userId: string;
  date: Date;
  generationsUsed: number;
  refineMessagesUsed: number;
  generationLimit: number;
  refineMessageLimit: number;
  resetAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type TokenUsage = {
  id: number;
  userId: string;
  usageDate: Date;
  tokensUsed: number;
  ideasGenerated: number;
  createdAt: Date;
  updatedAt: Date;
};

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