import { competitorPostCache } from './cache-manager.js';
import { apifyScraper } from './apify-scraper.js';
import { storage } from './storage.js';

interface CacheWarmingState {
  isWarming: boolean;
  userId: string;
  competitorPostsReady: boolean;
  trendingPostsReady: boolean;
  niche: string;
  competitors: string[];
  promises: {
    competitor?: Promise<void>;
    trending?: Promise<void>;
  };
}

class CacheWarmer {
  private warmingStates = new Map<string, CacheWarmingState>();

  async warmCacheOnStartup(userId: string): Promise<void> {
    // Check if already warming for this user
    if (this.warmingStates.has(userId)) {
      return;
    }

    const user = await storage.getUser(userId);
    if (!user?.niche) {
      console.log(`❌ User ${userId} has no niche, skipping cache warming`);
      return;
    }

    const niche = user.niche;
    let competitors: string[] = [];
    
    // Parse competitors if they exist
    if (user.competitors) {
      try {
        competitors = typeof user.competitors === 'string' 
          ? (user.competitors.startsWith('[') ? JSON.parse(user.competitors) : user.competitors.split(',').filter(Boolean))
          : Array.isArray(user.competitors) ? user.competitors : JSON.parse(user.competitors);
      } catch (error) {
        console.error('Error parsing competitors:', error);
        competitors = [];
      }
    }

    console.log(`🔥 Starting cache warming for user ${userId}, niche: ${niche}, competitors: ${competitors.length}`);

    // Initialize warming state
    const state: CacheWarmingState = {
      isWarming: true,
      userId,
      competitorPostsReady: false,
      trendingPostsReady: false,
      niche,
      competitors,
      promises: {}
    };

    this.warmingStates.set(userId, state);

    // Start warming processes
    const promises: Promise<void>[] = [];

    // Warm competitor posts if competitors exist
    if (competitors.length > 0) {
      const cachedCompetitorPosts = await storage.getCachedCompetitorPosts(userId);
      if (cachedCompetitorPosts.length < 10) {
        console.log(`🔥 Warming competitor posts cache for ${competitors.length} competitors`);
        state.promises.competitor = this.warmCompetitorPosts(state);
        promises.push(state.promises.competitor);
      } else {
        console.log(`✅ Competitor posts cache already warmed (${cachedCompetitorPosts.length} posts)`);
        state.competitorPostsReady = true;
      }
    } else {
      console.log(`⚠️ No competitors found for user ${userId}, skipping competitor cache warming`);
      state.competitorPostsReady = true;
    }

    // Warm trending posts
    const cachedTrendingPosts = await competitorPostCache.getCachedTrendingPosts(niche);
    if (cachedTrendingPosts.length < 10) {
      console.log(`🔥 Warming trending posts cache for niche: ${niche}`);
      state.promises.trending = this.warmTrendingPosts(state);
      promises.push(state.promises.trending);
    } else {
      console.log(`✅ Trending posts cache already warmed (${cachedTrendingPosts.length} posts)`);
      state.trendingPostsReady = true;
    }

    // Wait for all warming processes to complete
    await Promise.all(promises);
    
    state.isWarming = false;
    console.log(`✅ Cache warming completed for user ${userId}`);
  }

  private async warmCompetitorPosts(state: CacheWarmingState): Promise<void> {
    try {
      if (!apifyScraper || state.competitors.length === 0) {
        state.competitorPostsReady = true;
        return;
      }

      const instagramUrls = apifyScraper.convertUsernamesToUrls(state.competitors);
      const allPosts = await apifyScraper.scrapeCompetitorProfiles(instagramUrls, 10);
      
      // Sort by engagement and take top 10
      const sortedPosts = allPosts.sort((a, b) => {
        const engagementA = (a.likesCount || 0) + (a.commentsCount || 0);
        const engagementB = (b.likesCount || 0) + (b.commentsCount || 0);
        return engagementB - engagementA;
      }).slice(0, 10);

      // Cache the posts
      await storage.setCachedCompetitorPosts(state.userId, sortedPosts);
      
      console.log(`✅ Competitor posts cache warmed: ${sortedPosts.length} posts cached`);
      state.competitorPostsReady = true;
    } catch (error) {
      console.error('Error warming competitor posts cache:', error);
      state.competitorPostsReady = true; // Set to true to prevent blocking
    }
  }

  private async warmTrendingPosts(state: CacheWarmingState): Promise<void> {
    try {
      if (!apifyScraper) {
        state.trendingPostsReady = true;
        return;
      }

      const trendingPosts = await apifyScraper.searchTrendingPosts(state.niche, 30);
      await competitorPostCache.setCachedTrendingPosts(state.niche, trendingPosts);
      
      console.log(`✅ Trending posts cache warmed: ${trendingPosts.length} posts cached`);
      state.trendingPostsReady = true;
    } catch (error) {
      console.error('Error warming trending posts cache:', error);
      state.trendingPostsReady = true; // Set to true to prevent blocking
    }
  }

  async waitForCache(userId: string, type: 'competitor' | 'trending'): Promise<void> {
    const state = this.warmingStates.get(userId);
    if (!state) {
      return; // No warming in progress
    }

    console.log(`⏳ Waiting for ${type} cache to be ready...`);

    if (type === 'competitor' && state.promises.competitor) {
      await state.promises.competitor;
    } else if (type === 'trending' && state.promises.trending) {
      await state.promises.trending;
    }

    console.log(`✅ ${type} cache is ready`);
  }

  isWarming(userId: string): boolean {
    const state = this.warmingStates.get(userId);
    return state?.isWarming || false;
  }

  getCacheStatus(userId: string): { competitor: boolean; trending: boolean } {
    const state = this.warmingStates.get(userId);
    return {
      competitor: state?.competitorPostsReady || false,
      trending: state?.trendingPostsReady || false
    };
  }

  cleanup(userId: string): void {
    this.warmingStates.delete(userId);
  }
}

export const cacheWarmer = new CacheWarmer();