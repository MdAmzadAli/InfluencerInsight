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
import { apifyScraper } from "./apify-scraper";
import { checkDatabaseHealth } from "./db";
import { notificationService } from "./notification-service";
import { competitorPostCache } from "./cache-manager";


export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize database and check health
  await checkDatabaseHealth();
  

  
  // Seed holidays
  await storage.seedHolidays();
  
  // Start notification scheduler
  notificationService.startNotificationScheduler();
  
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
      res.json(user);
    } catch (error) {
      console.error("Error updating user niche:", error);
      res.status(500).json({ error: "Failed to update user niche" });
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

  // Update user's niche
  app.patch('/api/user/niche', authenticateToken, async (req, res) => {
    try {
      const { niche } = req.body;
      
      if (!niche) {
        return res.status(400).json({ error: "Niche is required" });
      }

      const user = await storage.updateUserNiche(req.user!.id, niche);
      res.json(user);
    } catch (error) {
      console.error("Error updating user niche:", error);
      res.status(500).json({ error: "Failed to update user niche" });
    }
  });

  // Streaming content generation endpoint
  app.post('/api/content/generate/stream', authenticateToken, async (req, res) => {
    try {
      const { generationType, numberOfIdeas = 3 } = req.body;
      
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

      // Get scraped data based on generation type
      let scrapedData = [];
      if (generationType === 'competitor' && competitors && competitors.length > 0) {
        res.write(`data: ${JSON.stringify({ type: 'progress', message: 'Checking for cached competitor posts...', progress: 0 })}\n\n`);
        
        // Check for cached competitor posts first
        const cachedPosts = await storage.getCachedCompetitorPosts(req.user!.id);
        
        if (cachedPosts.length >= 10) {
          // Use cached posts - randomly select from top 10
          res.write(`data: ${JSON.stringify({ type: 'progress', message: 'Using cached competitor posts...', progress: 10 })}\n\n`);
          const randomPosts = cachedPosts.sort(() => 0.5 - Math.random()).slice(0, numberOfIdeas);
          scrapedData = randomPosts;
          res.write(`data: ${JSON.stringify({ type: 'progress', message: `Selected ${scrapedData.length} cached posts`, progress: 20 })}\n\n`);
        } else {
          // Fetch fresh data and cache it
          res.write(`data: ${JSON.stringify({ type: 'progress', message: 'Fetching fresh competitor posts...', progress: 5 })}\n\n`);
          
          if (apifyScraper) {
            // Fetch 10 posts per competitor
            const instagramUrls = apifyScraper.convertUsernamesToUrls(competitors);
            const allPosts = await apifyScraper.scrapeCompetitorProfiles(instagramUrls, 10);
            
            res.write(`data: ${JSON.stringify({ type: 'progress', message: `Found ${allPosts.length} posts from ${competitors.length} competitors`, progress: 15 })}\n\n`);
            
            // Sort by engagement and take top 10
            const sortedPosts = allPosts.sort((a, b) => {
              const engagementA = (a.likesCount || 0) + (a.commentsCount || 0);
              const engagementB = (b.likesCount || 0) + (b.commentsCount || 0);
              return engagementB - engagementA;
            }).slice(0, 10);
            
            // Cache the top 10 posts for 24 hours
            await storage.setCachedCompetitorPosts(req.user!.id, sortedPosts);
            
            // Randomly select posts for this generation
            const randomPosts = sortedPosts.sort(() => 0.5 - Math.random()).slice(0, numberOfIdeas);
            scrapedData = randomPosts;
            
            res.write(`data: ${JSON.stringify({ type: 'progress', message: `Cached top 10 posts, selected ${scrapedData.length} for generation`, progress: 20 })}\n\n`);
          }
        }
      } else if (generationType === 'trending') {
        res.write(`data: ${JSON.stringify({ type: 'progress', message: 'Checking for cached trending posts...', progress: 0 })}\n\n`);
        
        // Check for cached trending posts first
        const cachedTrendingPosts = await competitorPostCache.getCachedTrendingPosts(niche);
        
        if (cachedTrendingPosts.length >= numberOfIdeas) {
          // Use cached posts - randomly select requested number
          res.write(`data: ${JSON.stringify({ type: 'progress', message: 'Using cached trending posts...', progress: 10 })}\n\n`);
          const randomPosts = cachedTrendingPosts.sort(() => 0.5 - Math.random()).slice(0, numberOfIdeas);
          scrapedData = randomPosts;
          res.write(`data: ${JSON.stringify({ type: 'progress', message: `Selected ${scrapedData.length} cached trending posts`, progress: 20 })}\n\n`);
        } else {
          // Fetch fresh trending data and cache it
          res.write(`data: ${JSON.stringify({ type: 'progress', message: 'Fetching fresh trending posts...', progress: 5 })}\n\n`);
          
          if (apifyScraper) {
            // Fetch 20-30 trending posts for caching
            const allTrendingPosts = await apifyScraper.searchTrendingPosts(niche, 1);
            res.write(`data: ${JSON.stringify({ type: 'progress', message: `Found ${allTrendingPosts.length} trending posts`, progress: 15 })}\n\n`);
            
            // Cache all trending posts for 24 hours
            await competitorPostCache.setCachedTrendingPosts(niche, allTrendingPosts);
            
            // Randomly select posts for this generation
            const randomPosts = allTrendingPosts.sort(() => 0.5 - Math.random()).slice(0, numberOfIdeas);
            scrapedData = randomPosts;
            
            res.write(`data: ${JSON.stringify({ type: 'progress', message: `Cached ${allTrendingPosts.length} trending posts, selected ${scrapedData.length} for generation`, progress: 20 })}\n\n`);
          }
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
            
            generatedContent.push(ideaContent);
            
            // Stream the generated content immediately
            res.write(`data: ${JSON.stringify({ 
              type: 'content', 
              content: ideaContent,
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
      
      for (let i = 0; i < numberOfPosts; i++) {
        const post = scrapedData[i] || null;
        const progress = 20 + ((i + 1) / numberOfPosts) * 70;
        
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
          const content = await generateInstagramContentWithGemini({
            niche,
            generationType,
            context: "Generated from streaming API",
            competitors,
            scrapedData: post ? [post] : [], // Pass individual post or empty array
            useApifyData: !!post,
            numberOfIdeas: 1 // Always generate 1 idea per iteration for streaming
          });

          if (content && content.length > 0) {
            generatedContent.push(content[0]);
            
            // Stream the generated content immediately
            res.write(`data: ${JSON.stringify({ 
              type: 'content', 
              content: content[0],
              sourceUrl: post ? (post.url || `https://instagram.com/p/${post.shortCode}`) : null,
              index: i
            })}\n\n`);
          }
        } catch (contentError) {
          console.error(`Error generating content for post ${i + 1}:`, contentError);
          res.write(`data: ${JSON.stringify({ 
            type: 'error', 
            message: `Failed to generate content for post ${i + 1}` 
          })}\n\n`);
        }
      }

      // Save all generated content to database
      for (const content of generatedContent) {
        try {
          await storage.createContentIdea({
            userId: req.user!.id,
            headline: content.headline,
            caption: content.caption,
            hashtags: content.hashtags,
            ideas: content.ideas,
            generationType,
            isSaved: false
          });
        } catch (saveError) {
          console.error("Error saving content idea:", saveError);
        }
      }

      res.write(`data: ${JSON.stringify({ type: 'complete', message: 'Content generation completed!', progress: 100 })}\n\n`);
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

  // Schedule a post
  app.post('/api/posts/schedule', authenticateToken, async (req, res) => {
    try {
      const { contentIdeaId, headline, caption, hashtags, ideas, scheduledDate, isCustom } = req.body;
      
      if (!headline || !caption || !hashtags || !scheduledDate) {
        return res.status(400).json({ error: "All fields are required" });
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
      
      if (!idea || !message) {
        return res.status(400).json({ error: "Idea and message are required" });
      }

      // Use only Gemini
      const refinedContent = await refineContentWithGemini(idea, message, chatHistory || []);
      res.json({ response: refinedContent });
    } catch (error) {
      console.error("Error refining content:", error);
      res.status(500).json({ error: "Failed to refine content" });
    }
  });

  // Streaming refine content with AI
  app.post('/api/content/refine-stream', authenticateToken, async (req, res) => {
    try {
      const { idea, message, chatHistory } = req.body;
      
      if (!idea || !message) {
        return res.status(400).json({ error: "Idea and message are required" });
      }

      // Set up SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Use only Gemini for streaming
      const streamFunction = refineContentStreamWithGemini(idea, message, chatHistory || []);

      try {
        for await (const chunk of streamFunction) {
          res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        }
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
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