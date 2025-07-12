import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateUser, AuthenticatedRequest } from "./auth";
import { checkDatabaseHealth } from "./db";
import { generateInstagramContent, optimizeHashtags } from "./openai";
import { generateInstagramContentWithGemini, optimizeHashtagsWithGemini, analyzeCompetitorContent, generateSinglePostContent } from "./gemini";
import { instagramScraper } from "./instagram-scraper";
import { advancedInstagramScraper } from "./instagram-api";
import { realInstagramScraper } from "./instagram-real-scraper";
import { apifyScraper } from "./apify-scraper";
import { notificationService } from "./notification-service";
import session from "express-session";
import { z } from "zod";

// Validation schemas
const insertContentIdeaSchema = z.object({
  userId: z.string(),
  headline: z.string(),
  caption: z.string(),
  hashtags: z.string(),
  ideas: z.string(),
  generationType: z.string(),
  isSaved: z.boolean().optional(),
});

const insertScheduledPostSchema = z.object({
  userId: z.string(),
  contentIdeaId: z.number().optional().nullable(),
  headline: z.string(),
  caption: z.string(),
  hashtags: z.string(),
  ideas: z.string().optional().nullable(),
  scheduledDate: z.string().transform((str) => new Date(str)),
  isCustom: z.boolean().optional(),
  status: z.string().optional(),
});

const updateUserSchema = z.object({
  niche: z.string().optional(),
  competitors: z.string().optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'demo-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Check custom database health
  await checkDatabaseHealth();

  // Seed holidays on startup (only if database is available)
  if (storage) {
    await storage.seedHolidays();
  }

  // Start notification service
  notificationService.startNotificationScheduler();

  // Simple auth routes
  app.get('/api/login', (req, res) => {
    // For demo purposes, create a demo user session
    (req.session as any).user = {
      id: 'demo-user-123',
      email: 'demo@example.com',
      name: 'Demo User',
      picture: null
    };
    res.redirect('/');
  });

  app.get('/api/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
      }
      res.redirect('/');
    });
  });

  app.get('/api/auth/user', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.uid;
      let user = await storage.getUser(userId);
      
      // Create user if doesn't exist
      if (!user) {
        user = await storage.upsertUser({
          id: userId,
          email: req.user.email,
          firstName: req.user.name?.split(' ')[0] || null,
          lastName: req.user.name?.split(' ').slice(1).join(' ') || null,
          profileImageUrl: req.user.picture || null,
        });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user competitors
  app.put('/api/user/competitors', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.uid;
      const { competitors } = req.body;
      
      if (typeof competitors !== 'string') {
        return res.status(400).json({ message: "Competitors must be a string" });
      }

      const updatedUser = await storage.updateUserNiche(userId, null, competitors);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating competitors:", error);
      res.status(500).json({ message: "Failed to update competitors" });
    }
  });

  // Get top competitor posts
  app.get('/api/competitors/top-posts', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.uid;
      const user = await storage.getUser(userId);
      
      if (!user?.competitors) {
        return res.json({ posts: [], competitorProfiles: [] });
      }

      const competitors = user.competitors.split(',').filter(Boolean);
      
      if (competitors.length === 0) {
        return res.json({ posts: [], competitorProfiles: [] });
      }

      // Use real Instagram scraper - no fallback to mock data
      try {
        const result = await realInstagramScraper.getTopPostsFromCompetitors(competitors, 10);
        res.json(result);
      } catch (error) {
        console.error('Real Instagram scraping failed:', error);
        res.status(500).json({ 
          message: "Failed to scrape real Instagram data. Please ensure competitor usernames are correct and try again.",
          error: "REAL_SCRAPING_FAILED"
        });
      }
      return;
      res.json(result);
    } catch (error) {
      console.error("Error fetching competitor posts:", error);
      res.status(500).json({ message: "Failed to fetch competitor posts" });
    }
  });

  // User profile routes
  app.patch('/api/user/niche', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.uid;
      const { niche, competitors } = updateUserSchema.parse(req.body);
      
      const user = await storage.updateUserNiche(userId, niche || '', competitors || undefined);
      res.json(user);
    } catch (error) {
      console.error("Error updating user niche:", error);
      res.status(500).json({ message: "Failed to update user niche" });
    }
  });

  // Real-time content generation with streaming
  app.post('/api/content/generate/stream', authenticateUser, async (req: AuthenticatedRequest, res) => {
    // Set request timeout to 15 minutes for long-running Apify requests
    req.setTimeout(900000, () => {
      console.log('⏰ Request timeout reached (15 minutes)');
      res.status(408).json({ message: 'Request timeout' });
    });
    
    try {
      console.log('🚀 Starting streaming content generation...');
      const userId = req.user.uid;
      const { generationType, context } = req.body;
      
      console.log(`📋 Request details - User: ${userId}, Type: ${generationType}, Context: ${context}`);
      
      const user = await storage.getUser(userId);
      if (!user?.niche) {
        console.log('❌ User niche not set');
        return res.status(400).json({ message: "User niche not set" });
      }
      
      console.log(`👤 User found - Niche: ${user.niche}, Competitors: ${user.competitors}`);

      // Set up Server-Sent Events
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      const sendEvent = (data: any) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      try {
        // Send initial status
        sendEvent({ type: 'status', message: 'Starting content generation...' });

        let holidays;
        if (generationType === 'date') {
          holidays = await storage.getUpcomingHolidays(10);
        }

        // Get Instagram posts from Apify
        const competitors = user.competitors ? user.competitors.split(',').map(c => c.trim()) : [];
        let apifyPosts: any[] = [];
        
        console.log(`📊 Apify scraper available: ${!!apifyScraper}`);
        console.log(`🎯 Competitors: ${competitors}`);
        
        if (apifyScraper) {
          sendEvent({ type: 'status', message: 'Fetching Instagram data...' });
          
          try {
            if (generationType === 'trending') {
              sendEvent({ type: 'status', message: `Searching trending posts for "${user.niche}"...` });
              apifyPosts = await apifyScraper.searchTrendingPosts(user.niche, 10);
            } else if (generationType === 'competitor' && competitors.length > 0) {
              const instagramUrls = apifyScraper.convertUsernamesToUrls(competitors);
              sendEvent({ 
                type: 'status', 
                message: `Fetching posts from ${competitors.length} competitors in single API call: ${competitors.join(', ')}` 
              });
              console.log(`Making single Apify API call for ${competitors.length} competitors:`, instagramUrls);
              apifyPosts = await apifyScraper.scrapeCompetitorProfiles(instagramUrls, 3);
            } else if (generationType === 'date') {
              // For date-based generation, we'll generate content based on holidays without needing Instagram posts
              sendEvent({ 
                type: 'status', 
                message: `Generating content for upcoming holidays and ${user.niche}...` 
              });
              console.log(`📅 Date-based generation for ${user.niche} with ${holidays?.length || 0} holidays`);
              // We'll handle this differently - generate content directly from holidays
              apifyPosts = []; // Keep empty for now, will be handled separately
            }
            
            if (generationType !== 'date') {
              sendEvent({ 
                type: 'status', 
                message: `Found ${apifyPosts.length} posts to analyze from ${generationType === 'competitor' ? competitors.length + ' competitors' : 'trending sources'}` 
              });
            }
          } catch (error) {
            sendEvent({ 
              type: 'error', 
              message: 'Failed to fetch Instagram data: ' + (error instanceof Error ? error.message : 'Unknown error')
            });
            res.end();
            return;
          }
        } else {
          console.log('❌ Instagram scraper not configured');
          sendEvent({ type: 'error', message: 'Instagram scraper not configured' });
          res.end();
          return;
        }

        // Process each post individually and stream results
        const generatedIdeas = [];
        
        if (generationType === 'date') {
          // For date-based generation, generate content based on holidays
          const numberOfIdeas = holidays?.length || 5;
          sendEvent({ 
            type: 'status', 
            message: `Generating ${numberOfIdeas} content ideas for upcoming holidays...` 
          });
          
          for (let i = 0; i < numberOfIdeas; i++) {
            const holiday = holidays?.[i];
            
            sendEvent({ 
              type: 'progress', 
              current: i + 1, 
              total: numberOfIdeas,
              message: `Generating content idea ${i + 1}/${numberOfIdeas}${holiday ? ` for ${holiday.name}` : ''}...`
            });

            try {
              console.log(`🎯 Generating date-based content ${i + 1}/${numberOfIdeas}${holiday ? ` for ${holiday.name}` : ''}`);
              
              // Use the bulk generation method for date-based content
              const bulkContent = await generateInstagramContentWithGemini({
                niche: user.niche,
                generationType,
                context,
                holidays: holiday ? [holiday] : [],
                useApifyData: false
              });
              
              // Take only the first generated content
              const singleContent = bulkContent[0];
              
              if (singleContent) {
                console.log(`✅ Generated date-based content:`, singleContent.headline);

                // Save to database
                const savedIdea = await storage.createContentIdea({
                  userId,
                  headline: singleContent.headline,
                  caption: singleContent.caption,
                  hashtags: singleContent.hashtags,
                  ideas: singleContent.ideas,
                  generationType,
                  isSaved: false
                });

                console.log(`💾 Saved date-based idea to database with ID: ${savedIdea.id}`);
                generatedIdeas.push(savedIdea);

                // Send individual result immediately
                sendEvent({ 
                  type: 'content', 
                  data: savedIdea,
                  progress: {
                    current: i + 1,
                    total: numberOfIdeas
                  }
                });

                console.log(`📡 Sent date-based result ${i + 1} to frontend`);
              }
              
              // Small delay to prevent overwhelming the client
              await new Promise(resolve => setTimeout(resolve, 1000));
              
            } catch (error) {
              console.error(`❌ Error generating date-based content ${i + 1}:`, error);
              sendEvent({ 
                type: 'error', 
                message: `Failed to generate content idea ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`
              });
            }
          }
        } else {
          // For post-based generation (competitor/trending)
          for (let i = 0; i < apifyPosts.length; i++) {
          const post = apifyPosts[i];
          
          sendEvent({ 
            type: 'progress', 
            current: i + 1, 
            total: apifyPosts.length,
            message: `Analyzing post ${i + 1}/${apifyPosts.length} from @${post.ownerUsername}...`
          });

          try {
            console.log(`🤖 Processing post ${i + 1}/${apifyPosts.length} from @${post.ownerUsername}`);
            
            // Generate content for single post
            const singlePostContent = await generateSinglePostContent({
              niche: user.niche,
              generationType,
              context,
              post,
              holidays
            });

            console.log(`✅ Generated content for post ${i + 1}:`, singlePostContent.headline);

            // Save to database
            const savedIdea = await storage.createContentIdea({
              userId,
              headline: singlePostContent.headline,
              caption: singlePostContent.caption,
              hashtags: singlePostContent.hashtags,
              ideas: singlePostContent.ideas,
              generationType,
              isSaved: false
            });

            console.log(`💾 Saved idea to database with ID: ${savedIdea.id}`);
            generatedIdeas.push(savedIdea);

            // Send individual result immediately
            sendEvent({ 
              type: 'content', 
              data: savedIdea,
              progress: {
                current: i + 1,
                total: apifyPosts.length
              }
            });

            console.log(`📡 Sent result ${i + 1} to frontend`);

            // Small delay to prevent overwhelming the client
            await new Promise(resolve => setTimeout(resolve, 500));
            
          } catch (error) {
            console.error(`❌ Error processing post ${i + 1}:`, error);
            sendEvent({ 
              type: 'error', 
              message: `Failed to generate content for post ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
          }
          }
        }

        // Send completion event
        sendEvent({ 
          type: 'complete', 
          message: `Generated ${generatedIdeas.length} content ideas`,
          totalGenerated: generatedIdeas.length
        });

      } catch (error) {
        sendEvent({ 
          type: 'error', 
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }

      res.end();
    } catch (error) {
      console.error("❌ Error in streaming content generation:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      res.status(500).json({ message: "Failed to generate content" });
    }
  });

  // Content generation routes (legacy - keeping for backward compatibility)
  app.post('/api/content/generate', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.uid;
      const { generationType, context } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user?.niche) {
        return res.status(400).json({ message: "User niche not set" });
      }

      let holidays;
      if (generationType === 'date') {
        holidays = await storage.getUpcomingHolidays(10);
      }

      // Use Gemini as primary AI service with Apify data integration
      let generatedContent;
      try {
        generatedContent = await generateInstagramContentWithGemini({
          niche: user.niche,
          generationType,
          context,
          competitors: user.competitors ? user.competitors.split(',').map(c => c.trim()) : [],
          // Apify data integration is now enabled by default
          holidays: holidays?.map(h => ({
            name: h.name,
            date: h.date.toISOString(),
            description: h.description || ''
          }))
        });
      } catch (error) {
        console.error('Gemini generation failed, trying OpenAI:', error);
        generatedContent = await generateInstagramContent({
          niche: user.niche,
          generationType,
          context,
          competitors,
          scrapedData,
          holidays: holidays?.map(h => ({
            name: h.name,
            date: h.date.toISOString(),
            description: h.description || ''
          }))
        });
      }

      // Save generated ideas to database
      const savedIdeas = [];
      for (const content of generatedContent) {
        const idea = await storage.createContentIdea({
          userId,
          headline: content.headline,
          caption: content.caption,
          hashtags: content.hashtags,
          ideas: content.ideas,
          generationType,
          isSaved: false
        });
        savedIdeas.push(idea);
      }

      res.json(savedIdeas);
    } catch (error) {
      console.error("Error generating content:", error);
      res.status(500).json({ message: "Failed to generate content" });
    }
  });

  // Content ideas routes
  app.get('/api/content/ideas', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.uid;
      const ideas = await storage.getUserContentIdeas(userId);
      res.json(ideas);
    } catch (error) {
      console.error("Error fetching content ideas:", error);
      res.status(500).json({ message: "Failed to fetch content ideas" });
    }
  });

  app.get('/api/content/ideas/saved', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.uid;
      const savedIdeas = await storage.getSavedContentIdeas(userId);
      res.json(savedIdeas);
    } catch (error) {
      console.error("Error fetching saved ideas:", error);
      res.status(500).json({ message: "Failed to fetch saved ideas" });
    }
  });

  app.patch('/api/content/ideas/:id/save', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const ideaId = parseInt(req.params.id);
      const { isSaved } = req.body;
      
      await storage.updateContentIdeaSaved(ideaId, isSaved);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating saved status:", error);
      res.status(500).json({ message: "Failed to update saved status" });
    }
  });

  // Scheduled posts routes
  app.post('/api/posts/schedule', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.uid;
      const postData = insertScheduledPostSchema.parse({
        ...req.body,
        userId
      });
      
      const scheduledPost = await storage.createScheduledPost(postData);
      
      // Schedule notification for this post
      notificationService.schedulePostNotification(scheduledPost.id, scheduledPost.scheduledDate);
      
      res.json(scheduledPost);
    } catch (error) {
      console.error("Error scheduling post:", error);
      res.status(500).json({ message: "Failed to schedule post" });
    }
  });

  app.get('/api/posts/scheduled', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.uid;
      const scheduledPosts = await storage.getUserScheduledPosts(userId);
      res.json(scheduledPosts);
    } catch (error) {
      console.error("Error fetching scheduled posts:", error);
      res.status(500).json({ message: "Failed to fetch scheduled posts" });
    }
  });

  app.patch('/api/posts/scheduled/:id', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const postId = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedPost = await storage.updateScheduledPost(postId, updates);
      res.json(updatedPost);
    } catch (error) {
      console.error("Error updating scheduled post:", error);
      res.status(500).json({ message: "Failed to update scheduled post" });
    }
  });

  app.delete('/api/posts/scheduled/:id', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const postId = parseInt(req.params.id);
      await storage.deleteScheduledPost(postId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting scheduled post:", error);
      res.status(500).json({ message: "Failed to delete scheduled post" });
    }
  });

  // Hashtag optimization route
  app.post('/api/content/optimize-hashtags', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const { niche, caption } = req.body;
      
      // Use Gemini as primary service, fallback to OpenAI
      let optimizedHashtags;
      try {
        optimizedHashtags = await optimizeHashtagsWithGemini(niche, caption);
      } catch (error) {
        console.error('Gemini hashtag optimization failed, trying OpenAI:', error);
        optimizedHashtags = await optimizeHashtags(niche, caption);
      }
      
      res.json({ hashtags: optimizedHashtags });
    } catch (error) {
      console.error("Error optimizing hashtags:", error);
      res.status(500).json({ message: "Failed to optimize hashtags" });
    }
  });

  // Content refine route
  app.post('/api/content/refine', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const { idea, message, chatHistory } = req.body;
      
      if (!idea || !message) {
        return res.status(400).json({ message: 'Idea and message are required' });
      }

      // Import the refine function
      const { refineContentWithGemini } = await import('./gemini');
      
      const refinedResponse = await refineContentWithGemini(idea, message, chatHistory || []);
      
      res.json({ response: refinedResponse });
    } catch (error) {
      console.error('Error refining content:', error);
      res.status(500).json({ message: 'Failed to refine content' });
    }
  });

  // Apify integration testing routes
  app.post('/api/apify/test-trending', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const { niche } = req.body;
      
      if (!niche) {
        return res.status(400).json({ message: "Niche is required" });
      }

      if (!apifyScraper) {
        return res.status(400).json({ 
          message: "Apify API not configured. Please provide APIFY_API_TOKEN environment variable.",
          error: "APIFY_NOT_CONFIGURED"
        });
      }

      const trendingPosts = await apifyScraper.searchTrendingPosts(niche, 5);
      const formattedPosts = apifyScraper.formatPostsForAI(trendingPosts);

      res.json({ 
        posts: formattedPosts,
        totalPosts: trendingPosts.length,
        message: "Successfully fetched trending posts from Apify"
      });
    } catch (error) {
      console.error("Error testing Apify integration:", error);
      res.status(500).json({ 
        message: "Failed to fetch trending posts from Apify",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post('/api/apify/test-competitors', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const { competitors } = req.body;
      
      if (!competitors || !Array.isArray(competitors) || competitors.length === 0) {
        return res.status(400).json({ message: "Competitors array is required" });
      }

      if (!apifyScraper) {
        return res.status(400).json({ 
          message: "Apify API not configured. Please provide APIFY_API_TOKEN environment variable.",
          error: "APIFY_NOT_CONFIGURED"
        });
      }

      const instagramUrls = apifyScraper.convertUsernamesToUrls(competitors);
      const competitorPosts = await apifyScraper.scrapeCompetitorProfiles(instagramUrls, 3);
      const formattedPosts = apifyScraper.formatPostsForAI(competitorPosts);

      res.json({ 
        posts: formattedPosts,
        totalPosts: competitorPosts.length,
        instagramUrls: instagramUrls,
        message: "Successfully fetched competitor posts from Apify"
      });
    } catch (error) {
      console.error("Error testing Apify competitor integration:", error);
      res.status(500).json({ 
        message: "Failed to fetch competitor posts from Apify",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}