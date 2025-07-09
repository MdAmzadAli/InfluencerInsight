import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateUser, AuthenticatedRequest } from "./auth";
import { checkDatabaseHealth } from "./db";
import { generateInstagramContent, optimizeHashtags } from "./openai";
import { generateInstagramContentWithGemini, optimizeHashtagsWithGemini, analyzeCompetitorContent } from "./gemini";
import { instagramScraper } from "./instagram-scraper";
import { advancedInstagramScraper } from "./instagram-api";
import { realInstagramScraper } from "./instagram-real-scraper";
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

  // Content generation routes
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

      // Scrape competitor data if competitors are provided and generation type is competitor
      let scrapedData: any[] = [];
      const competitors = user.competitors ? user.competitors.split(',').map(c => c.trim()) : [];
      
      if ((generationType === 'competitor' || generationType === 'trending') && competitors.length > 0) {
        try {
          const competitorUsernames = competitors.map(c => c.replace(/^@+/, '').trim());
          
          console.log('Scraping Instagram profiles for AI analysis:', competitorUsernames);
          
          // Use real Instagram scraper for authentic data
          scrapedData = await realInstagramScraper.scrapeMultipleProfiles(competitorUsernames, 10);
          console.log('Successfully scraped real data for', scrapedData.length, 'profiles');
        } catch (error) {
          console.error('All Instagram scraping methods failed:', error);
          // Return error to user - scraping is mandatory for this feature
          return res.status(400).json({ 
            message: "Instagram scraping failed. Real data is required for competitor and trending analysis. Please try again or check if the competitor usernames are correct.",
            error: "SCRAPING_FAILED"
          });
        }
      }

      // Use Gemini as primary AI service, fallback to OpenAI if needed
      let generatedContent;
      try {
        generatedContent = await generateInstagramContentWithGemini({
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

  const httpServer = createServer(app);
  return httpServer;
}