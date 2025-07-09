// Real Instagram scraper using public endpoints and web scraping
import * as cheerio from 'cheerio';

export interface InstagramPost {
  id: string;
  caption: string;
  hashtags: string[];
  likes: number;
  comments: number;
  imageUrl?: string;
  videoUrl?: string;
  postUrl: string;
  timestamp: Date;
}

export interface ScrapedProfile {
  username: string;
  followers: number;
  following: number;
  posts: InstagramPost[];
}

export class RealInstagramScraper {
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getRandomUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0'
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  async scrapeProfile(username: string, postLimit: number = 10): Promise<ScrapedProfile> {
    console.log(`🔍 Real scraping for @${username}`);
    
    const methods = [
      () => this.scrapeViaPublicAPI(username, postLimit),
      () => this.scrapeViaWebpage(username, postLimit),
      () => this.scrapeViaEmbedAPI(username, postLimit)
    ];

    for (let i = 0; i < methods.length; i++) {
      try {
        const result = await methods[i]();
        if (result && result.posts.length > 0) {
          console.log(`✅ Successfully scraped ${result.posts.length} real posts for @${username} using method ${i + 1}`);
          return result;
        }
      } catch (error) {
        console.log(`❌ Method ${i + 1} failed for @${username}:`, error.message);
        if (i < methods.length - 1) {
          await this.delay(1000); // Wait before trying next method
        }
      }
    }

    throw new Error(`All scraping methods failed for @${username}`);
  }

  private async scrapeViaPublicAPI(username: string, postLimit: number): Promise<ScrapedProfile> {
    const response = await fetch(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`, {
      headers: {
        'User-Agent': this.getRandomUserAgent(),
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const user = data?.data?.user;
    
    if (!user) {
      throw new Error('No user data found');
    }

    const posts = (user.edge_owner_to_timeline_media?.edges || [])
      .slice(0, postLimit)
      .map((edge: any, index: number) => {
        const node = edge.node;
        const caption = node.edge_media_to_caption?.edges?.[0]?.node?.text || '';
        const hashtags = caption.match(/#[a-zA-Z0-9_]+/g) || [];
        
        return {
          id: node.id || `post_${index}`,
          caption: caption.replace(/#[a-zA-Z0-9_]+/g, '').trim(),
          hashtags,
          likes: node.edge_media_preview_like?.count || 0,
          comments: node.edge_media_to_comment?.count || 0,
          imageUrl: node.display_url,
          videoUrl: node.is_video ? node.video_url : undefined,
          postUrl: `https://www.instagram.com/p/${node.shortcode}/`,
          timestamp: new Date(node.taken_at_timestamp * 1000)
        };
      });

    return {
      username,
      followers: user.edge_followed_by?.count || 0,
      following: user.edge_follow?.count || 0,
      posts
    };
  }

  private async scrapeViaWebpage(username: string, postLimit: number): Promise<ScrapedProfile> {
    const response = await fetch(`https://www.instagram.com/${username}/`, {
      headers: {
        'User-Agent': this.getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract from script tags containing window._sharedData
    let profileData = null;
    let posts: InstagramPost[] = [];

    $('script').each((i, elem) => {
      const content = $(elem).html() || '';
      
      // Look for window._sharedData
      if (content.includes('window._sharedData')) {
        try {
          const match = content.match(/window\._sharedData\s*=\s*({.*?});/);
          if (match) {
            const sharedData = JSON.parse(match[1]);
            const user = sharedData?.entry_data?.ProfilePage?.[0]?.graphql?.user;
            
            if (user) {
              profileData = {
                username: user.username,
                followers: user.edge_followed_by?.count || 0,
                following: user.edge_follow?.count || 0
              };

              const edges = user.edge_owner_to_timeline_media?.edges || [];
              posts = edges.slice(0, postLimit).map((edge: any, index: number) => {
                const node = edge.node;
                const caption = node.edge_media_to_caption?.edges?.[0]?.node?.text || '';
                const hashtags = caption.match(/#[a-zA-Z0-9_]+/g) || [];
                
                return {
                  id: node.id || `post_${index}`,
                  caption: caption.replace(/#[a-zA-Z0-9_]+/g, '').trim(),
                  hashtags,
                  likes: node.edge_media_preview_like?.count || 0,
                  comments: node.edge_media_to_comment?.count || 0,
                  imageUrl: node.display_url,
                  videoUrl: node.is_video ? node.video_url : undefined,
                  postUrl: `https://www.instagram.com/p/${node.shortcode}/`,
                  timestamp: new Date(node.taken_at_timestamp * 1000)
                };
              });
            }
          }
        } catch (e) {
          // Continue searching
        }
      }
    });

    if (!profileData || posts.length === 0) {
      throw new Error('No profile data extracted from webpage');
    }

    return {
      username,
      followers: profileData.followers,
      following: profileData.following,
      posts
    };
  }

  private async scrapeViaEmbedAPI(username: string, postLimit: number): Promise<ScrapedProfile> {
    // Try to get recent posts via embed endpoint
    const response = await fetch(`https://www.instagram.com/${username}/?__a=1`, {
      headers: {
        'User-Agent': this.getRandomUserAgent(),
        'Accept': 'application/json',
        'X-IG-App-ID': '936619743392459', // Public Instagram app ID
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const user = data?.graphql?.user;
    
    if (!user) {
      throw new Error('No user data in embed response');
    }

    const posts = (user.edge_owner_to_timeline_media?.edges || [])
      .slice(0, postLimit)
      .map((edge: any, index: number) => {
        const node = edge.node;
        const caption = node.edge_media_to_caption?.edges?.[0]?.node?.text || '';
        const hashtags = caption.match(/#[a-zA-Z0-9_]+/g) || [];
        
        return {
          id: node.id || `post_${index}`,
          caption: caption.replace(/#[a-zA-Z0-9_]+/g, '').trim(),
          hashtags,
          likes: node.edge_media_preview_like?.count || 0,
          comments: node.edge_media_to_comment?.count || 0,
          imageUrl: node.display_url,
          videoUrl: node.is_video ? node.video_url : undefined,
          postUrl: `https://www.instagram.com/p/${node.shortcode}/`,
          timestamp: new Date(node.taken_at_timestamp * 1000)
        };
      });

    return {
      username,
      followers: user.edge_followed_by?.count || 0,
      following: user.edge_follow?.count || 0,
      posts
    };
  }

  async scrapeMultipleProfiles(usernames: string[], postsPerProfile: number = 10): Promise<ScrapedProfile[]> {
    const profiles: ScrapedProfile[] = [];
    
    for (const username of usernames) {
      try {
        const profile = await this.scrapeProfile(username, postsPerProfile);
        profiles.push(profile);
        
        // Add delay between requests to avoid rate limiting
        await this.delay(2000);
      } catch (error) {
        console.error(`❌ Failed to scrape real data for ${username}:`, error);
        // Don't add fallback data - we need real data only
      }
    }

    if (profiles.length === 0) {
      throw new Error('No profiles could be scraped with real data');
    }

    return profiles;
  }

  async getTopPostsFromCompetitors(usernames: string[], totalPosts: number = 10): Promise<{
    posts: (InstagramPost & { username: string; profileUrl: string })[];
    competitorProfiles: ScrapedProfile[];
  }> {
    console.log(`🎯 Extracting top ${totalPosts} real posts from: ${usernames.join(', ')}`);
    
    const profiles = await this.scrapeMultipleProfiles(usernames, 10);
    
    if (profiles.length === 0) {
      throw new Error('No real competitor data could be scraped');
    }

    // Combine all posts from all profiles
    const allPosts: (InstagramPost & { username: string; profileUrl: string })[] = [];
    
    profiles.forEach(profile => {
      profile.posts.forEach(post => {
        allPosts.push({
          ...post,
          username: profile.username,
          profileUrl: `https://www.instagram.com/${profile.username}/`
        });
      });
    });

    // Sort by engagement (likes + comments) and take top posts
    const topPosts = allPosts
      .sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments))
      .slice(0, totalPosts);

    console.log(`✅ Found ${allPosts.length} real posts, returning top ${topPosts.length} with highest engagement`);

    return {
      posts: topPosts,
      competitorProfiles: profiles
    };
  }
}

export const realInstagramScraper = new RealInstagramScraper();