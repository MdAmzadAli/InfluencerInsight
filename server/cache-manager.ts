// Temporary in-memory cache for competitor posts
// This will be replaced with database caching once Prisma is properly configured

interface CachedPost {
  id: string;
  shortCode: string;
  username: string;
  ownerUsername: string;
  ownerFullName: string;
  caption?: string;
  hashtags?: string[];
  likes: number;
  comments: number;
  likesCount: number;
  commentsCount: number;
  imageUrl?: string;
  displayUrl?: string;
  imageUrls?: string[];
  postUrl: string;
  url: string;
  profileUrl: string;
  timestamp: Date | string;
  engagement: number;
  location?: string;
  locationName?: string;
  type?: string;
}

interface UserCache {
  posts: CachedPost[];
  expiresAt: Date;
}

class CompetitorPostCacheManager {
  private cache = new Map<string, UserCache>();
  private trendingCache = new Map<string, UserCache>(); // Cache for trending posts by niche
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

  async getCachedPosts(userId: string): Promise<CachedPost[]> {
    const userCache = this.cache.get(userId);
    
    if (!userCache) {
      return [];
    }
    
    // Check if cache is expired
    if (new Date() > userCache.expiresAt) {
      this.cache.delete(userId);
      return [];
    }
    
    return userCache.posts;
  }

  async setCachedPosts(userId: string, posts: any[]): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.CACHE_DURATION);
    
    // Convert raw posts to cached format - preserve ALL fields for consistency
    const cachedPosts: CachedPost[] = posts.map(post => ({
      id: post.id || post.shortCode,
      shortCode: post.shortCode || post.id,
      username: post.ownerUsername || post.username,
      ownerUsername: post.ownerUsername || post.username,
      ownerFullName: post.ownerFullName || '',
      caption: post.caption || '',
      hashtags: post.hashtags || [],
      likes: post.likesCount || post.likes || 0,
      comments: post.commentsCount || post.comments || 0,
      likesCount: post.likesCount || post.likes || 0,
      commentsCount: post.commentsCount || post.comments || 0,
      imageUrl: post.displayUrl || post.imageUrl,
      displayUrl: post.displayUrl || post.imageUrl,
      imageUrls: post.imageUrls || (post.displayUrl ? [post.displayUrl] : []),
      postUrl: post.url || post.postUrl,
      url: post.url || post.postUrl,
      profileUrl: `https://instagram.com/${post.ownerUsername || post.username}`,
      timestamp: post.timestamp || new Date().toISOString(),
      engagement: (post.likesCount || post.likes || 0) + (post.commentsCount || post.comments || 0),
      location: post.locationName || post.location,
      locationName: post.locationName || post.location,
      type: post.type || 'Image'
    }));
    
    this.cache.set(userId, {
      posts: cachedPosts,
      expiresAt
    });
    
    console.log(`✅ Cached ${cachedPosts.length} competitor posts for user ${userId}, expires in 1 hour at ${expiresAt.toISOString()}`);
    console.log(`📋 Sample cached post:`, {
      id: cachedPosts[0]?.id,
      username: cachedPosts[0]?.ownerUsername,
      url: cachedPosts[0]?.url,
      shortCode: cachedPosts[0]?.shortCode
    });
  }

  async clearExpiredCache(): Promise<void> {
    const now = new Date();
    const expiredUsers: string[] = [];
    
    for (const [userId, userCache] of this.cache.entries()) {
      if (now > userCache.expiresAt) {
        expiredUsers.push(userId);
      }
    }
    
    expiredUsers.forEach(userId => {
      this.cache.delete(userId);
      console.log(`🗑️ Cleared expired cache for user ${userId}`);
    });
  }

  // Trending posts cache methods
  async getCachedTrendingPosts(niche: string): Promise<CachedPost[]> {
    const trendingCache = this.trendingCache.get(niche);
    
    if (!trendingCache) {
      return [];
    }
    
    // Check if cache is expired
    if (new Date() > trendingCache.expiresAt) {
      this.trendingCache.delete(niche);
      return [];
    }
    
    return trendingCache.posts;
  }

  async setCachedTrendingPosts(niche: string, posts: any[]): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.CACHE_DURATION);
    
    // Convert raw posts to cached format - preserve ALL fields for consistency
    const cachedPosts: CachedPost[] = posts.map(post => ({
      id: post.id || post.shortCode,
      shortCode: post.shortCode || post.id,
      username: post.ownerUsername || post.username,
      ownerUsername: post.ownerUsername || post.username,
      ownerFullName: post.ownerFullName || '',
      caption: post.caption || '',
      hashtags: post.hashtags || [],
      likes: post.likesCount || post.likes || 0,
      comments: post.commentsCount || post.comments || 0,
      likesCount: post.likesCount || post.likes || 0,
      commentsCount: post.commentsCount || post.comments || 0,
      imageUrl: post.displayUrl || post.imageUrl,
      displayUrl: post.displayUrl || post.imageUrl,
      imageUrls: post.imageUrls || (post.displayUrl ? [post.displayUrl] : []),
      postUrl: post.url || post.postUrl,
      url: post.url || post.postUrl,
      profileUrl: `https://instagram.com/${post.ownerUsername || post.username}`,
      timestamp: post.timestamp || new Date().toISOString(),
      engagement: (post.likesCount || post.likes || 0) + (post.commentsCount || post.comments || 0),
      location: post.locationName || post.location,
      locationName: post.locationName || post.location,
      type: post.type || 'Image'
    }));
    
    this.trendingCache.set(niche, {
      posts: cachedPosts,
      expiresAt
    });
    
    console.log(`✅ Cached ${cachedPosts.length} trending posts for niche "${niche}", expires in 1 hour at ${expiresAt.toISOString()}`);
  }

  async clearExpiredTrendingCache(): Promise<void> {
    const now = new Date();
    const expiredNiches: string[] = [];
    
    for (const [niche, cache] of this.trendingCache.entries()) {
      if (now > cache.expiresAt) {
        expiredNiches.push(niche);
      }
    }
    
    for (const niche of expiredNiches) {
      this.trendingCache.delete(niche);
      console.log(`🗑️ Cleared expired trending cache for niche: ${niche}`);
    }
  }

  // Method to get cache statistics
  getCacheStats(): { totalUsers: number; totalPosts: number; trendingNiches: number; totalTrendingPosts: number } {
    let totalPosts = 0;
    let totalTrendingPosts = 0;
    
    for (const userCache of this.cache.values()) {
      totalPosts += userCache.posts.length;
    }
    
    for (const trendingCache of this.trendingCache.values()) {
      totalTrendingPosts += trendingCache.posts.length;
    }
    
    return {
      totalUsers: this.cache.size,
      totalPosts,
      trendingNiches: this.trendingCache.size,
      totalTrendingPosts
    };
  }
}

export const competitorPostCache = new CompetitorPostCacheManager();

// Clear expired cache every hour
setInterval(() => {
  competitorPostCache.clearExpiredCache();
  competitorPostCache.clearExpiredTrendingCache();
}, 60 * 60 * 1000); // 1 hour