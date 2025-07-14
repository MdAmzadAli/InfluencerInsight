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

  warmCacheOnStartup(userId: string): void {
    // Check if already warming for this user
    if (this.warmingStates.has(userId)) {
      return;
    }

    // Start warming process in background without blocking
    setImmediate(async () => {
      try {
        await this.performCacheWarming(userId);
      } catch (error) {
        console.error(`Cache warming failed for user ${userId}:`, error);
        this.cleanup(userId);
      }
    });
  }

  private async performCacheWarming(userId: string): Promise<void> {
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

    // Start warming processes in parallel but non-blocking
    const warmingTasks: Promise<void>[] = [];

    // Warm competitor posts if competitors exist
    if (competitors.length > 0) {
      const cachedCompetitorPosts = await storage.getCachedCompetitorPosts(userId);
      console.log(`🔍 Found ${cachedCompetitorPosts.length} cached competitor posts for ${competitors.length} competitors`);
      
      // Always warm competitor cache to ensure fresh data
      console.log(`🔥 Warming competitor posts cache for ${competitors.length} competitors: ${competitors.join(', ')}`);
      const competitorTask = this.warmCompetitorPostsBackground(state);
      state.promises.competitor = competitorTask;
      warmingTasks.push(competitorTask);
    } else {
      console.log(`⚠️ No competitors found for user ${userId}, skipping competitor cache warming`);
      state.competitorPostsReady = true;
    }

    // Warm trending posts
    const cachedTrendingPosts = await competitorPostCache.getCachedTrendingPosts(niche);
    if (cachedTrendingPosts.length < 10) {
      console.log(`🔥 Warming trending posts cache for niche: ${niche}`);
      const trendingTask = this.warmTrendingPostsBackground(state);
      state.promises.trending = trendingTask;
      warmingTasks.push(trendingTask);
    } else {
      console.log(`✅ Trending posts cache already warmed (${cachedTrendingPosts.length} posts)`);
      state.trendingPostsReady = true;
    }

    // Wait for all warming processes to complete in background
    Promise.all(warmingTasks).then(() => {
      state.isWarming = false;
      console.log(`✅ Cache warming completed for user ${userId}`);
    }).catch((error) => {
      console.error(`Cache warming failed for user ${userId}:`, error);
      state.isWarming = false;
    });
  }

  private async warmCompetitorPostsBackground(state: CacheWarmingState): Promise<void> {
    try {
      if (!apifyScraper || state.competitors.length === 0) {
        console.log('❌ Apify scraper not available or no competitors');
        state.competitorPostsReady = true;
        return;
      }

      console.log(`🚀 Starting competitor scraping for: ${state.competitors.join(', ')}`);
      
      const instagramUrls = apifyScraper.convertUsernamesToUrls(state.competitors);
      console.log(`📱 Instagram URLs: ${instagramUrls.join(', ')}`);
      
      const allPosts = await apifyScraper.scrapeCompetitorProfiles(instagramUrls, 10);
      console.log(`📊 Raw posts fetched: ${allPosts.length}`);
      
      if (allPosts.length === 0) {
        console.log('⚠️ No posts fetched from competitors');
        state.competitorPostsReady = true;
        return;
      }
      
      // Sort by engagement and take top 10
      const sortedPosts = allPosts.sort((a, b) => {
        const engagementA = (a.likesCount || 0) + (a.commentsCount || 0);
        const engagementB = (b.likesCount || 0) + (b.commentsCount || 0);
        return engagementB - engagementA;
      }).slice(0, 10);

      // Cache the posts
      await storage.setCachedCompetitorPosts(state.userId, sortedPosts);
      
      console.log(`✅ Competitor posts cache warmed: ${sortedPosts.length} posts cached from ${state.competitors.join(', ')}`);
      state.competitorPostsReady = true;
    } catch (error) {
      console.error('❌ Error warming competitor posts cache:', error);
      state.competitorPostsReady = true; // Set to true to prevent blocking
    }
  }

  private async warmTrendingPostsBackground(state: CacheWarmingState): Promise<void> {
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

  // Check if specific cache type is ready - returns warming state for that type only
  isCacheReady(userId: string, type: 'competitor' | 'trending'): boolean {
    const state = this.warmingStates.get(userId);
    if (!state) {
      return false; // No warming state means cache not warmed
    }

    if (type === 'competitor') {
      console.log(`🔍 Checking competitor cache status: ${state.competitorPostsReady ? 'READY' : 'NOT READY'}`);
      return state.competitorPostsReady;
    } else if (type === 'trending') {
      console.log(`🔍 Checking trending cache status: ${state.trendingPostsReady ? 'READY' : 'NOT READY'}`);
      return state.trendingPostsReady;
    }

    return false;
  }

  // Check if specific cache type is currently warming
  isCacheWarming(userId: string, type: 'competitor' | 'trending'): boolean {
    const state = this.warmingStates.get(userId);
    if (!state || !state.isWarming) {
      return false;
    }

    if (type === 'competitor') {
      return !state.competitorPostsReady && !!state.promises.competitor;
    } else if (type === 'trending') {
      return !state.trendingPostsReady && !!state.promises.trending;
    }

    return false;
  }

  // Optional: still provide wait functionality but make it time-limited
  async waitForCache(userId: string, type: 'competitor' | 'trending', timeoutMs: number = 5000): Promise<boolean> {
    const state = this.warmingStates.get(userId);
    if (!state) {
      return false; // No warming in progress
    }

    console.log(`⏳ Waiting for ${type} cache (max ${timeoutMs}ms)...`);

    try {
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), timeoutMs);
      });

      let cachePromise: Promise<boolean>;
      
      if (type === 'competitor' && state.promises.competitor) {
        cachePromise = state.promises.competitor.then(() => true).catch(() => false);
      } else if (type === 'trending' && state.promises.trending) {
        cachePromise = state.promises.trending.then(() => true).catch(() => false);
      } else {
        return this.isCacheReady(userId, type);
      }

      const result = await Promise.race([cachePromise, timeoutPromise]);
      console.log(`${result ? '✅' : '⏰'} ${type} cache ${result ? 'ready' : 'timeout'}`);
      return result;
    } catch (error) {
      console.error(`Error waiting for cache: ${error}`);
      return false;
    }
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