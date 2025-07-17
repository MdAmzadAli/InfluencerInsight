import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateToken, generateToken } from "./auth";
import { 
  generateInstagramContentWithGemini, 
  optimizeHashtagsWithGemini, 
  analyzeCompetitorContent,
  refineContentWithGemini,
  refineContentStreamWithGemini,
  generateSinglePostContent
} from "./gemini";
import { apifyScraper, ApifyTrendingPost } from "./apify-scraper";
import { checkDatabaseHealth } from "./db";
import { notificationService } from "./notification-service";
import { competitorPostCache } from "./cache-manager";
import { cacheWarmer } from "./cache-warmer";


export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database and check health
  await checkDatabaseHealth();
  

  
  // Seed holidays
  await storage.seedHolidays();
  
  // Start notification scheduler
  notificationService.startNotificationScheduler();
  
  // User authentication route with cache warming
  app.get('/api/auth/user', authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Start cache warming in background (completely non-blocking)
      cacheWarmer.warmCacheOnStartup(user.id);
      
      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName, niche } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const user = await storage.registerUser({
        email,
        password,
        firstName,
        lastName,
        niche
      });

      const token = generateToken(user.id);
      res.json({ 
        token, 
        user: { 
          id: user.id, 
          email: user.email, 
          firstName: user.firstName, 
          lastName: user.lastName,
          niche: user.niche 
        } 
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = await storage.loginUser({ email, password });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = generateToken(user.id);
      res.json({ 
        token, 
        user: { 
          id: user.id, 
          email: user.email, 
          firstName: user.firstName, 
          lastName: user.lastName,
          niche: user.niche,
          competitors: user.competitors 
        } 
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Protected route to get current user (JWT-based)
  app.get('/api/auth/user', authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ 
        id: user.id, 
        email: user.email, 
        firstName: user.firstName, 
        lastName: user.lastName,
        niche: user.niche,
        competitors: user.competitors 
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Update user's niche and competitors
  app.put('/api/user/competitors', authenticateToken, async (req, res) => {
    try {
      const { niche, competitors } = req.body;
      
      if (!niche || !competitors) {
        return res.status(400).json({ error: "Niche and competitors are required" });
      }

      const user = await storage.updateUserNiche(req.user!.id, niche, JSON.stringify(competitors));
      
      // Trigger cache rewarming for both niche and competitors change
      cacheWarmer.rewarmCacheAfterChange(req.user!.id, 'both');
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user niche:", error);
      res.status(500).json({ error: "Failed to update user niche" });
    }
  });

  // Update only competitors without triggering cache warming
  app.put('/api/user/competitors-only', authenticateToken, async (req, res) => {
    try {
      const { niche, competitors } = req.body;
      
      if (!niche || !competitors) {
        return res.status(400).json({ error: "Niche and competitors are required" });
      }

      const user = await storage.updateUserNiche(req.user!.id, niche, JSON.stringify(competitors));
      
      // Do not trigger cache warming - user will manually refresh
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user competitors:", error);
      res.status(500).json({ error: "Failed to update user competitors" });
    }
  });

  // Refresh competitors cache manually
  app.post('/api/user/competitors/refresh', authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user?.competitors) {
        return res.status(400).json({ error: "No competitors found to refresh" });
      }

      // Trigger cache rewarming for competitors only
      cacheWarmer.rewarmCacheAfterChange(req.user!.id, 'competitors');
      
      res.json({ message: "Competitor cache refresh initiated" });
    } catch (error) {
      console.error("Error refreshing competitors cache:", error);
      res.status(500).json({ error: "Failed to refresh competitors cache" });
    }
  });

  // Check niche change eligibility
  app.get('/api/user/niche/eligibility', authenticateToken, async (req, res) => {
    try {
      const eligibility = await storage.canChangeNiche(req.user!.id);
      res.json(eligibility);
    } catch (error) {
      console.error("Error checking niche eligibility:", error);
      res.status(500).json({ error: "Failed to check niche eligibility" });
    }
  });

  // Get token usage status
  app.get('/api/user/tokens', authenticateToken, async (req, res) => {
    try {
      const tokenCheck = await storage.canUseTokens(req.user!.id, 0);
      const ideasCheck = await storage.canGenerateIdeas(req.user!.id);
      
      res.json({
        tokens: tokenCheck,
        ideas: ideasCheck
      });
    } catch (error) {
      console.error("Error fetching token usage:", error);
      res.status(500).json({ error: "Failed to fetch token usage" });
    }
  });

  // Get competitor top posts
  app.get('/api/competitors/top-posts', authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user || !user.competitors) {
        return res.status(400).json({ error: "No competitors found for user" });
      }

      const competitors = JSON.parse(user.competitors);
      if (!Array.isArray(competitors) || competitors.length === 0) {
        return res.status(400).json({ error: "No valid competitors found" });
      }

      // Use Apify scraper to get real Instagram data
      if (apifyScraper) {
        const instagramUrls = apifyScraper.convertUsernamesToUrls(competitors);
        const posts = await apifyScraper.scrapeCompetitorProfiles(instagramUrls, 3);
        res.json(posts);
      } else {
        res.status(500).json({ error: "Instagram scraper not available" });
      }
    } catch (error) {
      console.error("Error fetching competitor posts:", error);
      res.status(500).json({ error: "Failed to fetch competitor posts" });
    }
  });

  // Check competitor change eligibility
  app.get('/api/user/competitors/eligibility', authenticateToken, async (req, res) => {
    try {
      const eligibility = await storage.canChangeCompetitors(req.user!.id);
      res.json(eligibility);
    } catch (error) {
      console.error("Error checking competitor change eligibility:", error);
      res.status(500).json({ error: "Failed to check competitor change eligibility" });
    }
  });

  // Update user's niche
  app.patch('/api/user/niche', authenticateToken, async (req, res) => {
    try {
      const { niche } = req.body;
      
      if (!niche) {
        return res.status(400).json({ error: "Niche is required" });
      }

      const user = await storage.updateUserNiche(req.user!.id, niche);
      
      // Trigger cache rewarming for niche change
      cacheWarmer.rewarmCacheAfterChange(req.user!.id, 'niche');
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user niche:", error);
      res.status(500).json({ error: "Failed to update user niche" });
    }
  });

  // Get user token status
  app.get('/api/user/tokens', authenticateToken, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Get token status
      const tokenStatus = await storage.canUseTokens(userId, 0);
      
      // Get idea generation status
      const ideaStatus = await storage.canGenerateIdeas(userId);
      
      res.json({
        tokens: {
          canUse: tokenStatus.canUse,
          tokensRemaining: tokenStatus.tokensRemaining,
          tokensUsed: tokenStatus.tokensUsed,
          dailyLimit: tokenStatus.dailyLimit
        }
      });
    } catch (error) {
      console.error("Error fetching token status:", error);
      res.status(500).json({ error: "Failed to fetch token status" });
    }
  });

  // Streaming content generation endpoint
  app.post('/api/content/generate/stream', authenticateToken, async (req, res) => {
    try {
      const { generationType, numberOfIdeas = 3 } = req.body;
      const userId = req.user!.id;
      
      // Calculate tokens needed based on generation type (based on actual Gemini API usage)
      const tokensPerIdea = generationType === 'date' ? 3000 : 5000; // date: 3K tokens, competitor/trending: 5K tokens
      const tokensNeeded = tokensPerIdea * numberOfIdeas;
      
      // Check token usage limits
      const tokenCheck = await storage.canUseTokens(userId, tokensNeeded);
      if (!tokenCheck.canUse) {
        return res.status(429).json({ 
          error: "Daily token limit reached", 
          message: `Need ${Math.round(tokensNeeded/1000)}K tokens, but only ${Math.round(tokenCheck.tokensRemaining/1000)}K remaining today. Limit resets at midnight.`,
          tokensNeeded,
          tokensRemaining: tokenCheck.tokensRemaining
        });
      }
      
      // Check daily ideas limit
      const ideasCheck = await storage.canGenerateIdeas(userId);
      if (!ideasCheck.canGenerate) {
        return res.status(429).json({ 
          error: "Daily ideas limit reached", 
          message: `You have generated ${ideasCheck.ideasGenerated}/${ideasCheck.dailyLimit} ideas today.`,
          ideasGenerated: ideasCheck.ideasGenerated,
          dailyLimit: ideasCheck.dailyLimit
        });
      }
      
      const ideasToGenerate = Math.min(numberOfIdeas, ideasCheck.ideasRemaining);
      const actualTokensNeeded = tokensPerIdea * ideasToGenerate;
      
      // Get user details and use their niche
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const niche = user.niche || "general";
      let competitors = [];
      
      // Parse competitors if available
      if (user.competitors) {
        try {
          competitors = JSON.parse(user.competitors);
          console.log('📋 Parsed competitors:', competitors);
        } catch (e) {
          console.error('Error parsing competitors:', e);
          console.log('Raw competitors data:', user.competitors);
        }
      }
      
      if (!generationType) {
        return res.status(400).json({ error: "Generation type is required" });
      }

      // Set up Server-Sent Events
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Check if competitor generation is requested but no competitors are set
      if (generationType === 'competitor' && (!competitors || competitors.length === 0)) {
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'No competitors added. Please add competitors first in the Niche section.' })}\n\n`);
        res.end();
        return;
      }

      // Get scraped data based on generation type with proper cache management
      let scrapedData = [];
      if (generationType === 'competitor' && competitors && competitors.length > 0) {
        res.write(`data: ${JSON.stringify({ type: 'progress', message: 'Checking competitor posts cache...', progress: 0 })}\n\n`);
        
        // First, check if we have cached data already
        let cachedPosts = await storage.getCachedCompetitorPosts(req.user!.id);
        
        if (cachedPosts.length > 0) {
          // Case 2: Cache already filled - use cached data
          console.log(`✅ Using existing cached competitor posts: ${cachedPosts.length} posts`);
          res.write(`data: ${JSON.stringify({ type: 'progress', message: `Using ${cachedPosts.length} cached competitor posts`, progress: 15 })}\n\n`);
        } else {
          // Check if COMPETITOR cache is currently warming (not all caches)
          const isCompetitorWarming = cacheWarmer.isCacheWarming(req.user!.id, 'competitor');
          console.log(`🔍 Competitor cache warming status: ${isCompetitorWarming ? 'WARMING' : 'NOT WARMING'}`);
          
          if (isCompetitorWarming) {
            // Case 1: Cache is warming - wait for it to complete
            res.write(`data: ${JSON.stringify({ type: 'progress', message: 'Competitor cache warming in progress, waiting for completion...', progress: 5 })}\n\n`);
            
            // Wait up to 60 seconds for cache warming to complete
            const cacheReady = await cacheWarmer.waitForCache(req.user!.id, 'competitor', 60000);
            
            if (cacheReady) {
              cachedPosts = await storage.getCachedCompetitorPosts(req.user!.id);
              console.log(`✅ Cache warmed successfully: ${cachedPosts.length} posts`);
              res.write(`data: ${JSON.stringify({ type: 'progress', message: `Cache ready! Using ${cachedPosts.length} posts`, progress: 15 })}\n\n`);
            } else {
              res.write(`data: ${JSON.stringify({ type: 'error', message: 'Cache warming timed out. Please try again.' })}\n\n`);
              res.end();
              return;
            }
          } else {
            // Case 3: No cache data and not warming - make fresh API call
            res.write(`data: ${JSON.stringify({ type: 'progress', message: 'No cached data found, fetching fresh competitor posts...', progress: 5 })}\n\n`);
            
            if (apifyScraper) {
              const instagramUrls = apifyScraper.convertUsernamesToUrls(competitors);
              const freshPosts = await apifyScraper.scrapeCompetitorProfiles(instagramUrls, Math.max(numberOfIdeas, 10));
              
              // Sort by engagement and cache the results
              cachedPosts = freshPosts.sort((a, b) => {
                const engagementA = (a.likesCount || 0) + (a.commentsCount || 0);
                const engagementB = (b.likesCount || 0) + (b.commentsCount || 0);
                return engagementB - engagementA;
              });
              
              // Cache the fresh data for future use
              await storage.setCachedCompetitorPosts(req.user!.id, cachedPosts);
              
              console.log(`✅ Fresh competitor posts fetched and cached: ${cachedPosts.length} posts`);
              res.write(`data: ${JSON.stringify({ type: 'progress', message: `Fetched and cached ${cachedPosts.length} fresh posts`, progress: 15 })}\n\n`);
            } else {
              res.write(`data: ${JSON.stringify({ type: 'error', message: 'Instagram scraper not available. Please try again later.' })}\n\n`);
              res.end();
              return;
            }
          }
        }
        
        if (cachedPosts.length > 0) {
          // Handle rotation logic - if requested more than available, rotate posts
          if (numberOfIdeas > cachedPosts.length) {
            res.write(`data: ${JSON.stringify({ type: 'progress', message: `Rotating ${cachedPosts.length} posts to generate ${numberOfIdeas} ideas`, progress: 25 })}\n\n`);
            
            // Create rotated posts array
            const rotatedPosts = [];
            for (let i = 0; i < numberOfIdeas; i++) {
              rotatedPosts.push(cachedPosts[i % cachedPosts.length]);
            }
            scrapedData = rotatedPosts;
          } else {
            // Randomly select from available posts
            const randomPosts = cachedPosts.sort(() => 0.5 - Math.random()).slice(0, numberOfIdeas);
            scrapedData = randomPosts;
          }
          
          res.write(`data: ${JSON.stringify({ type: 'progress', message: `Selected ${scrapedData.length} posts for generation`, progress: 30 })}\n\n`);
        } else {
          res.write(`data: ${JSON.stringify({ type: 'error', message: 'No competitor posts available. Please check your competitors.' })}\n\n`);
          res.end();
          return;
        }
      } else if (generationType === 'trending') {
        res.write(`data: ${JSON.stringify({ type: 'progress', message: 'Checking trending posts cache...', progress: 0 })}\n\n`);
        
        // First, check if we have cached trending data
        let cachedTrendingPosts = await competitorPostCache.getCachedTrendingPosts(niche);
        
        if (cachedTrendingPosts.length > 0) {
          // Case 2: Cache already filled - use cached data
          console.log(`✅ Using existing cached trending posts: ${cachedTrendingPosts.length} posts`);
          res.write(`data: ${JSON.stringify({ type: 'progress', message: `Using ${cachedTrendingPosts.length} cached trending posts`, progress: 15 })}\n\n`);
        } else {
          // Check if TRENDING cache is currently warming (not all caches)
          const isTrendingWarming = cacheWarmer.isCacheWarming(req.user!.id, 'trending');
          console.log(`🔍 Trending cache warming status: ${isTrendingWarming ? 'WARMING' : 'NOT WARMING'}`);
          
          if (isTrendingWarming) {
            // Case 1: Cache is warming - wait for it to complete
            res.write(`data: ${JSON.stringify({ type: 'progress', message: 'Trending cache warming in progress, waiting for completion...', progress: 5 })}\n\n`);
            
            // Wait up to 60 seconds for cache warming to complete
            const cacheReady = await cacheWarmer.waitForCache(req.user!.id, 'trending', 60000);
            
            if (cacheReady) {
              cachedTrendingPosts = await competitorPostCache.getCachedTrendingPosts(niche);
              console.log(`✅ Trending cache warmed successfully: ${cachedTrendingPosts.length} posts`);
              res.write(`data: ${JSON.stringify({ type: 'progress', message: `Trending cache ready! Using ${cachedTrendingPosts.length} posts`, progress: 15 })}\n\n`);
            } else {
              res.write(`data: ${JSON.stringify({ type: 'error', message: 'Trending cache warming timed out. Please try again.' })}\n\n`);
              res.end();
              return;
            }
          } else {
            // Case 3: No cache data and not warming - make fresh API call
            res.write(`data: ${JSON.stringify({ type: 'progress', message: 'No cached trending data found, fetching fresh posts...', progress: 5 })}\n\n`);
            
            if (apifyScraper) {
              const freshTrendingPosts = await apifyScraper.searchTrendingPosts(niche, Math.max(numberOfIdeas, 30));
              
              // Cache the fresh data for future use
              await competitorPostCache.setCachedTrendingPosts(niche, freshTrendingPosts);
              cachedTrendingPosts = freshTrendingPosts;
              
              console.log(`✅ Fresh trending posts fetched and cached: ${cachedTrendingPosts.length} posts`);
              res.write(`data: ${JSON.stringify({ type: 'progress', message: `Fetched and cached ${cachedTrendingPosts.length} fresh trending posts`, progress: 15 })}\n\n`);
            } else {
              res.write(`data: ${JSON.stringify({ type: 'error', message: 'Instagram scraper not available. Please try again later.' })}\n\n`);
              res.end();
              return;
            }
          }
        }
        
        if (cachedTrendingPosts.length > 0) {
          // Handle rotation logic - if requested more than available, rotate posts
          if (numberOfIdeas > cachedTrendingPosts.length) {
            res.write(`data: ${JSON.stringify({ type: 'progress', message: `Rotating ${cachedTrendingPosts.length} trending posts to generate ${numberOfIdeas} ideas`, progress: 25 })}\n\n`);
            
            // Create rotated posts array
            const rotatedPosts = [];
            for (let i = 0; i < numberOfIdeas; i++) {
              rotatedPosts.push(cachedTrendingPosts[i % cachedTrendingPosts.length]);
            }
            scrapedData = rotatedPosts;
          } else {
            // Randomly select from available posts
            const randomPosts = cachedTrendingPosts.sort(() => 0.5 - Math.random()).slice(0, numberOfIdeas);
            scrapedData = randomPosts;
          }
          
          res.write(`data: ${JSON.stringify({ type: 'progress', message: `Selected ${scrapedData.length} trending posts for generation`, progress: 30 })}\n\n`);
        } else {
          res.write(`data: ${JSON.stringify({ type: 'error', message: 'No trending posts available for your niche. Please try again later.' })}\n\n`);
          res.end();
          return;
        }
      }

      // Generate content for each post individually, or fallback to general content
      const generatedContent = [];
      let numberOfPosts = generationType === 'date' ? numberOfIdeas : (scrapedData.length > 0 ? Math.min(scrapedData.length, numberOfIdeas) : numberOfIdeas);
      
      // Special handling for date-specific content generation
      if (generationType === 'date') {
        res.write(`data: ${JSON.stringify({ 
          type: 'progress', 
          message: `Generating ${numberOfIdeas} date-specific ideas...`, 
          progress: 30 
        })}\n\n`);
        
        try {
          const holidayData = await storage.getUpcomingHolidays(10);
          const content = await generateSinglePostContent({
            niche,
            generationType,
            context: 'date-specific',
            post: null, // No specific post for date-based content
            holidays: holidayData,
            numberOfIdeas: numberOfIdeas
          });
          
          // Handle both array and single object responses
          const contentArray = Array.isArray(content) ? content : [content];
          
          for (let i = 0; i < contentArray.length; i++) {
            const ideaContent = contentArray[i];
            const progress = 30 + ((i + 1) / contentArray.length) * 60;
            
            res.write(`data: ${JSON.stringify({ 
              type: 'progress', 
              message: `Generating idea ${i + 1}/${contentArray.length}...`, 
              progress: Math.round(progress) 
            })}\n\n`);
            
            // Save to database and get real ID for date-based content
            const savedIdea = await storage.createContentIdea({
              userId: req.user!.id,
              headline: ideaContent.headline,
              caption: ideaContent.caption,
              hashtags: ideaContent.hashtags,
              ideas: ideaContent.ideas,
              generationType: generationType,
              isSaved: false,
              sourceUrl: null
            });
            
            // Use the database ID instead of temporary ID
            const contentWithRealId = {
              ...ideaContent,
              id: savedIdea.id,
              createdAt: savedIdea.createdAt.toISOString()
            };
            
            generatedContent.push(contentWithRealId);
            
            // Stream the generated content with real database ID
            res.write(`data: ${JSON.stringify({ 
              type: 'content', 
              content: contentWithRealId,
              sourceUrl: null,
              index: i
            })}\n\n`);
          }
          
          // Skip the loop below for date-specific content
          numberOfPosts = 0;
        } catch (error) {
          console.error('Error generating date-specific content:', error);
          res.write(`data: ${JSON.stringify({ 
            type: 'error', 
            message: 'Failed to generate date-specific content' 
          })}\n\n`);
          numberOfPosts = 0;
        }
      }
      
      console.log(`🎯 Starting content generation for ${numberOfPosts} posts, generationType: ${generationType}`);
      console.log(`📊 ScrapedData sample:`, scrapedData.slice(0, 2).map(p => ({ id: p?.id, username: p?.ownerUsername, url: p?.url })));
      
      for (let i = 0; i < numberOfPosts; i++) {
        const post = scrapedData[i] || null;
        const progress = 30 + ((i + 1) / numberOfPosts) * 60;
        
        if (post) {
          res.write(`data: ${JSON.stringify({ 
            type: 'progress', 
            message: `Analyzing post ${i + 1}/${numberOfPosts}...`, 
            progress: Math.round(progress) 
          })}\n\n`);
        } else {
          res.write(`data: ${JSON.stringify({ 
            type: 'progress', 
            message: `Generating content idea ${i + 1}/${numberOfPosts}...`, 
            progress: Math.round(progress) 
          })}\n\n`);
        }

        try {
          console.log(`🤖 Generating content for post ${i + 1}:`, {
            hasPost: !!post,
            postId: post?.id,
            postUsername: post?.ownerUsername,
            postUrl: post?.url,
            generationType,
            niche
          });
          
          const content = await generateInstagramContentWithGemini({
            niche,
            generationType,
            context: `Generated from streaming API - Post ${i + 1}/${numberOfPosts}`,
            competitors,
            scrapedData: post ? [post] : [], // Pass individual post or empty array
            useApifyData: !!post,
            numberOfIdeas: 1 // Always generate 1 idea per iteration for streaming
          });
          
          console.log(`✅ Generated content for post ${i + 1}:`, content?.[0]?.headline || 'No content');

          if (content && content.length > 0) {
            // Ensure Instagram URL is present for competitor and trending posts
            let sourceUrl = null;
            if (post) {
              if (post.url) {
                sourceUrl = post.url;
              } else if (post.shortCode) {
                sourceUrl = `https://instagram.com/p/${post.shortCode}`;
              } else if (post.id) {
                // Fallback to Instagram post URL using ID if shortCode is missing
                sourceUrl = `https://instagram.com/p/${post.id}`;
              }
            }
            
            // Only send content if it has a valid Instagram URL (for competitor/trending) or is date-based
            if (generationType === 'date' || sourceUrl) {
              // Save to database and get real ID
              const savedIdea = await storage.createContentIdea({
                userId: req.user!.id,
                headline: content[0].headline,
                caption: content[0].caption,
                hashtags: content[0].hashtags,
                ideas: content[0].ideas,
                generationType: generationType,
                isSaved: false,
                sourceUrl: sourceUrl
              });
              
              // Use the database ID instead of temporary ID
              const contentWithRealId = {
                ...content[0],
                id: savedIdea.id,
                createdAt: savedIdea.createdAt.toISOString()
              };
              
              generatedContent.push(contentWithRealId);
              
              // Stream the generated content with real database ID
              res.write(`data: ${JSON.stringify({ 
                type: 'content', 
                content: contentWithRealId,
                sourceUrl: sourceUrl,
                index: i
              })}\n\n`);
            } else {
              console.warn(`Skipping content ${i + 1} - no Instagram URL available. Post data:`, {
                hasPost: !!post,
                postUrl: post?.url,
                postShortCode: post?.shortCode,
                postId: post?.id
              });
            }
          }
        } catch (contentError) {
          console.error(`Error generating content for post ${i + 1}:`, contentError);
          res.write(`data: ${JSON.stringify({ 
            type: 'error', 
            message: `Failed to generate content for post ${i + 1}` 
          })}\n\n`);
        }
      }

      // Content ideas are already saved to database during streaming above

      // Track successful generation with tokens
      await storage.trackTokenUsage(userId, actualTokensNeeded, ideasToGenerate);

      res.write(`data: ${JSON.stringify({ 
        type: 'complete', 
        message: `Content generation completed! Used ${actualTokensNeeded} tokens for ${ideasToGenerate} ideas.`, 
        progress: 100,
        tokensUsed: actualTokensNeeded,
        ideasGenerated: ideasToGenerate
      })}\n\n`);
      res.end();

    } catch (error) {
      console.error("Error in streaming content generation:", error);
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to generate content' })}\n\n`);
      res.end();
    }
  });

  // Traditional content generation endpoint
  app.post('/api/content/generate', authenticateToken, async (req, res) => {
    try {
      const { niche, generationType, context, competitors } = req.body;
      
      // Check if user can generate content
      const canGenerate = await storage.canGenerateContent(req.user!.id);
      if (!canGenerate.canGenerate) {
        return res.status(429).json({ 
          error: "Daily generation limit reached", 
          message: `You've reached your daily limit of 2 content generations. Please try again tomorrow.`,
          remaining: canGenerate.remaining
        });
      }
      
      if (!niche || !generationType) {
        return res.status(400).json({ error: "Niche and generation type are required" });
      }

      // Get holidays for context
      const holidays = await storage.getUpcomingHolidays(5);
      
      // Get scraped data based on generation type
      let scrapedData = [];
      if (generationType === 'competitor' && competitors && competitors.length > 0) {
        if (apifyScraper) {
          scrapedData = await apifyScraper.scrapeCompetitorProfiles(competitors, 3);
        }
      } else if (generationType === 'trending') {
        if (apifyScraper) {
          scrapedData = await apifyScraper.searchTrendingPosts(niche, 10);
        }
      }

      const generatedContent = await generateInstagramContentWithGemini({
        niche,
        generationType,
        context,
        competitors,
        holidays,
        scrapedData,
        useApifyData: scrapedData.length > 0
      });

      // Save generated content to database
      for (const content of generatedContent) {
        await storage.createContentIdea({
          userId: req.user!.id,
          headline: content.headline,
          caption: content.caption,
          hashtags: content.hashtags,
          ideas: content.ideas,
          generationType,
          isSaved: false
        });
      }

      // Increment usage counter after successful generation
      await storage.incrementGenerations(req.user!.id);

      res.json({ 
        success: true, 
        content: generatedContent,
        totalPosts: scrapedData.length 
      });

    } catch (error) {
      console.error("Error generating content:", error);
      res.status(500).json({ error: "Failed to generate content" });
    }
  });

  // Create a content idea manually
  app.post('/api/content/ideas', authenticateToken, async (req, res) => {
    try {
      const { headline, caption, hashtags, ideas } = req.body;
      
      if (!headline || !caption) {
        return res.status(400).json({ error: "Headline and caption are required" });
      }

      const contentIdea = await storage.createContentIdea({
        userId: req.user!.id,
        headline,
        caption,
        hashtags: hashtags || '',
        ideas: ideas || '',
        generationType: 'custom',
        isSaved: true, // Save manually created ideas by default
      });

      res.json(contentIdea);
    } catch (error) {
      console.error("Error creating content idea:", error);
      res.status(500).json({ error: "Failed to create content idea" });
    }
  });

  // Get user's content ideas
  app.get('/api/content/ideas', authenticateToken, async (req, res) => {
    try {
      const ideas = await storage.getUserContentIdeas(req.user!.id);
      res.json(ideas);
    } catch (error) {
      console.error("Error fetching content ideas:", error);
      res.status(500).json({ error: "Failed to fetch content ideas" });
    }
  });

  // Get user's saved content ideas
  app.get('/api/content/ideas/saved', authenticateToken, async (req, res) => {
    try {
      const ideas = await storage.getSavedContentIdeas(req.user!.id);
      res.json(ideas);
    } catch (error) {
      console.error("Error fetching saved content ideas:", error);
      res.status(500).json({ error: "Failed to fetch saved content ideas" });
    }
  });

  // Save/unsave content idea
  app.patch('/api/content/ideas/:id/save', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { isSaved } = req.body;
      
      await storage.updateContentIdeaSaved(parseInt(id), isSaved);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating content idea save status:", error);
      res.status(500).json({ error: "Failed to update content idea" });
    }
  });

  // Update content idea
  app.patch('/api/content/ideas/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedIdea = await storage.updateContentIdea(parseInt(id), updates);
      res.json(updatedIdea);
    } catch (error) {
      console.error("Error updating content idea:", error);
      res.status(500).json({ error: "Failed to update content idea" });
    }
  });

  // Schedule a post
  app.post('/api/posts/schedule', authenticateToken, async (req, res) => {
    try {
      const { contentIdeaId, headline, caption, hashtags, ideas, scheduledDate, isCustom } = req.body;
      
      if (!headline || !caption || !scheduledDate) {
        return res.status(400).json({ error: "Headline, caption, and scheduled date are required" });
      }

      // Check if contentIdeaId is a real database ID (should be < 2147483647 for INT4)
      // Temporary IDs generated by Date.now() are much larger
      const isValidDatabaseId = contentIdeaId && 
                               !isNaN(Number(contentIdeaId)) && 
                               Number(contentIdeaId) > 0 && 
                               Number(contentIdeaId) < 2147483647;

      const scheduledPost = await storage.createScheduledPost({
        userId: req.user!.id,
        contentIdeaId: isValidDatabaseId ? Number(contentIdeaId) : null,
        headline,
        caption,
        hashtags,
        ideas,
        scheduledDate: new Date(scheduledDate),
        isCustom: isCustom || false,
        status: 'scheduled'
      });

      // Send immediate notification about the scheduled post
      notificationService.sendImmediateScheduleNotification(req.user!.id, scheduledPost);
      
      // Schedule a reminder notification for when the post should be published
      notificationService.schedulePostNotification(scheduledPost.id, new Date(scheduledDate), req.user!.id);

      res.json(scheduledPost);
    } catch (error) {
      console.error("Error scheduling post:", error);
      res.status(500).json({ error: "Failed to schedule post" });
    }
  });

  // Get scheduled posts
  app.get('/api/posts/scheduled', authenticateToken, async (req, res) => {
    try {
      const posts = await storage.getUserScheduledPosts(req.user!.id);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching scheduled posts:", error);
      res.status(500).json({ error: "Failed to fetch scheduled posts" });
    }
  });

  // Update scheduled post
  app.patch('/api/posts/scheduled/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedPost = await storage.updateScheduledPost(parseInt(id), updates);
      res.json(updatedPost);
    } catch (error) {
      console.error("Error updating scheduled post:", error);
      res.status(500).json({ error: "Failed to update scheduled post" });
    }
  });

  // Delete scheduled post
  app.delete('/api/posts/scheduled/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      
      await storage.deleteScheduledPost(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting scheduled post:", error);
      res.status(500).json({ error: "Failed to delete scheduled post" });
    }
  });

  // Optimize hashtags
  app.post('/api/content/optimize-hashtags', authenticateToken, async (req, res) => {
    try {
      const { niche, caption } = req.body;
      
      if (!niche || !caption) {
        return res.status(400).json({ error: "Niche and caption are required" });
      }

      const optimizedHashtags = await optimizeHashtagsWithGemini(niche, caption);
      res.json({ hashtags: optimizedHashtags });
    } catch (error) {
      console.error("Error optimizing hashtags:", error);
      res.status(500).json({ error: "Failed to optimize hashtags" });
    }
  });

  // Refine content with AI (non-streaming fallback)
  app.post('/api/content/refine', authenticateToken, async (req, res) => {
    try {
      const { idea, message, chatHistory } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Check token usage for refine (2000 tokens per refine message)
      const tokensNeeded = 2000;
      const tokenCheck = await storage.canUseTokens(req.user!.id, tokensNeeded);
      if (!tokenCheck.canUse) {
        return res.status(429).json({ 
          error: "Daily token limit reached", 
          message: `Need ${Math.round(tokensNeeded/1000)}K tokens, but only ${Math.round(tokenCheck.tokensRemaining/1000)}K remaining today. Limit resets at midnight.`,
          tokensNeeded,
          tokensRemaining: tokenCheck.tokensRemaining
        });
      }

      // Use only Gemini - idea is optional for standalone AI expert mode
      const refinedContent = await refineContentWithGemini(idea || null, message, chatHistory || []);
      
      // Track token usage after successful refine
      await storage.trackTokenUsage(req.user!.id, tokensNeeded);
      
      res.json({ response: refinedContent, tokensUsed: tokensNeeded });
    } catch (error) {
      console.error("Error refining content:", error);
      res.status(500).json({ error: "Failed to refine content" });
    }
  });

  // Streaming refine content with AI
  app.post('/api/content/refine-stream', authenticateToken, async (req, res) => {
    try {
      const { idea, message, chatHistory } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Check token usage for refine (2000 tokens per refine message)
      const tokensNeeded = 2000;
      const tokenCheck = await storage.canUseTokens(req.user!.id, tokensNeeded);
      if (!tokenCheck.canUse) {
        return res.status(429).json({ 
          error: "Daily token limit reached", 
          message: `Need ${Math.round(tokensNeeded/1000)}K tokens, but only ${Math.round(tokenCheck.tokensRemaining/1000)}K remaining today. Limit resets at midnight.`,
          tokensNeeded,
          tokensRemaining: tokenCheck.tokensRemaining
        });
      }

      // Check if user can refine content
      const canRefine = await storage.canRefineContent(req.user!.id);
      if (!canRefine.canRefine) {
        return res.status(429).json({ 
          error: "Monthly refine limit reached", 
          message: `You've reached your monthly limit of 30 refine messages. Please upgrade your plan.`,
          remaining: canRefine.remaining
        });
      }

      // Set up SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Use only Gemini for streaming - idea is optional for standalone AI expert mode
      const streamFunction = refineContentStreamWithGemini(idea || null, message, chatHistory || []);

      try {
        for await (const chunk of streamFunction) {
          res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        }
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        
        // Track token usage and increment refine messages after successful streaming
        await storage.trackTokenUsage(req.user!.id, 2000); // 2K tokens per refine
        await storage.incrementRefineMessages(req.user!.id);
      } catch (streamError) {
        console.error("Streaming error:", streamError);
        res.write(`data: ${JSON.stringify({ error: "Streaming failed" })}\n\n`);
      }
      
      res.end();
    } catch (error) {
      console.error("Error in streaming refine:", error);
      res.status(500).json({ error: "Failed to start streaming refinement" });
    }
  });

  // Get user usage statistics
  app.get('/api/usage', authenticateToken, async (req, res) => {
    try {
      const usage = await storage.getTodayUsage(req.user!.id);
      res.json(usage || {
        generationsUsed: 0,
        refineMessagesUsed: 0,
        generationLimit: 2,
        refineMessageLimit: 30,
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error("Error fetching usage:", error);
      res.status(500).json({ error: "Failed to fetch usage" });
    }
  });

  // Test Apify trending posts
  app.post('/api/apify/test-trending', authenticateToken, async (req, res) => {
    try {
      const { niche } = req.body;
      
      if (!niche) {
        return res.status(400).json({ error: "Niche is required" });
      }

      if (!apifyScraper) {
        return res.status(500).json({ error: "Apify scraper not available" });
      }

      const posts = await apifyScraper.searchTrendingPosts(niche, 5);
      res.json({ posts, count: posts.length });
    } catch (error) {
      console.error("Error testing Apify trending:", error);
      res.status(500).json({ error: "Failed to test Apify trending" });
    }
  });

  // Feedback routes
  app.post('/api/feedback', async (req, res) => {
    try {
      const { userId, email, message, category } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const feedback = await storage.createFeedback({
        userId,
        email,
        message,
        category
      });

      res.json(feedback);
    } catch (error) {
      console.error("Error creating feedback:", error);
      res.status(500).json({ error: "Failed to create feedback" });
    }
  });

  // Rating routes
  app.post('/api/ratings', authenticateToken, async (req, res) => {
    try {
      const { rating, comment, context } = req.body;
      
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5" });
      }

      const ratingRecord = await storage.createRating({
        userId: req.user!.id,
        rating,
        comment,
        context
      });

      res.json(ratingRecord);
    } catch (error) {
      console.error("Error creating rating:", error);
      res.status(500).json({ error: "Failed to create rating" });
    }
  });

  // Admin routes
  app.post('/api/admin/send-otp', async (req, res) => {
    console.log('🔥 Admin send-otp endpoint hit!');
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    try {
      const { email } = req.body;
      console.log('Email received:', email);
      
      if (email !== 'amzad4620@gmail.com') {
        console.log('❌ Unauthorized email:', email);
        return res.status(403).json({ error: "Unauthorized email address" });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await storage.createAdminOTP({
        email,
        otp,
        expiresAt
      });

      // In a real app, you would send this via email
      // For now, we'll just log it to the console
      console.log(`🔐 Admin OTP for ${email}: ${otp}`);

      res.json({ success: true });
    } catch (error) {
      console.error("Error sending OTP:", error);
      res.status(500).json({ error: "Failed to send OTP" });
    }
  });

  app.post('/api/admin/verify-otp', async (req, res) => {
    try {
      const { email, otp } = req.body;
      
      if (email !== 'amzad4620@gmail.com') {
        return res.status(403).json({ error: "Unauthorized email address" });
      }

      const isValid = await storage.verifyAdminOTP(email, otp);
      
      if (!isValid) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error verifying OTP:", error);
      res.status(500).json({ error: "Failed to verify OTP" });
    }
  });

  app.get('/api/admin/feedback', async (req, res) => {
    try {
      const feedback = await storage.getAllFeedback();
      res.json(feedback);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ error: "Failed to fetch feedback" });
    }
  });

  app.get('/api/admin/ratings', async (req, res) => {
    try {
      const ratings = await storage.getAllRatings();
      res.json(ratings);
    } catch (error) {
      console.error("Error fetching ratings:", error);
      res.status(500).json({ error: "Failed to fetch ratings" });
    }
  });

  app.get('/api/admin/analytics', async (req, res) => {
    try {
      const analytics = await storage.getTokenUsageOverview();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get('/api/admin/users', async (req, res) => {
    try {
      const users = await storage.getAllUsersWithTokenUsage();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/users/:userId/analytics', async (req, res) => {
    try {
      const { userId } = req.params;
      const analytics = await storage.getUserTokenAnalytics(userId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching user analytics:", error);
      res.status(500).json({ error: "Failed to fetch user analytics" });
    }
  });

  // Test Apify competitor analysis
  app.post('/api/apify/test-competitors', authenticateToken, async (req, res) => {
    try {
      const { competitors } = req.body;
      
      if (!competitors || !Array.isArray(competitors)) {
        return res.status(400).json({ error: "Competitors array is required" });
      }

      if (!apifyScraper) {
        return res.status(500).json({ error: "Apify scraper not available" });
      }

      const posts = await apifyScraper.scrapeCompetitorProfiles(competitors, 3);
      res.json({ posts, count: posts.length });
    } catch (error) {
      console.error("Error testing Apify competitors:", error);
      res.status(500).json({ error: "Failed to test Apify competitors" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}