import puppeteer from "puppeteer";
import * as cheerio from "cheerio";

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

export class InstagramScraper {
  private browser: any = null;

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
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
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async scrapeProfile(username: string, postLimit: number = 10): Promise<ScrapedProfile> {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      // Set user agent to avoid detection
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      );

      // Navigate to Instagram profile
      const profileUrl = `https://www.instagram.com/${username}/`;
      await page.goto(profileUrl, { waitUntil: 'networkidle0', timeout: 30000 });

      // Wait for content to load
      await page.waitForSelector('article', { timeout: 15000 });

      // Extract profile data
      const profileData = await page.evaluate(() => {
        // Get follower/following counts
        const metaLinks = document.querySelectorAll('a[href*="/followers/"], a[href*="/following/"]');
        let followers = 0;
        let following = 0;

        metaLinks.forEach(link => {
          const text = link.textContent || '';
          const number = parseInt(text.replace(/[^0-9]/g, '')) || 0;
          if (link.getAttribute('href')?.includes('/followers/')) {
            followers = number;
          } else if (link.getAttribute('href')?.includes('/following/')) {
            following = number;
          }
        });

        return { followers, following };
      });

      // Get post links
      const postLinks = await page.evaluate((limit) => {
        const posts = document.querySelectorAll('article a[href*="/p/"]');
        const links: string[] = [];
        
        for (let i = 0; i < Math.min(posts.length, limit); i++) {
          const href = posts[i].getAttribute('href');
          if (href) {
            links.push(`https://www.instagram.com${href}`);
          }
        }
        
        return links;
      }, postLimit);

      // Scrape individual posts
      const posts: InstagramPost[] = [];
      
      for (const postUrl of postLinks.slice(0, postLimit)) {
        try {
          const post = await this.scrapePost(page, postUrl);
          if (post) {
            posts.push(post);
          }
        } catch (error) {
          console.error(`Error scraping post ${postUrl}:`, error);
          // Continue with next post
        }
      }

      return {
        username,
        followers: profileData.followers,
        following: profileData.following,
        posts
      };

    } catch (error) {
      console.error(`Error scraping Instagram profile ${username}:`, error);
      throw new Error(`Failed to scrape Instagram profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      await page.close();
    }
  }

  private async scrapePost(page: any, postUrl: string): Promise<InstagramPost | null> {
    try {
      await page.goto(postUrl, { waitUntil: 'networkidle0', timeout: 15000 });
      await page.waitForSelector('article', { timeout: 10000 });

      const postData = await page.evaluate((url: string) => {
        const article = document.querySelector('article');
        if (!article) return null;

        // Extract caption
        const captionElement = article.querySelector('[data-testid="post-caption"] span, meta[property="og:description"]');
        const caption = captionElement?.textContent || 
                      document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';

        // Extract hashtags from caption
        const hashtags = caption.match(/#[a-zA-Z0-9_]+/g) || [];

        // Extract engagement metrics
        const likesElement = article.querySelector('span[data-testid="like-count"], span:contains("likes")');
        const likesText = likesElement?.textContent || '0';
        const likes = parseInt(likesText.replace(/[^0-9]/g, '')) || 0;

        // Extract comments count
        const commentsElement = article.querySelector('span[data-testid="comments-count"]');
        const commentsText = commentsElement?.textContent || '0';
        const comments = parseInt(commentsText.replace(/[^0-9]/g, '')) || 0;

        // Extract media URLs
        const imageElement = article.querySelector('img[src*="instagram"]');
        const videoElement = article.querySelector('video[src]');
        
        const imageUrl = imageElement?.getAttribute('src') || undefined;
        const videoUrl = videoElement?.getAttribute('src') || undefined;

        // Extract post ID from URL
        const postId = url.match(/\/p\/([^\/]+)/)?.[1] || '';

        return {
          id: postId,
          caption: caption.replace(/#[a-zA-Z0-9_]+/g, '').trim(),
          hashtags,
          likes,
          comments,
          imageUrl,
          videoUrl,
          postUrl: url,
          timestamp: new Date() // Instagram doesn't easily expose exact timestamps
        };
      }, postUrl);

      return postData;
    } catch (error) {
      console.error(`Error scraping individual post ${postUrl}:`, error);
      return null;
    }
  }

  async scrapeMultipleProfiles(usernames: string[], postsPerProfile: number = 10): Promise<ScrapedProfile[]> {
    const profiles: ScrapedProfile[] = [];
    
    for (const username of usernames) {
      try {
        const profile = await this.scrapeProfile(username, postsPerProfile);
        profiles.push(profile);
        
        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Failed to scrape profile ${username}:`, error);
        // Continue with next profile
      }
    }

    await this.closeBrowser();
    return profiles;
  }

  // Alternative method using public APIs (faster but less detailed)
  async getBasicProfileInfo(username: string): Promise<Partial<ScrapedProfile>> {
    try {
      // This is a fallback method that tries to get basic info without full scraping
      const response = await fetch(`https://www.instagram.com/${username}/?__a=1`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const user = data.graphql?.user;
        
        if (user) {
          return {
            username: user.username,
            followers: user.edge_followed_by?.count || 0,
            following: user.edge_follow?.count || 0,
            posts: [] // Would need additional API calls for posts
          };
        }
      }
    } catch (error) {
      console.log(`Basic API method failed for ${username}, will use full scraping`);
    }

    // Fallback to full scraping
    return this.scrapeProfile(username, 5);
  }
}

export const instagramScraper = new InstagramScraper();