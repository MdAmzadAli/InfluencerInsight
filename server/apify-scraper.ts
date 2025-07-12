import axios from 'axios';

export interface ApifyTrendingPost {
  type: string;
  shortCode: string;
  caption: string;
  hashtags: string[];
  mentions: string[];
  position: number;
  url: string;
  commentsCount: number;
  displayUrl: string;
  id: string;
  likesCount: number;
  timestamp: string;
  locationName?: string;
  locationId?: string;
  ownerFullName: string;
  ownerUsername: string;
  ownerId: string;
  captionIsEdited: boolean;
  hasRankedComments: boolean;
  commentsDisabled: boolean;
  displayResourceUrls: string[];
  childPosts: any[];
}

export interface ApifyTrendingResponse {
  topPosts: ApifyTrendingPost[];
}

export interface ApifySearchInput {
  addParentData: boolean;
  enhanceUserSearchWithFacebookPage: boolean;
  isUserReelFeedURL: boolean;
  isUserTaggedFeedURL: boolean;
  onlyPostsNewerThan: string;
  resultsLimit: number;
  resultsType: 'posts' | 'reels' | 'comments';
  search: string;
  searchLimit: number;
  searchType: 'hashtag' | 'user';
}

export class ApifyInstagramScraper {
  private apiToken: string;
  private baseUrl = 'https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items';

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  async searchTrendingPosts(niche: string, limit: number = 10): Promise<ApifyTrendingPost[]> {
    const input: ApifySearchInput = {
      addParentData: false,
      enhanceUserSearchWithFacebookPage: false,
      isUserReelFeedURL: false,
      isUserTaggedFeedURL: false,
      onlyPostsNewerThan: this.getDateDaysAgo(7), // Posts from last 7 days
      resultsLimit: limit,
      resultsType: 'posts',
      search: niche,
      searchLimit: 1,
      searchType: 'hashtag'
    };

    try {
      const response = await axios.post<ApifyTrendingResponse>(
        `${this.baseUrl}?token=${this.apiToken}`,
        input,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      return response.data.topPosts || [];
    } catch (error) {
      console.error('Apify Instagram scraper error:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid Apify API token. Please check your APIFY_API_TOKEN.');
        }
        if (error.response?.status === 429) {
          throw new Error('Apify API rate limit exceeded. Please try again later.');
        }
      }
      throw new Error(`Failed to fetch Instagram data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchUserPosts(username: string, limit: number = 10): Promise<ApifyTrendingPost[]> {
    const input: ApifySearchInput = {
      addParentData: false,
      enhanceUserSearchWithFacebookPage: false,
      isUserReelFeedURL: false,
      isUserTaggedFeedURL: false,
      onlyPostsNewerThan: this.getDateDaysAgo(30), // Posts from last 30 days
      resultsLimit: limit,
      resultsType: 'posts',
      search: username,
      searchLimit: 1,
      searchType: 'user'
    };

    try {
      const response = await axios.post<ApifyTrendingResponse>(
        `${this.baseUrl}?token=${this.apiToken}`,
        input,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      return response.data.topPosts || [];
    } catch (error) {
      console.error('Apify Instagram scraper error:', error);
      throw new Error(`Failed to fetch user posts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchMultipleHashtags(hashtags: string[], limit: number = 5): Promise<ApifyTrendingPost[]> {
    const allPosts: ApifyTrendingPost[] = [];
    
    for (const hashtag of hashtags) {
      try {
        const posts = await this.searchTrendingPosts(hashtag, limit);
        allPosts.push(...posts);
      } catch (error) {
        console.error(`Failed to fetch posts for hashtag ${hashtag}:`, error);
      }
    }

    // Sort by engagement (likes + comments) and remove duplicates
    const uniquePosts = allPosts.filter((post, index, self) => 
      self.findIndex(p => p.id === post.id) === index
    );

    return uniquePosts
      .sort((a, b) => (b.likesCount + b.commentsCount) - (a.likesCount + a.commentsCount))
      .slice(0, limit);
  }

  private getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  // Helper method to extract image URLs from posts
  getPostImages(post: ApifyTrendingPost): string[] {
    const images: string[] = [];
    
    if (post.displayUrl) {
      images.push(post.displayUrl);
    }
    
    if (post.displayResourceUrls && post.displayResourceUrls.length > 0) {
      images.push(...post.displayResourceUrls);
    }
    
    return images;
  }

  // Helper method to format posts for content generation
  formatPostsForAI(posts: ApifyTrendingPost[]): any[] {
    return posts.map(post => ({
      id: post.id,
      username: post.ownerUsername,
      caption: post.caption,
      hashtags: post.hashtags,
      likes: post.likesCount,
      comments: post.commentsCount,
      imageUrls: this.getPostImages(post),
      url: post.url,
      timestamp: post.timestamp,
      engagement: post.likesCount + post.commentsCount,
      location: post.locationName
    }));
  }
}

// Factory function to create scraper instance
export function createApifyScraper(): ApifyInstagramScraper | null {
  const apiToken = process.env.APIFY_API_TOKEN;
  
  if (!apiToken) {
    console.warn('APIFY_API_TOKEN not found in environment variables');
    return null;
  }
  
  return new ApifyInstagramScraper(apiToken);
}

export const apifyScraper = createApifyScraper();