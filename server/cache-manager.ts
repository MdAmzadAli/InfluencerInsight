// Temporary in-memory cache for competitor posts
// This will be replaced with database caching once Prisma is properly configured

interface CachedPost {
  id: string;
  username: string;
  caption?: string;
  hashtags?: string[];
  likes: number;
  comments: number;
  imageUrl?: string;
  postUrl: string;
  profileUrl: string;
  timestamp: Date;
  engagement: number;
}

interface UserCache {
  posts: CachedPost[];
  expiresAt: Date;
}

class CompetitorPostCacheManager {
  private cache = new Map<string, UserCache>();
  private trendingCache = new Map<string, UserCache>(); // Cache for trending posts by niche
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

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
    
    // Convert raw posts to cached format
    const cachedPosts: CachedPost[] = posts.map(post => ({
      id: post.id || post.shortCode,
      username: post.ownerUsername || post.username,
      caption: post.caption || '',
      hashtags: post.hashtags || [],
      likes: post.likesCount || post.likes || 0,
      comments: post.commentsCount || post.comments || 0,
      imageUrl: post.displayUrl || post.imageUrl,
      postUrl: post.url || post.postUrl,
      profileUrl: `https://instagram.com/${post.ownerUsername || post.username}`,
      timestamp: new Date(post.timestamp || Date.now()),
      engagement: (post.likesCount || post.likes || 0) + (post.commentsCount || post.comments || 0)
    }));
    
    this.cache.set(userId, {
      posts: cachedPosts,
      expiresAt
    });
    
    console.log(`✅ Cached ${cachedPosts.length} posts for user ${userId}, expires at ${expiresAt.toISOString()}`);
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
    
    // Convert raw posts to cached format
    const cachedPosts: CachedPost[] = posts.map(post => ({
      id: post.id || post.shortCode,
      username: post.ownerUsername || post.username,
      caption: post.caption || '',
      hashtags: post.hashtags || [],
      likes: post.likesCount || post.likes || 0,
      comments: post.commentsCount || post.comments || 0,
      imageUrl: post.displayUrl || post.imageUrl,
      postUrl: post.url || post.postUrl,
      profileUrl: `https://instagram.com/${post.ownerUsername || post.username}`,
      timestamp: new Date(post.timestamp || Date.now()),
      engagement: (post.likesCount || post.likes || 0) + (post.commentsCount || post.comments || 0)
    }));
    
    this.trendingCache.set(niche, {
      posts: cachedPosts,
      expiresAt
    });
    
    console.log(`✅ Cached ${cachedPosts.length} trending posts for niche "${niche}", expires at ${expiresAt.toISOString()}`);
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