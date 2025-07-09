// Enhanced Instagram scraping with multiple methods
import puppeteer from 'puppeteer';
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

export class AdvancedInstagramScraper {
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async scrapeWithPuppeteer(username: string, postLimit: number = 10): Promise<ScrapedProfile> {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();
      
      // Set realistic user agent
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Navigate to Instagram profile
      await page.goto(`https://www.instagram.com/${username}/`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for content to load
      await this.delay(3000);

      // Extract profile data
      const profileData = await page.evaluate(() => {
        // Try to extract from window._sharedData
        const scripts = Array.from(document.querySelectorAll('script'));
        for (const script of scripts) {
          const content = script.innerHTML;
          if (content.includes('window._sharedData')) {
            try {
              const match = content.match(/window\._sharedData\s*=\s*({.*?});/);
              if (match) {
                const sharedData = JSON.parse(match[1]);
                const user = sharedData?.entry_data?.ProfilePage?.[0]?.graphql?.user;
                if (user) {
                  return {
                    username: user.username,
                    followers: user.edge_followed_by?.count || 0,
                    following: user.edge_follow?.count || 0,
                    posts: user.edge_owner_to_timeline_media?.edges || []
                  };
                }
              }
            } catch (e) {
              console.error('Error parsing shared data:', e);
            }
          }
        }
        return null;
      });

      if (!profileData) {
        throw new Error('Could not extract profile data');
      }

      const posts: InstagramPost[] = profileData.posts.slice(0, postLimit).map((edge: any, index: number) => {
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
        followers: profileData.followers,
        following: profileData.following,
        posts
      };

    } catch (error) {
      console.error(`Puppeteer scraping failed for ${username}:`, error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async scrapeWithFetch(username: string, postLimit: number): Promise<ScrapedProfile> {
    try {
      // Try multiple Instagram endpoints with different approaches
      const endpoints = [
        `https://www.instagram.com/${username}/?__a=1`,
        `https://www.instagram.com/${username}/`,
        `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
        `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
        `https://www.instagram.com/${username}/channel/?__a=1`
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
              'Accept-Encoding': 'gzip, deflate, br',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              'Sec-Fetch-Dest': 'document',
              'Sec-Fetch-Mode': 'navigate',
              'Sec-Fetch-Site': 'none',
              'Upgrade-Insecure-Requests': '1'
            }
          });

          if (response.ok) {
            const data = await this.parseInstagramResponse(response, username, postLimit);
            if (data && data.posts.length > 0) {
              return data;
            }
          }
        } catch (error) {
          console.log(`Endpoint ${endpoint} failed:`, error);
          continue;
        }
      }

      throw new Error('All fetch endpoints failed');
    } catch (error) {
      console.error(`Fetch scraping failed for ${username}:`, error);
      throw error;
    }
  }

  private async parseInstagramResponse(response: Response, username: string, postLimit: number): Promise<ScrapedProfile | null> {
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      // Handle JSON response
      const jsonData = await response.json();
      const user = jsonData?.data?.user;
      
      if (user) {
        const posts = (user.edge_owner_to_timeline_media?.edges || []).slice(0, postLimit).map((edge: any, index: number) => {
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
    } else {
      // Handle HTML response
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Extract from script tags
      let profileData = null;
      let posts: InstagramPost[] = [];

      $('script').each((i, elem) => {
        const scriptContent = $(elem).html() || '';
        if (scriptContent.includes('window._sharedData')) {
          try {
            const match = scriptContent.match(/window\._sharedData\s*=\s*({.*?});/);
            if (match) {
              const sharedData = JSON.parse(match[1]);
              const userInfo = sharedData?.entry_data?.ProfilePage?.[0]?.graphql?.user;
              
              if (userInfo) {
                profileData = {
                  username: userInfo.username,
                  followers: userInfo.edge_followed_by?.count || 0,
                  following: userInfo.edge_follow?.count || 0
                };

                const edges = userInfo.edge_owner_to_timeline_media?.edges || [];
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
            // Continue
          }
        }
      });

      if (profileData) {
        return {
          username,
          followers: profileData.followers,
          following: profileData.following,
          posts
        };
      }
    }

    return null;
  }

  async scrapeProfile(username: string, postLimit: number = 10): Promise<ScrapedProfile> {
    console.log(`Attempting to scrape Instagram profile: ${username}`);
    
    try {
      // Skip Puppeteer for now due to system dependency issues, focus on fetch method with enhanced endpoints
      const profile = await this.scrapeWithFetch(username, postLimit);
      if (profile && profile.posts.length > 0) {
        console.log(`Successfully scraped ${profile.posts.length} real posts for @${username}`);
        return profile;
      }

      throw new Error('No posts found with scraping methods');
    } catch (error) {
      console.error(`Real scraping failed for ${username}:`, error);
      throw error;
    }
  }

  async scrapeMultipleProfiles(usernames: string[], postsPerProfile: number = 10): Promise<ScrapedProfile[]> {
    const profiles: ScrapedProfile[] = [];
    
    for (const username of usernames) {
      try {
        console.log(`Scraping profile: ${username}`);
        const profile = await this.scrapeProfile(username, postsPerProfile);
        profiles.push(profile);
        
        // Add delay between requests to avoid rate limiting
        await this.delay(2000);
      } catch (error) {
        console.error(`Failed to scrape profile ${username}:`, error);
        // Don't add mock data - let the AI know this competitor couldn't be scraped
      }
    }

    return profiles;
  }

  async getTopPostsFromCompetitors(usernames: string[], totalPosts: number = 10): Promise<{
    posts: (InstagramPost & { username: string; profileUrl: string })[];
    competitorProfiles: ScrapedProfile[];
  }> {
    console.log(`Extracting top ${totalPosts} posts from competitors: ${usernames.join(', ')}`);
    
    const profiles = await this.scrapeMultipleProfiles(usernames, 10);
    
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

    console.log(`Found ${allPosts.length} total posts, returning top ${topPosts.length}`);

    return {
      posts: topPosts,
      competitorProfiles: profiles
    };
  }
}

export const advancedInstagramScraper = new AdvancedInstagramScraper();