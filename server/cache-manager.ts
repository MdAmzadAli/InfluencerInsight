// Temporary in-memory cache for competitor posts
// This will be replaced with database caching once Prisma is properly configured

// Use ApifyTrendingPost as the single interface throughout the system
import { ApifyTrendingPost } from './apify-scraper';

interface UserCache {
  posts: ApifyTrendingPost[];
  expiresAt: Date;
}

class CompetitorPostCacheManager {
  private cache = new Map<string, UserCache>();
  private trendingCache = new Map<string, UserCache>(); // Cache for trending posts by niche
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

  async getCachedPosts(userId: string): Promise<ApifyTrendingPost[]> {
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

  async setCachedPosts(userId: string, posts: ApifyTrendingPost[]): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.CACHE_DURATION);
    
    // No conversion needed - store ApifyTrendingPost directly
    this.cache.set(userId, {
      posts: posts,
      expiresAt
    });
    
    console.log(`✅ Cached ${posts.length} competitor posts for user ${userId}, expires in 1 hour at ${expiresAt.toISOString()}`);
    console.log(`📋 Sample cached post:`, {
      id: posts[0]?.id,
      username: posts[0]?.ownerUsername,
      url: posts[0]?.url,
      shortCode: posts[0]?.shortCode
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
  async getCachedTrendingPosts(niche: string): Promise<ApifyTrendingPost[]> {
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

  async setCachedTrendingPosts(niche: string, posts: ApifyTrendingPost[]): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.CACHE_DURATION);
    
    // No conversion needed - store ApifyTrendingPost directly
    this.trendingCache.set(niche, {
      posts: posts,
      expiresAt
    });
    
    console.log(`✅ Cached ${posts.length} trending posts for niche "${niche}", expires in 1 hour at ${expiresAt.toISOString()}`);
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